pragma ton-solidity >=0.47.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

//================================================================================
//
import "../interfaces/IDebot.sol";
import "../interfaces/ISubscription.sol";
import "../interfaces/IService.sol";
import "../contracts/SubscribeMultisig.sol";

struct ServiceInfo
{
    string  serviceName;
    address serviceAddress;
}

//================================================================================
//
contract SubscriptionDebot is IDebot
{
    address            _ssigAddress;
    address            _msigAddress;
    uint256            _msigPubkey;
    TvmCell            _ssigCode;
    TvmCell            _subscriptionCode;
    uint128            _attachValue = 0.5 ton;
    ServiceInfo[]      _services;
    uint256            _selectedService;
    uint256            _selectedPlan;
    address            _subscriptionAddress;
    uint128            _subscriptionPrice;
    SubscriptionPlan[] _plans;

	//========================================
    //
    constructor(address ownerAddress) public 
    {
        tvm.accept();
        _ownerAddress = ownerAddress;
    }

	//========================================
    //
    function setSsigCode(TvmCell code) public onlyOwner reserve returnChange
    {
        _ssigCode = code;
    }

	//========================================
    //
    function setSubscriptionCode(TvmCell code) public onlyOwner reserve returnChange
    {
        _subscriptionCode = code;
    }

	//========================================
    //
    function addService(string serviceName, address serviceAddress) public onlyOwner reserve returnChange
    {
        _services.push(ServiceInfo(serviceName, serviceAddress));
    }

    function clearServices() public onlyOwner reserve returnChange
    {
        delete _services;
    }

	//========================================
    //
	function getRequiredInterfaces() public pure returns (uint256[] interfaces) 
    {
        return [Terminal.ID, AddressInput.ID, NumberInput.ID, AmountInput.ID, Menu.ID, Media.ID, UserInfo.ID];
	}

    //========================================
    //
    function getDebotInfo() public functionID(0xDEB) view returns(string name,     string version, string publisher, string key,  string author,
                                                                  address support, string hello,   string language,  string dabi, bytes icon)
    {
        name      = "Recurring payments DeBot";
        version   = "0.1.0";
        publisher = "SuperArmor";
        key       = "Recurring payments DeBot by SuperArmor";
        author    = "SuperArmor";
        support   = addressZero;
        hello     = "Welcome to Recurring payments DeBot!";
        language  = "en";
        dabi      = _debotAbi.hasValue() ? _debotAbi.get() : "";
        icon      = _icon.hasValue()     ? _icon.get()     : "";
    }

    //========================================
    /// @notice Define DeBot version and title here.
    function getVersion() public override returns (string name, uint24 semver) 
    {
        (name, semver) = ("Recurring payments DeBot", _version(0, 2, 0));
    }

    function _version(uint24 major, uint24 minor, uint24 fix) private pure inline returns (uint24) 
    {
        return (major << 16) | (minor << 8) | (fix);
    }

    //========================================
    // Implementation of Upgradable
    function onCodeUpgrade() internal override 
    {
        address owner = _ownerAddress;
        tvm.resetStorage();

        _ownerAddress = owner;
        _gasReserve   = 10000;
    }

    //========================================
    //
    function onError(uint32 sdkError, uint32 exitCode) public override
    {
        Terminal.print(0, format("Failed! SDK Error: {}. Exit Code: {}", sdkError, exitCode));
        mainMenu(0); 
    }

    //========================================
    /// @notice Entry point function for DeBot.    
    function start() public override 
    {
        mainEnterDialog(0);
    }

    //========================================
    //
    function mainEnterDialog(uint32 index) public 
    {
        index; // shut a warning

        if(false)
        {
            Terminal.print(0, "DeBot is being upgraded.\nPlease come back in a minute.\nSorry for inconvenience.");
            return;
        }

        UserInfo.getAccount(tvm.functionId(onMsigEnter));
    }

    //========================================
    //
    function onMsigEnter(address value) public
    {  
        _msigAddress = value;
        UserInfo.getPublicKey(tvm.functionId(onPubkeyEnter));
    }

    function onPubkeyEnter(uint256 value) public
    {
        _msigPubkey = value;
        (_ssigAddress, ) = calculateFutureSsigAddress(value);
        mainMenu(0);
    }

    //========================================
    //
    function mainMenu(uint32 index) public 
    {
        index; // shut a warning
        Terminal.print(0, "*SSIG is Subscribe multiSIG");

        MenuItem[] mi;
        mi.push(MenuItem("Get SSIG address and balance",  "", tvm.functionId(_getSsig_1)      ));
        mi.push(MenuItem("List services and plans",       "", tvm.functionId(_listServices_1) ));
        mi.push(MenuItem("<- Restart",                    "", tvm.functionId(mainEnterDialog) ));
        Menu.select("Enter your choice: ", "", mi);
    }

    //========================================
    //========================================
    //========================================
    //========================================
    //========================================
    //
    function calculateFutureSubscriptionAddress(address walletAddress, address serviceAddress) private inline view returns (address, TvmCell)
    {
        TvmCell stateInit = tvm.buildStateInit({
            contr: Subscription,
            varInit: {
                _walletAddress:  walletAddress,
                _serviceAddress: serviceAddress
            },
            code: _subscriptionCode
        });

        return (address(tvm.hash(stateInit)), stateInit);
    }

    function calculateFutureSsigAddress(uint256 pubkey) private inline view returns (address, TvmCell)
    {
        TvmCell stateInit = tvm.buildStateInit({
            contr: SubscribeMultisig,
            varInit: {
                _subscriptionCode: _subscriptionCode
            },
            code: _ssigCode,
            pubkey: pubkey
        });

        return (address(tvm.hash(stateInit)), stateInit);
    }

    function deploySsig(uint256 pubkey) public view reserve
    {
        tvm.accept();
        (, TvmCell stateInit) = calculateFutureSsigAddress(pubkey);
        uint256[] custodians;
        custodians.push(pubkey);
        new SubscribeMultisig{value: 0, flag: 128, stateInit: stateInit}(custodians, 1);
    }

    //========================================
    //========================================
    //========================================
    //========================================
    //========================================
    //
    function _getSsig_1(uint32 index) public
    {
        index; // shut a warning
        Terminal.print(0, format("SubscribeMultisig address: {}", _ssigAddress));
        Sdk.getAccountType(tvm.functionId(_getSsig_2), _ssigAddress);
    }

    function _getSsig_2(int8 acc_type) public 
    {
        if (acc_type == -1 || acc_type == 0) 
        {
            Terminal.print(0, "Your SubscribeMultisig is not deployed.");

            MenuItem[] mi;
            mi.push(MenuItem("Deploy",  "", tvm.functionId(_getSsig_3) ));
            mi.push(MenuItem("<- Back", "", tvm.functionId(mainMenu)   ));
            Menu.select("Enter your choice: ", "", mi);
        }
        else if (acc_type == 1)
        {
            Sdk.getBalance(tvm.functionId(_getSsig_4), _ssigAddress);
        } 
        else if (acc_type == 2)
        {
            Terminal.print(0, "Your SubscribeMultisig is FROZEN! Not expected in testnet, not gonna lie.");
            mainMenu(0); 
        }
    }

    // DEPLOY
    function _getSsig_3(uint32 index) public
    {
        index; // shut a warning
        TvmCell body = tvm.encodeBody(SubscriptionDebot.deploySsig, _msigPubkey);

        IMsig(_msigAddress).sendTransaction{
            abiVer: 2,
            extMsg: true,
            sign: true,
            callbackId: 0,
            onErrorId: 0,
            time: uint32(now),
            expire: 0,
            pubkey: 0x00
        }(address(this),
          1 ton,
          false,
          1,
          body);

        mainMenu(0); 
    }

    // BALANCE
    function _getSsig_4(uint128 nanotokens) public
    {
        Terminal.print(0, format("SubscribeMultisig balance: {:t} TON Crystals", nanotokens));
        mainMenu(0);         
    }

    //========================================
    //========================================
    //========================================
    //========================================
    //========================================
    //
    function _listServices_1(uint32 index) public
    {
        index; // shut a warning
        delete _plans;

        MenuItem[] mi;
        for(ServiceInfo info : _services)
        {
            mi.push(MenuItem(info.serviceName, "", tvm.functionId(_listServices_2) ));
        }
            
        mi.push(MenuItem("<- Back", "", tvm.functionId(mainMenu) ));
        Menu.select("Enter your choice: ", "", mi);
    }

    function _listServices_2(uint32 index) public
    {
        _selectedService = index;
        (_subscriptionAddress, ) = calculateFutureSubscriptionAddress(_ssigAddress, _services[index].serviceAddress);
        Sdk.getAccountType(tvm.functionId(_listServices_3), _subscriptionAddress);
    }

    function _listServices_3(int8 acc_type) public 
    {
        if (acc_type == -1 || acc_type == 0) 
        {
            //Terminal.print(0, "not deployed.");
            _listServices_4(0);
        }
        else if (acc_type == 1)
        {
            _manageSubscription_1(0);
        }
        else if (acc_type == 2)
        {
            Terminal.print(0, "Your Subscribtion is FROZEN! Not expected in testnet, not gonna lie.");
            mainMenu(0); 
        }
    }

    function _listServices_4(uint32 index) public view
    {
        index; // shut a warning
        IService(_services[_selectedService].serviceAddress).getSubscriptionPlans{
                        abiVer: 2,
                        extMsg: true,
                        sign: false,
                        time: uint64(now),
                        expire: 0,
                        pubkey: _emptyPk,
                        callbackId: tvm.functionId(_listServices_5),
                        onErrorId:  0
                        }();
    }

    function _listServices_5(SubscriptionPlan[] plans) public
    {
        _plans = plans;

        MenuItem[] mi;
        for(SubscriptionPlan plan : _plans)
        {
            mi.push(MenuItem(format("ID: {}\nPeriod: {} seconds\nPrice: {:t}", plan.planID, plan.period, plan.periodPrice), "", tvm.functionId(_listServices_6) ));
        }
            
        mi.push(MenuItem("<- Back", "", tvm.functionId(mainMenu) ));
        Menu.select("Enter your choice: ", "", mi);
    }
    
    function _listServices_6(uint32 index) public
    {
        _selectedPlan = index;

        ISubscribeMultisig(_ssigAddress).createSubscription{
            abiVer: 2,
            extMsg: true,
            sign: true,
            callbackId: 0,
            onErrorId: 0,
            time: uint32(now),
            expire: 0,
            pubkey: _msigPubkey
        }(_services[_selectedService].serviceAddress, _plans[_selectedPlan].planID, _plans[_selectedPlan].period, _plans[_selectedPlan].periodPrice);

        mainMenu(0); 
    }

    //========================================
    //========================================
    //========================================
    //========================================
    //========================================
    //
    function _manageSubscription_1(uint32 index) public view
    {
        index; // shut a warning
        ISubscription(_subscriptionAddress).getInfo{
                        abiVer: 2,
                        extMsg: true,
                        sign: false,
                        time: uint64(now),
                        expire: 0,
                        pubkey: _emptyPk,
                        callbackId: tvm.functionId(_manageSubscription_2),
                        onErrorId:  0
                        }();
    }

    function _manageSubscription_2(bool isActive, uint256 planID, uint32 period, uint128 periodPrice, uint32 dtStart, uint32 dtEnd, bool confirmed) public
    {
        _subscriptionPrice = periodPrice;

        DateTime dtS = DTLib.parseTimestamp(dtStart);
        DateTime dtE = DTLib.parseTimestamp(dtEnd);
        string stringStart = format("{}.{:02}.{:02} {:02}-{:02}-{:02} (UTC)", dtS.year, dtS.month, dtS.day, dtS.hour, dtS.minute, dtS.second);
        string stringEnd   = format("{}.{:02}.{:02} {:02}-{:02}-{:02} (UTC)", dtE.year, dtE.month, dtE.day, dtE.hour, dtE.minute, dtE.second);

        Terminal.print(0, format("Service name: {}\n"
                                 "Plan ID: {}\n"
                                 "Period: {}\n"
                                 "Period Price: {:t}\n"
                                 "Start date: {}\n"
                                 "End date: {}\n"
                                 "Active: {}\n"
                                 "Confirmed: {}",
                                 _services[_selectedService].serviceName,
                                 planID,
                                 period,
                                 periodPrice,
                                 stringStart,
                                 stringEnd,
                                 isActive ? "true" : "false",
                                 confirmed ? "true" : "false")
                      );
        
        MenuItem[] mi;
        mi.push(MenuItem("Cancel",     "", tvm.functionId(_manageSubscription_3) ));
        mi.push(MenuItem("Prolongate", "", tvm.functionId(_manageSubscription_4) ));
        mi.push(MenuItem("<- Restart", "", tvm.functionId(mainEnterDialog)       ));
        Menu.select("Enter your choice: ", "", mi);
    }

    function _manageSubscription_3(uint32 index) public
    {
        index; // shut a warning
        TvmCell body = tvm.encodeBody(ISubscription.cancelSubscription);

        ISubscribeMultisig(_ssigAddress).sendTransaction{
            abiVer: 2,
            extMsg: true,
            sign: true,
            callbackId: 0,
            onErrorId: 0,
            time: uint32(now),
            expire: 0,
            pubkey: 0x00
        }(_subscriptionAddress,
          0.1 ton,
          false,
          1,
          body);

        mainMenu(0); 
    }

    function _manageSubscription_4(uint32 index) public
    {
        index; // shut a warning
        TvmCell body = tvm.encodeBody(ISubscription.payForSubscription);

        ISubscribeMultisig(_ssigAddress).sendTransaction{
            abiVer: 2,
            extMsg: true,
            sign: true,
            callbackId: 0,
            onErrorId: 0,
            time: uint32(now),
            expire: 0,
            pubkey: 0x00
        }(_subscriptionAddress,
          _subscriptionPrice + 0.1 ton,
          false,
          1,
          body);

        mainMenu(0); 
    }
}

//================================================================================
//