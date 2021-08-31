pragma ton-solidity >=0.47.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

//================================================================================
//
import "../interfaces/IBase.sol";
import "../interfaces/ISubscription.sol";
import "../interfaces/IService.sol";
import "../interfaces/ISubscribeMultisig.sol";

//================================================================================
//
contract Subscription is IBase, ISubscription
{
    //========================================
    // Error codes
    uint constant ERROR_MESSAGE_SENDER_IS_NOT_MY_WALLET  = 101;
    uint constant ERROR_MESSAGE_SENDER_IS_NOT_MY_SERVICE = 102;
    uint constant ERROR_MESSAGE_SENDER_IS_NOT_EITHER     = 103;
    uint constant ERROR_WALLET_ADDRESS_IS_ZERO           = 104;
    uint constant ERROR_SERVICE_ADDRESS_IS_ZERO          = 105;
    uint constant ERROR_NOT_ENOUGH_VALUE                 = 200;
    uint constant ERROR_TOO_EARLY_TO_PROLONGATE          = 201;
    uint constant ERROR_SUBSCRIPTION_NOT_CONFIRMED       = 202;

    //========================================
    // Variables
    address static _walletAddress;  // 
    address static _serviceAddress; // 
    uint256        _planID;         // If this one is not static one Multisig can have only 1 subscription per service, no multriple subscriptions per service;
    bool           _confirmed;      // After the Subscription is created it needs to be confirmed by Service
    uint32         _dtStart;        // When subscription started
    uint32         _period;         // Period in seconds
    uint32         _lastPaid;       // Last paid date
    uint128        _periodPrice;    // Price per period cycle

    //========================================  
    // Modifiers
    function senderIsWallet()  internal view inline returns (bool) { return (msg.isInternal && msg.sender.isStdAddrWithoutAnyCast() && _walletAddress  == msg.sender && _walletAddress  != addressZero);    }
    function senderIsService() internal view inline returns (bool) { return (msg.isInternal && msg.sender.isStdAddrWithoutAnyCast() && _serviceAddress == msg.sender && _serviceAddress != addressZero);    }
    modifier onlyWallet    {    require(senderIsWallet(),                      ERROR_MESSAGE_SENDER_IS_NOT_MY_WALLET);    _;    }
    modifier onlyService   {    require(senderIsService(),                     ERROR_MESSAGE_SENDER_IS_NOT_MY_SERVICE);   _;    }
    modifier onlyEither    {    require(senderIsService() || senderIsWallet(), ERROR_MESSAGE_SENDER_IS_NOT_EITHER);       _;    }

    //========================================  
    // Getters
    function _isActive() internal inline view returns (bool) {    return (_confirmed && _lastPaid + _period >= now);    }

    function subscriptionIsActive()      external             view         returns (bool) {    return                     (_isActive());    }
    function callSsubscriptionIsActive() external responsible view reserve returns (bool) {    return{value: 0, flag: 128}(_isActive());    }

    function getInfo() external view override returns (bool isActive, uint256 planID, uint32 period, uint128 periodPrice, uint32 dtStart, uint32 dtEnd, bool confirmed)
    {
        isActive    = _isActive();
        planID      = planID;
        period      = _period;
        periodPrice = _periodPrice;
        dtStart     = _dtStart;
        dtEnd       = _dtStart + _period;
        confirmed   = _confirmed;
    }
    
    //========================================  
    //
    constructor() public onlyWallet
    {
        require(_serviceAddress.isStdAddrWithoutAnyCast() && _serviceAddress != addressZero, ERROR_SERVICE_ADDRESS_IS_ZERO);
        require(_walletAddress.isStdAddrWithoutAnyCast()  && _walletAddress  != addressZero, ERROR_WALLET_ADDRESS_IS_ZERO );

        // No tvm.accept() because only Wallet should be a deployer.
    }

    //========================================  
    // 
    function createSubscription(uint256 planID, uint32 period, uint128 periodPrice) external override onlyWallet
    {
        require(msg.value >= periodPrice, ERROR_NOT_ENOUGH_VALUE);
        _reserve();

        _planID      = planID;
        _period      = period;
        _periodPrice = periodPrice;
        _dtStart     = now;

        IService(_serviceAddress).confirmSubscription{value: 0, flag: 128, callback: confirmSubscription}(_walletAddress, planID, period, periodPrice);
    }

    //========================================  
    // 
    function confirmSubscription(bool confirmed) public override onlyService
    {
        _confirmed = confirmed;
        if(confirmed)
        {
            _reserve();
            _walletAddress.transfer(0, false, 128);
        }
        else
        {
            _walletAddress.transfer(0, false, 128+32); // subscriptions was created with wrong parameters, destroy it;
        }

    }

    //========================================  
    // 
    function cancelSubscription() external view override onlyEither
    {
        if(msg.sender == _walletAddress)
        {
            IService(_serviceAddress).cancelSubscription{value: 0, bounce: false, flag: 128+32}(_walletAddress, _planID, _period, _periodPrice, _lastPaid);
        }
        else
        {
            _walletAddress.transfer(0, false, 128+32); // subscriptions was canceled by Service, return all the change to Wallet;
        }
    }

    //========================================  
    // 
    function subscriptionPaymentRequested() external override view onlyService
    {
        require(now > _lastPaid + _period / 2, ERROR_TOO_EARLY_TO_PROLONGATE); // You can pay for subscription only when half of the subscription is over; 
                                                                               // TODO: do we need to make this configurable?
        _reserve();

        ISubscribeMultisig(_walletAddress).subscriptionPaymentRequested{value: 0, flag: 128}(_serviceAddress, _periodPrice);
    }

    //========================================  
    // 
    function payForSubscription() public override onlyWallet
    {
        require(msg.value > _periodPrice, ERROR_NOT_ENOUGH_VALUE          ); // msg.value should be guaranteed by Wallet, but you never know
        require(_confirmed,               ERROR_SUBSCRIPTION_NOT_CONFIRMED); // Sanity;
        _reserve();

        // If we are paying too late, we need to reset "_lastPaid";
        bool expired = (now > _lastPaid + _period);
        _lastPaid = (expired ? now : _lastPaid + _period);

        IService(_serviceAddress).payForSubscription{value: 0, flag: 128}(_walletAddress, _planID, _period, _periodPrice);
    }

    //========================================
    //
    onBounce(TvmSlice slice) external view
    {
        uint32 functionId = slice.decode(uint32);
        if(functionId == tvm.functionId(ISubscribeMultisig.subscriptionPaymentRequested) && !_isActive()) 
        {
            tvm.accept();
            _walletAddress.transfer(0, false, 128+32); // not enough money to continue sunscription, destroy it;
        }
    }
}

//================================================================================
//
