pragma ton-solidity ^ 0.47.0;
pragma AbiHeader expire;
pragma AbiHeader time;
pragma AbiHeader pubkey;
import "SubscriptionIndex.sol";

interface IWallet {
    function sendTransaction (address dest, uint128 value, bool bounce, uint256 serviceKey, uint32 period) external;
}

interface ISubscriptionIndex {
    function cancel () external;
}

contract Subscription {

    uint256 static public serviceKey;
    address static public user_wallet;
    address static public to;
    uint128 static public value;
    uint32 static public period;
    
    TvmCell m_subscriptionIndexImage;
    TvmCell subscriptionIndexState;

    address subscriptionIndexAddress;

    uint8 constant STATUS_ACTIVE   = 1;
    uint8 constant STATUS_EXECUTED = 2;

    struct Payment {
        uint256 pubkey;
        address to;
        uint128 value;
        uint32 period;
        uint32 start;
        uint8 status;
    }
    Payment subscription;
    

    modifier onlyOwner {
		require(msg.pubkey() == tvm.pubkey(), 102);
		tvm.accept();
		_;
    }

    constructor(TvmCell image, bytes signature, TvmCell params) public {
        require(value > 0 && period > 0, 101);
        tvm.accept();
        subscription = Payment(tvm.pubkey(), to, value, period, 0, STATUS_ACTIVE);
        TvmCell state = tvm.buildStateInit({
            code: image,
            pubkey: tvm.pubkey(),
            varInit: { 
                params: params,
                user_wallet: user_wallet
            },
            contr: SubscriptionIndex
        });
        TvmCell stateInit = tvm.insertPubkey(state, tvm.pubkey());
        subscriptionIndexAddress = address(tvm.hash(stateInit));
        new SubscriptionIndex{value: 1 ton, flag: 1, bounce: true, stateInit: stateInit}(signature);
    }

    function getWallet() public view returns (address) {
        return user_wallet;
    }

    function getSubscription() public view returns (Payment) {
        return subscription;
    }

    function cancel() public onlyOwner {
        require(subscription.status != 0, 101);
        ISubscriptionIndex(subscriptionIndexAddress).cancel();
        selfdestruct(user_wallet);
    }

    function executeSubscription() public {
        require(subscription.status != 0, 101);
        if (now > (subscription.start + subscription.period)) {
            subscription.start = uint32(now);
        } else {
            require(subscription.status != STATUS_EXECUTED, 103);
        }
        tvm.accept();
        IWallet(user_wallet).sendTransaction{value: 1 ton, bounce: false, flag: 0}(subscription.to, subscription.value, false, serviceKey, 60);
        subscription.status = STATUS_EXECUTED;
    }
}
