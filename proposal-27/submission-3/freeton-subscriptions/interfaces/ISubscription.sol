pragma ton-solidity >= 0.47.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

//================================================================================
//
interface ISubscription
{
    //========================================
    // Create subscription. Params were filled out by Wallet and now need to be confirmed by the service.
    function getInfo() external view returns (bool isActive, uint256 planID, uint32 period, uint128 periodPrice, uint32 dtStart, uint32 dtEnd, bool confirmed);

    //========================================
    // Create subscription. Params were filled out by Wallet and now need to be confirmed by the service.
    function createSubscription(uint256 planID, uint32 period, uint128 periodPrice) external;
    
    //========================================
    // Confirm subscription. After Wallet sends "createSubscription" to the service and service verifies parameters, we get this response.
    // All paremeters are already here, we just need to change it to "confirmed".
    function confirmSubscription(bool confirmed) external;

    //========================================
    // Subscription can be canceled either by the Service or by Wallet.
    function cancelSubscription() external view;
    
    //========================================
    //
    function subscriptionPaymentRequested() external view;
    
    //========================================
    //
    function payForSubscription() external;
}

//================================================================================
//
