pragma ton-solidity >= 0.47.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

//================================================================================
//
interface IAccept 
{
    function acceptTransfer(bytes payload) external;
}

//================================================================================
//
interface ISubscribeMultisig is IAccept
{
    //========================================
    //
    function sendTransaction(address dest, uint128 value, bool bounce, uint8 flags, TvmCell payload) external view;
    
    //========================================
    //
    function createSubscription(address serviceAddress, uint256 planID, uint32 period, uint32 periodPrice) external;
    
    //========================================
    //
    function subscriptionPaymentRequested(address serviceAddress, uint128 periodPrice) external;
}

//================================================================================
//
