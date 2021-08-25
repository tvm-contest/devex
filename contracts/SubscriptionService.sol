pragma ton-solidity >=0.47.0;
pragma AbiHeader expire;
pragma AbiHeader time;
pragma AbiHeader pubkey;

contract SubscriptionService {

    TvmCell params;
    uint256 static serviceKey;
    ServiceParams svcparams;

    struct ServiceParams {
        address to;
        uint128 value;
        uint32 period;
        address myaddress;
        string name;
        string description;
    }

    modifier onlyOwner {
		require(msg.pubkey() == tvm.pubkey(), 100);
		tvm.accept();
		_;
    }

    constructor(bytes signature, TvmCell svc_params) public {
        TvmCell code = tvm.code();
        require(msg.sender != address(0), 101);
        require(tvm.checkSign(tvm.hash(code), signature.toSlice(), tvm.pubkey()), 102);
        require(tvm.checkSign(tvm.hash(code), signature.toSlice(), serviceKey), 103);
        (svcparams.to, svcparams.value, svcparams.period, svcparams.name, svcparams.description) = svc_params.toSlice().decode(address, uint128, uint32, string, string);
        params = svc_params;
    }

    function selfdelete() public onlyOwner {
        selfdestruct(svcparams.to);
    }
}