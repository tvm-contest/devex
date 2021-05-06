pragma ton-solidity ^0.38.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

import "./DensBid.sol";

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

    uint32 public prolongGrace;

    TvmCell public bid_code;   // OTP (one-time programmable)
    bool public bid_code_fuse; // OTP fuse protecting the code

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Revealing

    address public top_bid;
    uint128 public top_bid_amt;

    address public sec_bid;
    uint128 public sec_bid_amt;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Constructor - can't be constructed directly, must be installed to a platform

    constructor() public { revert(Errors.DEPLOY_FORBIDDEN); }  // Cannot be deployed directly!

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Fallback functions and add funds manually (IAddBalance)

    receive() external pure { revert(Errors.RECEIVE_FORBIDDEN); }
    fallback() external pure { revert(Errors.FALLBACK_FORBIDDEN); }

    function addBalance() external pure override { emit balanceAdded(msg.sender, msg.value); }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Complete installation

    function onCodeUpgrade(TvmCell data)
        private
    {
        tvm.resetStorage();
        TvmSlice s = data.toSlice();
        (root, name) = s.decode(address, string);
        start = 0; endBid = 0; endRev = 0; expiry = 0;
        top_bid = address(0); sec_bid = address(0);
        top_bid_amt = 0; sec_bid_amt = 0;
        bid_code_fuse = false;
        prolongGrace = 0;
        emit deployed(root, name);
    }

    function installBidCode(TvmCell code)
        external override onlyRoot
    {
        require(bid_code_fuse == false, Errors.BID_FUSE_BLOWN);
        bid_code_fuse = true; // blown
        bid_code = code;
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Bidding and initialization

    function inquiryRequest(uint128 rhash, uint32 _expiry) external view responsible override onlyRoot returns (uint128, bool, uint32) {
        return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} (rhash, (endBid == 0) || (now < endBid), _expiry);
    }

    function participateProxy(RegPartReq rpr, uint128 rhash, uint32 _expiry)
        external responsible override onlyRoot
        returns (uint128, bool)
    {
        uint128 bal = address(this).balance - msg.value;
        bool res = participate(rpr.sender, rpr.duration, rpr.hash, _expiry);
        tvm.rawReserve(bal + 1 ton, 0);
        return {value: 0, bounce: true, flag: MsgFlag.AllBalance} (rhash, res);
    }

    function participate(address sender, uint32 duration, uint256 hash, uint32 __expiry)
        private
        returns (bool)
    {
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
                prolongGrace = DeNS.ProlongGrace;
            }
        }
        if (now >= endBid)
            return false;
        // hashes[sender] = hash;
        // DensBid b =
        new DensBid{
            value: DeNS.BidInitPrice,
            code: bid_code,
            varInit: {
                auction: address(this),
                start: start,
                owner: sender
            },
            flag: MsgFlag.AddTranFees
        }(hash, endBid, endRev);
        emit bid_ev(sender, hash);
        return true;
    }

    function bid(uint256 hash)
        external responsible override
        returns(bool)
    {
        require(msg.value >= DeNS.BidMinValue, Errors.VALUE_TOO_LOW);
        return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} participate(msg.sender, 0, hash, 0);
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Find bid

    function _find_bid(address owner)
        internal view
        returns(address)
    {
        TvmCell stateInit = tvm.buildStateInit({
            contr: DensBid,
            code: bid_code,
            varInit: {
                auction: address(this),
                start: start,
                owner: owner
            }
        });
        return address(tvm.hash(stateInit));
    }

    function findBid(address bidder)
        external view responsible override
        returns(address)
    {
        return _find_bid(bidder);
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Revealing done in DensBid only

    function revealInt(address owner, uint128 amount)
        external override
    {
        require(msg.sender == _find_bid(owner), Errors.INVALID_ADDRESS);
        // top_bid top_bid_amt; sec_bid sec_bid_amt;
        require(msg.value > amount, Errors.VALUE_TOO_LOW);
        if (amount <= sec_bid_amt) {
            IAddBalance(msg.sender).addBalance{value: 0, bounce: true, flag: MsgFlag.MsgBalance}();
            return;
        }
        if (amount <= top_bid_amt) {
            sec_bid = msg.sender;
            sec_bid_amt = amount;
            emit new_second(sec_bid, sec_bid_amt);
            IAddBalance(msg.sender).addBalance{value: 0, bounce: true, flag: MsgFlag.MsgBalance}();
            return;
        }
        uint128 bal = address(this).balance - msg.value;
        if (top_bid_amt != 0) {
            IAddBalance(top_bid).addBalance{value: top_bid_amt}();
            sec_bid = top_bid;
            sec_bid_amt = top_bid_amt;
            emit new_second(sec_bid, sec_bid_amt);
            bal -= top_bid_amt;
        }
        top_bid = msg.sender;
        top_bid_amt = amount;
        emit new_first(top_bid, top_bid_amt);
        tvm.rawReserve(bal + amount, 0);
        emit revealed(owner, amount);
        owner.transfer({value: 0, bounce: true, flag: MsgFlag.AllBalance}); // return gas change
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Finalizing

    function finalize()
        external responsible override
        returns(bool)
    {
        if ((top_bid_amt == 0) && (Now() >= endBid + prolongGrace)) {
            // Auction failed
            IDensRoot(root).auctionFailed(name);
            emit failed();
            return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} true;
        }
        if (now < endRev + prolongGrace)
            return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} false;
        if (now < minfinal + prolongGrace)
            return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} false;
        tvm.accept();
        uint128 paid = sec_bid_amt;
        if (sec_bid_amt > 0) {
            uint128 remainder = top_bid_amt - sec_bid_amt;
            paid = top_bid_amt;
            IAddBalance(top_bid).addBalance{value: remainder, bounce: true, flag: 0}();
        }
        IDensRoot(root).auctionSucceeded(name, top_bid, expiry);
        emit finalized(top_bid, paid, expiry);
        return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} true;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Destruction

    function destroy()
        external override onlyRoot
    {
        if (Now() >= endRev)
            IDensRoot(root).auctionSink{ value: 0, bounce: false, flag: MsgFlag.SelfDestruct }();
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Modifiers

    modifier onlyRoot()
    {
        require(msg.sender == root, Errors.NOT_ROOT);
        _;
    }

    modifier retRem()
    {
        _;
        msg.sender.transfer({value: 0, bounce: false, flag: MsgFlag.MsgBalance});
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Events

    event deployed(address root, string name);
    event initialized(uint32 start, uint32 endBid, uint32 endRev, uint32 expiry);
    event bid_ev(address sender, uint256 hash);
    event revealed(address sender, uint128 amount);
    event new_first(address sender, uint128 amount);
    event new_second(address sender, uint128 amount);
    event returned(address dest, uint128 amount);
    event failed();
    event finalized(address winner, uint128 paid, uint32 expiry);
    event balanceAdded(address donor, uint128 value);

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Now() for IT

    function Now() pure virtual internal inline returns (uint32) { return now; }

}