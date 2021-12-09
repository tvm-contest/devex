pragma ton-solidity ^0.38.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

import "./Interfaces.sol";
import "./Libraries.sol";
import "./Structures.sol";

//       *--------------*
//     /              / |
//   /              /   | <- Auction
// *--------------*     |
// | DeNS         |-----*
// |     Auction  |   / *
// |  ( Type 2 )  | / /
// *--------------* /
// *--------------*
// | 'HelloWorld' | <- Platform type 2
// *--------------*

contract DensAuction is IDensAuction, IAddBalance {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Variables

    address public root;
    string public name;
    uint32 public start;
    uint32 public endBid;
    uint32 public endRev;
    uint32 public expiry;
    uint32 public minfinal;

    mapping(address => uint256) public hashes;
    mapping(address => uint128) public reveals;
    mapping(address => bool) public withdrawn;

    address public reveal_1;
    address public reveal_2;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Constructor - can't be constructed directly, must be installed to a platform

    constructor() public { revert(); }  // Cannot be deployed directly!

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Fallback functions and add funds manually (IAddBalance)

    receive() external pure { revert(); }
    fallback() external pure { revert(); }

    function addBalance() external pure override { emit balanceAdded(msg.sender, msg.value); }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Complete installation

    function onCodeUpgrade(TvmCell data) private {
        tvm.resetStorage();
        TvmSlice s = data.toSlice();
        (root, name) = s.decode(address, string);
        start = 0; endBid = 0; endRev = 0; expiry = 0;
        emit deployed(root, name);
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Bidding and initialization

    function inquiryRequest(uint128 rhash, uint32 _expiry) external view responsible override onlyRoot returns (uint128, bool, uint32) {
        return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} (rhash, (endBid == 0) || (now < endBid), _expiry);
    }

    function participateProxy(RegPartReq rpr, uint128 rhash, uint32 _expiry) external responsible override
                                                            onlyRoot returns (uint128, bool) {
        uint128 bal = address(this).balance - msg.value;
        bool res = participate(rpr.sender, rpr.duration, rpr.hash, _expiry);
        tvm.rawReserve(bal + 1 ton, 0);
        return {value: 0, bounce: true, flag: MsgFlag.AllBalance} (rhash, res);
    }

    function participate(address sender, uint32 duration, uint256 hash, uint32 __expiry) private returns (bool) {
        require((endBid != 0) || (duration > 0), Errors.AUCTION_NOT_INIT);
        if (endBid == 0) {
            start = now;
            uint32 dur = math.min(duration, DeNS.MaxPeriodYears);
            endBid = start + DeNS.BidPeriodPerYear * dur;
            endRev = endBid + DeNS.RevealPeriodPerYear * dur;
            uint256 _expiry = uint256(endRev) + uint256(duration) * uint256(365 days);
            if (_expiry > 0xFFFFFFFF) _expiry = 0xFFFFFFFF;
            expiry = uint32(_expiry);
            emit initialized(start, endBid, endRev, expiry);
            IDensRoot(root).ensureExpiry(name, endRev);
            if (__expiry > 0) {
                minfinal = __expiry;
            }
        }
        if (now >= endBid)
            return false;
        hashes[sender] = hash;
        emit bid_ev(sender, hash);
        return true;
    }

    function bid(uint256 hash) external responsible override returns(bool) {
        require(msg.value >= DeNS.BidMinValue, Errors.VALUE_TOO_LOW);
        return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} participate(msg.sender, 0, hash, 0);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Revealing

    function reveal(uint128 amount, uint256 nonce) external responsible override returns(bool) {
        if ((now < endBid) || (now >= endRev))
            return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} false;
        optional(uint128) rev = reveals.fetch(msg.sender);
        require(!rev.hasValue(), Errors.ALREADY_REVEALED);
        TvmBuilder b; b.store(amount, nonce); uint256 rhash = tvm.hash(b.toCell());
        require(rhash == hashes[msg.sender], Errors.INCORRECT_HASH);
        require(msg.value >= amount + 1 ton, Errors.VALUE_TOO_LOW);
        reveals[msg.sender] = amount;
        emit revealed(msg.sender, amount, nonce);
        uint128 amount_1 = (reveal_1 != address(0)) ? reveals[reveal_1] : 0;
        uint128 amount_2 = (reveal_2 != address(0)) ? reveals[reveal_2] : 0;
         if (amount > amount_1) {
             emit new_first(msg.sender, amount);
             emit new_second(reveal_1, amount_1);
             reveal_2 = reveal_1;
             reveal_1 = msg.sender;
         }
        else if (amount > amount_2) {
             emit new_second(msg.sender, amount);
             reveal_2 = msg.sender;
         }
        uint128 bal = address(this).balance - msg.value;
        tvm.rawReserve(bal + amount, 0);
        return {value: 0, bounce: true, flag: MsgFlag.AllBalance} true;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Finalizing

    function finalize() external responsible override returns(bool) {
        if ((reveal_1 == address(0)) && (now >= endBid)) {
            // Auction failed
            IDensRoot(root).auctionFailed(name);
            emit failed();
            return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} true;
        }
        if (now < endRev)
            return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} false;
        if (now < minfinal)
            return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} false;
        tvm.accept();
        optional(address, uint128) pair = reveals.min();
        while (pair.hasValue()) {
            (address a, uint128 v) = pair.get();
            if (a == reveal_1) {
                if (reveal_2 != address(0)) {
                    IBidder(a).returnBid{ bounce: false, value: v - reveals[reveal_2] }(name);
                } else {
                    // If there is only one participant he will pay a small fixed price, incentivize revealing
                    if (v > DeNS.SingleFixedPrice) {
                        IBidder(a).returnBid{ bounce: false, value: v - DeNS.SingleFixedPrice }(name);
                        emit returned(a, v - DeNS.SingleFixedPrice);
                    }
                }
            } else {
                // Return everyone else their bids
                IBidder(a).returnBid{ bounce: false, value: v }(name);
                emit returned(a, v);
            }
            pair = reveals.next(a);
        }
        IDensRoot(root).auctionSucceeded(name, reveal_1, expiry);
        emit finalized(reveal_1, expiry);
        return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} true;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Destruction

    function destroy() external override onlyRoot {
        IDensRoot(root).auctionSink{ value: 0, bounce: false, flag: MsgFlag.SelfDestruct }();
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Modifiers

    modifier onlyRoot() { require(msg.sender == root, Errors.NOT_ROOT); _; }
    modifier retRem() { _; msg.sender.transfer({value: 0, bounce: false, flag: MsgFlag.MsgBalance}); }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Events

    event deployed(address root, string name);
    event initialized(uint32 start, uint32 endBid, uint32 endRev, uint32 expiry);
    event bid_ev(address sender, uint256 hash);
    event revealed(address sender, uint128 amount, uint256 nonce);
    event new_first(address sender, uint128 amount);
    event new_second(address sender, uint128 amount);
    event returned(address dest, uint128 amount);
    event failed();
    event finalized(address winner, uint32 expiry);
    event balanceAdded(address donor, uint128 value);

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}