pragma ton-solidity ^ 0.47.0;
pragma AbiHeader expire;
pragma AbiHeader time;
import "Subscription.sol";

contract Wallet {

    TvmCell public subscr_Image;
    address public myaddress;
    address public last_req_exp_address;
    address public last_req_real_address;
    address public mdest;
    uint128 public mvalue;
    bool public mbounce;
    uint256 public mserviceKey;
    uint32 public mperiod;

    uint256 public tvmKey;
    uint256 public msgKey;

    constructor(TvmCell image, bytes signature) public {
        tvmKey = tvm.pubkey();
        msgKey = msg.pubkey();  // need to verify external message deployment
        require(tvm.pubkey() != 0, 101);
        require(tvm.checkSign(tvm.hash(tvm.code()), signature.toSlice(), tvm.pubkey()), 102);
        tvm.accept();
        subscr_Image = image;
        TvmCell wImage = tvm.buildStateInit({
            code: tvm.code(),
            pubkey: tvm.pubkey()
        });
        myaddress = address(tvm.hash(wImage));
    }

    function sendTransaction(uint256 serviceKey, bool bounce, TvmCell params) public {
        tvm.accept();
        TvmBuilder saltBuilder;
        saltBuilder.store(serviceKey);
        TvmCell code = tvm.setCodeSalt(
            subscr_Image.toSlice().loadRef(),
            saltBuilder.toCell()
        );
        TvmCell newImage = tvm.buildStateInit({
            code: code,
            pubkey: tvm.pubkey(),
            varInit: {
                serviceKey: serviceKey,
                user_wallet: myaddress,
                svcParams: params
            },
            contr: Subscription
        });
        last_req_exp_address = address(tvm.hash(newImage));
        last_req_real_address = msg.sender;
        (address to, uint128 value) = params.toSlice().decode(address, uint128);
        mdest = to;
        mvalue = value;
        mbounce = bounce;
        mserviceKey = serviceKey;
        require(msg.pubkey() == tvm.pubkey() || msg.sender == address(tvm.hash(newImage)), 100);
        to.transfer(value * 1000000000, bounce, 0);
        if (msg.isInternal) {
             msg.sender.transfer(0, false, 64);
        }
    }
}
