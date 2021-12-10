pragma ton-solidity ^ 0.47.0;
pragma AbiHeader expire;
pragma AbiHeader time;
pragma AbiHeader pubkey;

interface ISubscriptionContract {
    function cancel () external;
}

contract SubscriptionIndex {

    TvmCell public static params;
    address static user_wallet;
    uint256 public ownerKey;
    address public subscription_addr;


    modifier onlyOwner {
		require(msg.pubkey() == tvm.pubkey(), 100);
		tvm.accept();
		_;
    }

    constructor(bytes signature, address subsAddr) public {
        require(msg.value >= 0.5 ton, 102);
        require(msg.sender != address(0), 103);
        TvmCell code = tvm.code();
        optional(TvmCell) salt = tvm.codeSalt(code);
        require(salt.hasValue(), 104);
        ownerKey = salt.get().toSlice().decode(uint256);
        require(tvm.checkSign(tvm.hash(code), signature.toSlice(), tvm.pubkey()), 105);
        require(tvm.checkSign(tvm.hash(code), signature.toSlice(), ownerKey), 106);
        require(subsAddr != address(0), 107);
        subscription_addr = subsAddr;
    }

    function cancel() public onlyOwner {
        ISubscriptionContract(subscription_addr).cancel();
        selfdestruct(user_wallet);
    }
}
