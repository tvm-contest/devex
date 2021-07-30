pragma ton-solidity ^0.47.0;
pragma AbiHeader time;
pragma AbiHeader expire;

interface IWallet {
    function sendTransaction (address dest, uint128 value, bool bounce, uint256 serviceKey, uint32 period) external;
}

contract Subscription {

    uint256 static serviceKey;
    address static user_wallet;
    address static to;
    uint64 static value;
    uint32 static period;

    uint256 _owner;
    
    uint8 constant STATUS_ACTIVE   = 1;
    uint8 constant STATUS_EXECUTED = 2;

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
    constructor() public {
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
        IWallet(user_wallet).sendTransaction{value: 1 ton, bounce: false, flag: 64}(subscription.to, subscription.value, false, serviceKey, 60);
        subscription.status = STATUS_EXECUTED;
    }

    function sendAllMoney(address dest_addr) public onlyOwner {
        tvm.accept();
        selfdestruct(dest_addr);
    }
}
