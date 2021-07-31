pragma ton-solidity >= 0.35.0;
pragma AbiHeader expire;
import "Subscription.sol";

contract Wallet {

    TvmCell subscr_Image;
    address public myaddress;
    address public last_req_exp_address;
    address public last_req_real_address;

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

    function sendTransaction(address dest, uint64 value, bool bounce, uint256 serviceKey, uint32 period) public {
        tvm.accept();
        TvmCell code = subscr_Image.toSlice().loadRef();
        TvmCell newImage = tvm.buildStateInit({
            code: code,
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
        require(msg.pubkey() == tvm.pubkey() || msg.sender == address(tvm.hash(newImage)), 100);
        dest.transfer(value, bounce, 0);
    }
}
