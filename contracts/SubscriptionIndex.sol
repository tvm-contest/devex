pragma ton-solidity ^ 0.47.0;
pragma AbiHeader expire;
pragma AbiHeader time;
pragma AbiHeader pubkey;

contract SubscriptionIndex {
    TvmCell static params;
    address static user_wallet;
    uint256 public ownerKey;
    address public subscription_addr;

    constructor(bytes signature, address subsAddr) public {
        require(msg.sender != address(0), 101);
        TvmCell code = tvm.code();
        optional(TvmCell) salt = tvm.codeSalt(code);
        require(salt.hasValue(), 102);
        ownerKey = salt.get().toSlice().decode(uint256);
        require(tvm.checkSign(tvm.hash(code), signature.toSlice(), tvm.pubkey()), 103);
        require(tvm.checkSign(tvm.hash(code), signature.toSlice(), ownerKey), 104);
        require(subscription_addr != address(0), 105);
        subscription_addr = subsAddr;
    }

    function cancel() public {
        require(msg.sender == subscription_addr, 106);
        selfdestruct(user_wallet);
    }

}
