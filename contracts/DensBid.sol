pragma ton-solidity ^0.38.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

import "./Interfaces.sol";
import "./Libraries.sol";
import "./Structures.sol";

//       *--------------*
//     / |            / |
//   /   |          /   |
// *-----+--------*     |
// | DeNS*--------+-----*
// |   / Auction  |   /
// | /     Bid    | /
// *--------------*

contract DensBid is IDensBid, IAddBalance {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Variables

    address public static auction;
    uint32 public static start;
    address public static owner;

    uint256 public hash;
    uint32 public endBid;
    uint32 public endRev;

    bool public revealed;

    bytes public box;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Constructor

    constructor(uint256 hash_val, uint32 end_bid, uint32 end_rev) public {
        require(msg.sender == auction, Errors.NOT_MY_AUCTION);
        hash = hash_val;
        endBid = end_bid;
        endRev = end_rev;
        revealed = false;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Fallback functions and add funds manually (IAddBalance)

    receive() external pure { revert(Errors.RECEIVE_FORBIDDEN); }
    fallback() external pure { revert(Errors.FALLBACK_FORBIDDEN); }

    function addBalance() external pure override { }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Box

    function put(bytes new_box)
        external override onlyOwner
    {
        box = new_box;
        msg.sender.transfer({value: 0, bounce: true, flag: MsgFlag.MsgBalance});
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Update hash (bid)

    function bid(uint256 hash_val)
        external responsible override onlyOwner
        returns(bool)
    {
        if (Now() >= endBid)
            return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} false;
        hash = hash_val;
        return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} true;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Reveal

    function reveal(uint128 amount, uint256 nonce)
        external override onlyOwner
    {
        require(Now() >= endBid, Errors.INVALID_PHASE);
        require(Now() < endRev, Errors.INVALID_PHASE);
        require(!revealed, Errors.ALREADY_REVEALED);
        TvmBuilder b; b.store(owner, amount, nonce); uint256 rhash = tvm.hash(b.toCell());
        require(rhash == hash, Errors.INCORRECT_HASH);
        require(amount >= DeNS.BidMinAmount, Errors.AMOUNT_TOO_LOW);
        require(msg.value >= amount + DeNS.BidRevealAdd, Errors.VALUE_TOO_LOW);
        IDensAuction(auction).revealInt{value: 0, bounce: true, flag: MsgFlag.MsgBalance}(owner, amount);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Withdraw

    function withdraw()
        external override onlyOwner
    {
        require(Now() >= endRev, Errors.INVALID_PHASE);
        owner.transfer({ value: 0, bounce: false, flag: MsgFlag.SelfDestruct });
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Modifiers

    modifier onlyOwner()
    {
        require(msg.sender == owner, Errors.NOT_MY_OWNER);
        _;
    }

    modifier onlyAuction()
    {
        require(msg.sender == auction, Errors.NOT_MY_AUCTION);
        _;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Now() for IT

    function Now() pure virtual internal inline returns (uint32) { return now; }

}