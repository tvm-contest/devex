pragma ton-solidity ^0.47.0;
pragma AbiHeader time;
pragma AbiHeader expire;


contract SubscriptionService {

    address static to;
    uint128 static value;
    uint32 static  period;
    uint256 public serviceKey;

    constructor(bytes signature) public {
        TvmCell code = tvm.code();
        optional(TvmCell) salt = tvm.codeSalt(code);
        require(salt.hasValue(), 101);
        serviceKey = salt.get().toSlice().decode(uint256);
        require(msg.sender != address(0), 101);
        require(tvm.checkSign(tvm.hash(code), signature.toSlice(), tvm.pubkey()), 102);
        require(tvm.checkSign(tvm.hash(code), signature.toSlice(), serviceKey), 103);
    }
}