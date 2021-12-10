pragma ton-solidity ^ 0.47.0;
pragma AbiHeader expire;
pragma AbiHeader time;
pragma AbiHeader pubkey;
import "SubscriptionIndex.sol";

interface IWallet {
    function paySubscription (uint256 serviceKey, bool bounce, TvmCell params) external responsible returns (uint8);
}

contract Subscription {

    uint256 static public serviceKey;
    address static public user_wallet;
    TvmCell static public svcParams;
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
    
    constructor(TvmCell image, bytes signature, address subsAddr) public {
        (address to, uint128 value, uint32 period) = svcParams.toSlice().decode(address, uint128, uint32);
        require(msg.value >= 1 ton, 100);
        require(value > 0 && period > 0, 102);
        tvm.accept();
        uint32 _period = period * 3600 * 24;
        uint128 _value = value * 1000000000;
        subscription = Payment(tvm.pubkey(), to, _value, _period, 0, STATUS_ACTIVE);
        TvmCell state = tvm.buildStateInit({
            code: image,
            pubkey: tvm.pubkey(),
            varInit: { 
                params: svcParams,
                user_wallet: user_wallet
            },
            contr: SubscriptionIndex
        });
        TvmCell stateInit = tvm.insertPubkey(state, tvm.pubkey());
        subscriptionIndexAddress = address(tvm.hash(stateInit));
        new SubscriptionIndex{value: 0.5 ton, flag: 1, bounce: true, stateInit: stateInit}(signature, subsAddr);
    }

    function getWallet() public view returns (address) {
        return user_wallet;
    }

    function getSubscription() public view returns (Payment) {
        return subscription;
    }

    function cancel() public {
        require(msg.sender == subscriptionIndexAddress, 106);
        selfdestruct(user_wallet);
    }

    function executeSubscription() public {
        require(msg.value >= 0.2 ton, 101);
        tvm.accept();
        require(subscription.status != 0, 101);
        if (now > (subscription.start + subscription.period)) {
            subscription.start = uint32(now);
        } else {
            require(subscription.status != STATUS_EXECUTED, 103);
        }
        tvm.accept();
        IWallet(user_wallet).paySubscription{value: 0.2 ton, bounce: false, flag: 0, callback: Subscription.onPaySubscription}(serviceKey, false, svcParams);
    }

    function onPaySubscription(uint8 status) public {
        if (status == 0) {
            subscription.status = STATUS_EXECUTED;
        }
    }
}
