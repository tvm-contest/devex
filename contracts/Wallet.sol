pragma ton-solidity >= 0.35.0;
pragma AbiHeader expire;
import "Subscription.sol";

contract Wallet {

    TvmCell subscr_Image;

    constructor(TvmCell image) public {

        require(tvm.pubkey() != 0, 101);
        require(msg.pubkey() == tvm.pubkey(), 102);
        tvm.accept();
        subscr_Image = image; 
    }

    function sendTransaction(address dest, uint128 value, bool bounce, uint256 serviceKey, uint32 period) public view {
        TvmCell wImage = tvm.buildStateInit({
            code: tvm.code(),
            pubkey: tvm.pubkey()
        });
        TvmCell code = subscr_Image.toSlice().loadRef();
        TvmCell newImage = tvm.buildStateInit({
            code: code,
            pubkey: tvm.pubkey()
            varInit: { 
                serviceKey: serviceKey,
                user_wallet: address(tvm.hash(wImage)),
                to: dest,
                value: value,
                period: period
            },
            contr: Subscription
        });
        require(msg.pubkey() == tvm.pubkey() || msg.sender == address(tvm.hash(newImage)), 100);
	tvm.accept();
        dest.transfer(value, bounce, 0);
    }
}
