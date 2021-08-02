pragma ton-solidity >= 0.35.0;
pragma AbiHeader expire;
import "Subscription.sol";

contract Wallet {

    TvmCell subscr_Image;
    address public myaddress;
    address public last_req_exp_address;
    address public last_req_real_address;
    address public mdest;
    uint128 public mvalue;
    bool public mbounce;
    uint256 public mserviceKey;
    uint32 public mperiod;


    constructor(TvmCell image) public {

        require(tvm.pubkey() != 0, 101);
        require(msg.pubkey() == tvm.pubkey(), 102);
        tvm.accept();
        subscr_Image = image;
        TvmCell wImage = tvm.buildStateInit({
            code: tvm.code(),
            pubkey: tvm.pubkey()
        });
        myaddress = address(tvm.hash(wImage));
    }

    function sendTransaction(address dest, uint128 value, bool bounce, uint256 serviceKey, uint32 period) public {
        tvm.accept();
        TvmCell newImage = tvm.buildStateInit({
            code: subscr_Image.toSlice().loadRef(),
            pubkey: tvm.pubkey(),
            varInit: {
                serviceKey: serviceKey,
                user_wallet: myaddress,
                to: dest,
                value: value,
                period: period
            },
            contr: Subscription
        });
        last_req_exp_address = address(tvm.hash(newImage));
        last_req_real_address = msg.sender;
        mdest = dest;
        mvalue = value;
        mbounce = bounce;
        mserviceKey = serviceKey;
        mperiod = period;
        require(msg.pubkey() == tvm.pubkey() || msg.sender == address(tvm.hash(newImage)), 100);
        dest.transfer(value, bounce, 0);
        if (msg.isInternal) {
             msg.sender.transfer(0, false, 64);
        }
    }
}
