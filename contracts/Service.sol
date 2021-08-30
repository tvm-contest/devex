pragma ton-solidity >=0.47.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

//================================================================================
//
import "../interfaces/IOwnable.sol";
import "../contracts/Subscription.sol";
import "../interfaces/IService.sol";
import "../interfaces/ISubscribeMultisig.sol";

//================================================================================
//
contract Service is IOwnable, IService
{
    //========================================
    // Error codes
    uint constant ERROR_MESSAGE_SENDER_IS_NOT_MY_SUBSCRIPTION = 101;

    //========================================
    // Variables
    TvmCell static _subscriptionCode; // 
    mapping(uint256 => SubscriptionPlan) _plans;
    
    //========================================
    //
    constructor(address ownerAddress) public
    {
        tvm.accept();
        _ownerAddress = ownerAddress;
    }
    
    //========================================
    //
    function getSubscriptionPlans() external view override returns (SubscriptionPlan[] plans)
    {
        for((, SubscriptionPlan sub) : _plans)
        {
            plans.push(sub);
        }
    }

    function addSubscriptionPlan(uint256 planID, uint32 period, uint128 periodPrice) external override onlyOwner reserve returnChange
    {
        _plans[planID].planID      = planID;
        _plans[planID].period      = period;
        _plans[planID].periodPrice = periodPrice;        
    }

    function removeSubscriptionPlan(uint256 planID) external override onlyOwner reserve returnChange
    {
        delete _plans[planID];
    }
    
    //========================================
    // Subscription functions
    function calculateFutureSubscriptionAddress(address walletAddress) private inline view returns (address, TvmCell)
    {
        TvmCell stateInit = tvm.buildStateInit({
            contr: Subscription,
            varInit: {
                _walletAddress:  walletAddress,
                _serviceAddress: address(this)
            },
            code: _subscriptionCode
        });

        return (address(tvm.hash(stateInit)), stateInit);
    }

    //========================================
    //
    function confirmSubscription(address walletAddress, uint256 subscriptionPlan, uint32 period, uint128 periodPrice) external responsible override returns (bool confirmed)
    {
        (address subscriptionAddress, ) = calculateFutureSubscriptionAddress(walletAddress);
        require(msg.sender == subscriptionAddress, ERROR_MESSAGE_SENDER_IS_NOT_MY_SUBSCRIPTION);

        _reserve();

        if(!_plans.exists(subscriptionPlan))
        {
            return {value: 0, flag: 128}(false);
        }

        SubscriptionPlan p = _plans[subscriptionPlan];
        confirmed = (p.period == period && p.periodPrice == periodPrice);

        // Collect subscription fee;
        _ownerAddress.transfer(periodPrice, false, 1);

        return {value: 0, flag: 128}(confirmed);        
    }

    //========================================
    // Greedy Service won't return any change. Fair and honest Service will return unspent change to the Wallet;
    function cancelSubscription(address walletAddress, uint256 subscriptionPlan, uint32 period, uint128 periodPrice, uint32 lastPaid) external override
    {
        (address subscriptionAddress, ) = calculateFutureSubscriptionAddress(walletAddress);
        require(msg.sender == subscriptionAddress, ERROR_MESSAGE_SENDER_IS_NOT_MY_SUBSCRIPTION);

        _reserve();

        // No plan, return change to the Wallet;
        if(!_plans.exists(subscriptionPlan))
        {
            walletAddress.transfer(0, false, 128);
            return;
        }

        // Do we actually need to return any change or Subscription expired?        
        if(lastPaid + period < now)
        {}
        else
        {
            uint128 unspentAmount = periodPrice - math.muldiv(periodPrice, (now - lastPaid), period);
            unspentAmount;

            // Pretend to be greedy and don't return "unspentAmount" to "walletAddress";
            // Whoever is reading this: 
            //  - First:  congratulations for coming this far!
            //  - Second: please, it's a feature, not a bug;
        }
    }
}

//================================================================================
//
