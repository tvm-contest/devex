pragma ton-solidity ^0.47.0;
pragma AbiHeader time;
pragma AbiHeader expire;

interface IWallet {
    function sendTransaction (address dest, uint128 value, bool bounce) external;
}

contract Subscription {

    mapping (uint256 => Payment) subscriptions;
    uint256 _owner;

    uint256 public static serviceKey;
    
    uint8 constant STATUS_ACTIVE   = 1;
    uint8 constant STATUS_EXECUTED = 2;

    address wallet = address(0x8e3a81dc785b593164ec009c2c41f0971e48cbb124ed65ebea388181be307827);

    struct Payment {
        uint256 pubkey;
        address to;
        uint64 value;
        uint32 period;
        uint32 start;
        uint8 status;
    }

    modifier onlyOwner {
        require(msg.pubkey() == tvm.pubkey(), 100);        
        _;
    }
    constructor() public {
        tvm.accept();
    }

    function getWallet() public view returns (address) {
        return wallet;
    }

    function getSubscription(uint256 subscriptionId) public view returns (Payment) {
        return subscriptions[subscriptionId];
    }

    function subscribe(
        uint256 subscriptionId,
        uint256 pubkey,
        address to,
        uint64 value,
        uint32 period) public onlyOwner {
        require(subscriptionId != 0 &&
            value > 0 &&
            period > 0, 101);
        tvm.accept();
        subscriptions[subscriptionId] = Payment(pubkey, to, value, period, 0, STATUS_ACTIVE);
    }

    function cancel(uint256 subscriptionId) public onlyOwner {
        require(subscriptions[subscriptionId].status != 0, 101);
        tvm.accept();
        delete subscriptions[subscriptionId];
    }

    function executeSubscription(uint256 subscriptionId) public {
        Payment subscr = subscriptions[subscriptionId];
        require(subscr.status != 0, 101);
        if (now > (subscr.start + subscr.period)) {
            subscr.start = uint32(now);
        } else {
            require(subscr.status != STATUS_EXECUTED, 103);
        }
        tvm.accept();
        IWallet(wallet).sendTransaction{value: 1 ton, bounce: false, flag: 64}(subscr.to, subscr.value, false);
        subscr.status = STATUS_EXECUTED;

        subscriptions[subscriptionId] = subscr;
    }

    function onSuccess(uint32 sdkError, uint32 exitCode) public {
    }

    function onError(uint32 sdkError, uint32 exitCode) public {
    }
    
    function sendAllMoney(address dest_addr) public onlyOwner {
        tvm.accept();
        selfdestruct(dest_addr);
    }
}
