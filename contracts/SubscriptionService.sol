pragma ton-solidity ^0.47.0;
pragma AbiHeader time;
pragma AbiHeader expire;


contract SubscriptionService {

    address static public to;
    uint128 static public value;
    uint32 static public period;
    uint256 public serviceKey;
    uint256 public tvmPubkey;
    uint256 public msgPubkey;

    constructor(bytes signature) public {
        TvmCell code = tvm.code();
        optional(TvmCell) salt = tvm.codeSalt(code);
        require(salt.hasValue(), 101);
        serviceKey = salt.get().toSlice().decode(uint256);
        msgPubkey = msg.pubkey();
        tvmPubkey = tvm.pubkey();
        require(msg.sender != address(0), 101);
        require(tvm.checkSign(tvm.hash(code), signature.toSlice(), tvm.pubkey()), 102);
        require(tvm.checkSign(tvm.hash(code), signature.toSlice(), serviceKey), 103);
    }
}