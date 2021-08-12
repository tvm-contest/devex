pragma ton-solidity ^ 0.47.0;

contract SubscriptionIndex {
    uint256 static subscr_pubkey;
    uint256 public ownerKey;
    uint256 public tvmKey;

    constructor(bytes signature) public {
        TvmCell code = tvm.code();
        optional(TvmCell) salt = tvm.codeSalt(code);
        require(salt.hasValue(), 101);
        ownerKey = salt.get().toSlice().decode(uint256);
        tvmKey = tvm.pubkey();
        //require(msg.sender != address(0), 101);
        //require(tvm.checkSign(tvm.hash(code), signature.toSlice(), tvm.pubkey()), 102);
        //require(tvm.checkSign(tvm.hash(code), signature.toSlice(), ownerKey), 103);
    }
}