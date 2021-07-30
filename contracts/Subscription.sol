pragma ton-solidity ^0.47.0;
pragma AbiHeader time;
pragma AbiHeader expire;

interface IWallet {
    function sendTransaction (address dest, uint128 value, bool bounce) external;
}

contract Subscription {

    uint256 _owner;

    uint256 public static serviceKey;
    
    uint8 constant STATUS_ACTIVE   = 1;
    uint8 constant STATUS_EXECUTED = 2;
    address user_wallet;
    address to;
    uint64 value;
    uint32 period;

    struct Payment {
        uint256 pubkey;
        address to;
        uint64 value;
        uint32 period;
        uint32 start;
        uint8 status;
    }
    Payment subscription;
    

    modifier onlyOwner {
        require(msg.pubkey() == tvm.pubkey(), 100);        
        _;
    }
    constructor(address u_wallet, address subscr_to, uint64 subscr_cost, uint32 subscr_period) public {
        user_wallet = u_wallet;
        to = subscr_to;
        value = subscr_cost;
        period = subscr_period;
        require(value > 0 && period > 0, 101);
        tvm.accept();
        subscription = Payment(tvm.pubkey(), to, value, period, 0, STATUS_ACTIVE);
    }

    function getWallet() public view returns (address) {
        return user_wallet;
    }

    function getSubscription() public view returns (Payment) {
        return subscription;
    }

    function cancel() public onlyOwner {
        require(subscription.status != 0, 101);
        tvm.accept();
        delete subscription;
    }

    function executeSubscription() public {
        require(subscription.status != 0, 101);
        if (now > (subscription.start + subscription.period)) {
            subscription.start = uint32(now);
        } else {
            require(subscription.status != STATUS_EXECUTED, 103);
        }
        tvm.accept();
        IWallet(user_wallet).sendTransaction{value: 1 ton, bounce: false, flag: 64}(subscription.to, subscription.value, false);
        subscription.status = STATUS_EXECUTED;
    }

    function sendAllMoney(address dest_addr) public onlyOwner {
        tvm.accept();
        selfdestruct(dest_addr);
    }
}
