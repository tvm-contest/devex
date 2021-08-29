pragma ton-solidity >= 0.47.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

//================================================================================
//
struct SubscriptionPlan
{
    uint256 planID;      // Subscription Plan ID;
    uint32  period;      // Subscription period in seconds;
    uint128 periodPrice; // Subscription price;
}

//================================================================================
//
interface IService
{
    //========================================
    //
    function getSubscriptionPlans() external view returns (SubscriptionPlan[] plans);
    
    //========================================
    //
    function confirmSubscription(address walletAddress, uint256 subscriptionPlan, uint32 period, uint128 periodPrice) external responsible returns (bool confirmed);
    
    //========================================
    //
    function cancelSubscription (address walletAddress, uint256 subscriptionPlan, uint32 period, uint128 periodPrice, uint32 lastPaid) external;
}

//================================================================================
//
