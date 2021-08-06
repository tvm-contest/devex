pragma ton-solidity >=0.43.0;
pragma AbiHeader expire;
pragma AbiHeader time;
pragma AbiHeader pubkey;
import "https://raw.githubusercontent.com/tonlabs/debots/main/Debot.sol";
import "https://raw.githubusercontent.com/tonlabs/DeBot-IS-consortium/main/SigningBoxInput/SigningBoxInput.sol";
import "https://raw.githubusercontent.com/tonlabs/DeBot-IS-consortium/main/Menu/Menu.sol";
import "https://raw.githubusercontent.com/tonlabs/DeBot-IS-consortium/main/ConfirmInput/ConfirmInput.sol";
import "https://raw.githubusercontent.com/tonlabs/DeBot-IS-consortium/main/Terminal/Terminal.sol";
import "https://raw.githubusercontent.com/tonlabs/debots/main/Sdk.sol";
import "ISubsManCallbacks.sol";
import "IMultisig.sol";
import "Subscription.sol";
import "Wallet.sol";
import "SubscriptionService.sol";


contract SubsMan is Debot {
    bytes m_icon;

    TvmCell m_subscriptionBaseImage;

    // invoke arguments
    address s_invoker;
    uint256 s_ownerKey;
    address s_to;
    uint32 s_period;
    uint128 s_value;
    TvmCell s_args;
    uint32 s_sbHandle;
    address s_wallet;

    address m_invoker;
    uint256 m_ownerKey;
    uint256 m_serviceKey;
    uint32 debug;
    address m_wallet;
    TvmCell m_args;
    uint32 m_sbHandle;
    address m_subscription;
    string m_nonce;
    // helper vars
    uint32 m_gotoId;
    uint32 m_continue;

    uint8 m_deployFlags;

    Invoke m_invokeType;
    Invoke s_invokeType;

    TvmCell s_subscriptionServiceImage;
    TvmCell m_subscriptionWalletImage;
    uint256 subscriberKey;

    TvmCell svcParams;
    SubscriptionService.ServiceParams decodedSvcParams;

    enum Invoke {
        NewSubscription,
        NewSubscriptionService,
        QuerySubscriptions
    }

    modifier onlyOwner() {
        require(msg.pubkey() == tvm.pubkey(), 100);
        tvm.accept();
        _;
    }

    function setIcon(bytes icon) public onlyOwner {
        m_icon = icon;
    }

    function setSubscriptionBase(TvmCell image) public onlyOwner {
        m_subscriptionBaseImage = image;
    }
 
     function setSubscriptionWalletCode(TvmCell image) public onlyOwner {
        m_subscriptionWalletImage = image;
    }

    /// @notice Entry point function for DeBot.
    function start() public override {
        
    }

        /// @notice Returns Metadata about DeBot.
    function getDebotInfo() public functionID(0xDEB) override view returns(
        string name, string version, string publisher, string caption, string author,
        address support, string hello, string language, string dabi, bytes icon
    ) {
        name = "Subscription Manager";
        version = "0.2.0";
        publisher = "INTONATION";
        caption = "Managing user subscriptions";
        author = "INTONATION";
        support = address.makeAddrStd(0, 0x841288ed3b55d9cdafa806807f02a0ae0c169aa5edfe88a789a6482429756a94);
        hello = "Hello, I am an Subscription Manager DeBot.";
        language = "en";
        dabi = m_debotAbi.get();
        icon = m_icon;
    }

    function getRequiredInterfaces() public view override returns (uint256[] interfaces) {
        return [ Menu.ID, SigningBoxInput.ID ];
    }

    function buildAccount(uint256 ownerKey, uint256 serviceKey, SubscriptionService.ServiceParams svcparams) private returns (TvmCell image) {
        TvmCell code = buildAccountHelper(serviceKey);
        TvmCell newImage = tvm.buildStateInit({
            code: code,
            pubkey: ownerKey,
            varInit: { 
                serviceKey: serviceKey,
                user_wallet: address(tvm.hash(buildWallet(ownerKey))),
                to: svcparams.to,
                value: svcparams.value,
                period: svcparams.period
            },
            contr: Subscription
        });
        image = newImage;
    }

    function buildAccountHelper(uint256 serviceKey) private returns (TvmCell) {
        Terminal.print(0, "buildAccountHelper");
        TvmBuilder saltBuilder;
        saltBuilder.store(serviceKey);
        TvmCell code = tvm.setCodeSalt(
            m_subscriptionBaseImage.toSlice().loadRef(),
            saltBuilder.toCell()
        );
        return code;
    }



    function buildWallet(uint256 ownerKey) private view returns (TvmCell image) {
        TvmCell code = m_subscriptionWalletImage.toSlice().loadRef();
        TvmCell newImage = tvm.buildStateInit({
            code: code,
            pubkey: ownerKey
        });
        image = newImage;
    }

    function menuCheckWallet(uint32 index) public {
        index;
        checkWallet();
    }

    function checkWallet() public {
        address walletAddr = address(tvm.hash(buildWallet(m_ownerKey)));
        Sdk.getAccountType(tvm.functionId(checkWalletState), walletAddr);
    }

    function checkWalletState(int8 acc_type) public {
        if (acc_type != 1) {
            if (acc_type == 2) {
                // frozen account
                returnOnError(Status.WalletFrozen);
                return;
            }
            Terminal.print(0, "User Wallet is inactive. Deploying...");
            deployWallet();
        } else {
            Terminal.print(0, format("User Wallet is active: {}.", address(tvm.hash(buildWallet(m_ownerKey)))));
            QueryService();
        }
    }

    function deployAccountHelper(uint256 ownerKey, uint256 serviceKey, SubscriptionService.ServiceParams params) public {
        require(msg.value >= 1 ton, 102);

        TvmCell state = buildAccount(ownerKey,serviceKey,params);

        new Subscription{value: 10 ton, flag: 1, bounce: true, stateInit: state}();
    }

    function deployAccount() public {
        TvmCell body = tvm.encodeBody(SubsMan.deployAccountHelper, m_ownerKey, m_serviceKey, decodedSvcParams);
        this.callMultisig(m_wallet, m_ownerKey, m_sbHandle, address(this), body, 3 ton, tvm.functionId(checkAccount));
    }
 
    function deployWallet() view public {
        TvmCell body = tvm.encodeBody(SubsMan.deployWalletHelper, m_ownerKey);
        this.callMultisig(m_wallet, m_ownerKey, m_sbHandle, address(this), body, 2 ton, tvm.functionId(printWalletStatus));
    }

    function printWalletStatus() public {
        m_continue = tvm.functionId(QueryService);
        Terminal.print(m_continue, "Wallet has been deployed.\nDeploying subscription contract...");
    }

    function checkAccount() public {
        address account = address(tvm.hash(buildAccount(m_ownerKey, m_serviceKey, decodedSvcParams)));
        Sdk.getAccountCodeHash(tvm.functionId(checkHash), account);
    }

    function menuCheckAccount(uint32 index) public {
        index;
        checkAccount();
    }

    function checkHash(uint256 code_hash) public {
        Terminal.print(0, "onSuccess -> checkAccount -> checkHash");
        if (code_hash == tvm.hash(buildAccount(m_ownerKey, m_serviceKey, decodedSvcParams)) || code_hash == 0) {
            Menu.select("Waiting for the Account deployment...", "", [ MenuItem("Check again", "", tvm.functionId(menuCheckAccount)) ]);
            return;
        }
        Terminal.print(0, "Done");
        address account = address(tvm.hash(buildAccount(m_ownerKey, m_serviceKey, decodedSvcParams)));
        returnOnDeployStatus(Status.Success, account);
    }

    function callMultisig(address src, uint256 pubkey, uint32 sbhandle, address dest, TvmCell payload, uint128 value, uint32 gotoId) public {
        m_gotoId = gotoId;
        IMultisig(src).sendTransaction{
            abiVer: 2,
            extMsg: true,
            sign: true,
            pubkey: pubkey,
            time: 0,
            expire: 0,
            signBoxHandle: sbhandle,
            callbackId: tvm.functionId(onSuccess),
            onErrorId: tvm.functionId(onError)
        }(dest, value, true, 3, payload);
    }

    function onSuccess() public view {
        if (m_gotoId == tvm.functionId(checkAccount)) {
            this.checkAccount();
        }
        if (m_gotoId == tvm.functionId(printWalletStatus)) {
            this.printWalletStatus();
        }
        if (m_gotoId == tvm.functionId(printServiceStatus)) {
            this.printServiceStatus();
        }
    }

    function onError(uint32 sdkError, uint32 exitCode) public {
        // TODO: handle errors
        Terminal.print(0, format("Error: sdk code = {}, exit code = {}", sdkError, exitCode));
        returnOnError(Status.MultisigFailed);
    }


    function deployWalletHelper(uint256 ownerKey) public view {
        TvmCell state = tvm.insertPubkey(m_subscriptionWalletImage, ownerKey);
        new Wallet {value: 1 ton, flag: 1, stateInit: state}(m_subscriptionBaseImage);
    }

    /// @notice API function.
    function invokeDeploySubscription(
        uint256 ownerKey,
        uint256 serviceKey,
        address wallet,
        uint32 sbHandle,
        TvmCell args
    ) public {
        m_deployFlags = 0;
        m_invokeType = Invoke.NewSubscription;
        m_invoker = msg.sender;
        if (ownerKey == 0) {
            returnOnError(Status.ZeroKey);
            return;
        }
        if (sbHandle == 0) {
            returnOnError(Status.InvalidSigningBoxHandle);
            return;
        }
        m_ownerKey = ownerKey;
        m_serviceKey = serviceKey;
        m_wallet = wallet;
        m_args = args;
        m_sbHandle = sbHandle;
        checkWallet();
    }

    /// @notice API function.
    function invokeDeploySubscriptionService(
        uint256 ownerKey,
        address to,
        address wallet,
        uint32 sbHandle,
        uint32 period,
        uint128 value,
        TvmCell args
    ) public {
        s_invoker = msg.sender;
        s_invokeType = Invoke.NewSubscriptionService;
        if (ownerKey == 0) {
            returnOnError(Status.ZeroKey);
            return;
        }
        if (sbHandle == 0) {
            returnOnError(Status.InvalidSigningBoxHandle);
            return;
        }
        s_ownerKey = ownerKey;
        TvmBuilder params;
        params.store(to, value, period);
        svcParams = params.toCell();
        s_args = args;
        s_sbHandle = sbHandle;
        s_wallet = wallet;
        signServiceCode(s_ownerKey);
    }

    function signServiceCode(uint256 serviceKey) public {
        Sdk.signHash(tvm.functionId(deployService), s_sbHandle, tvm.hash(buildServiceHelper(serviceKey)));
    }

    function setSubscriptionService(TvmCell image) public onlyOwner {
        s_subscriptionServiceImage = image;
    }

    function QueryService() public {
        TvmCell code = buildServiceHelper(m_serviceKey);
        Sdk.getAccountsDataByHash(
            tvm.functionId(getServiceParams),
            tvm.hash(code),
            address.makeAddrStd(-1, 0)
        );
    }

    function _decodeServiceParams(TvmCell data) internal returns (SubscriptionService.ServiceParams) {
        SubscriptionService.ServiceParams svcparams;
        Terminal.print(0, "_decodeServiceParams...");
        (, , , TvmCell _params) = data.toSlice().decode(uint256, uint64, bool, TvmCell);
        (svcparams.to, svcparams.value, svcparams.period) = _params.toSlice().decode(address, uint128, uint32);
        return svcparams;
    }

    function getServiceParams(AccData[] accounts) public {
        SubscriptionService.ServiceParams[] params; 
        Terminal.print(0, format("getServiceParams: {}.", accounts.length));
        for (uint i = 0; i < accounts.length; i++) {
            params.push(_decodeServiceParams(accounts[i].data));
        }
        //TODO: need to ensure that we always take only latest contract
        decodedSvcParams = params[0];
        m_continue = tvm.functionId(deployAccount);
        Terminal.print(m_continue, "Deploying account...");
    }

    function buildServiceHelper(uint256 serviceKey) private returns (TvmCell) {
        Terminal.print(0, "buildServiceHelper");
        TvmBuilder saltBuilder;
        saltBuilder.store(serviceKey);
        TvmCell code = tvm.setCodeSalt(
            s_subscriptionServiceImage.toSlice().loadRef(),
            saltBuilder.toCell()
        );
        return code;      
    }

    function buildService(uint256 serviceKey, TvmCell params) private returns (TvmCell image) {
        TvmCell code = buildServiceHelper(serviceKey);
        TvmCell state = tvm.buildStateInit({
            code: code,
            pubkey: serviceKey,
            varInit: { 
                params: params
            },
            contr: SubscriptionService
        });
        image = tvm.insertPubkey(state, serviceKey);
    }

    function deployServiceHelper(uint256 serviceKey, TvmCell params, bytes signature) public {
        require(msg.value >= 1 ton, 102);
        TvmCell state = buildService(serviceKey, params);
        new SubscriptionService{value: 1 ton, flag: 1, bounce: true, stateInit: state}(signature);
    }

    function deployService(bytes signature) view public {
        TvmCell body = tvm.encodeBody(SubsMan.deployServiceHelper, s_ownerKey, svcParams, signature);
        this.callMultisig(s_wallet, s_ownerKey, s_sbHandle, address(this), body, 1 ton, tvm.functionId(printServiceStatus));
    }

    function printServiceStatus() public {
        Terminal.print(0, "Service deployed.");
        address addr = address(tvm.hash(buildService(s_ownerKey, svcParams)));
        ISubsManCallbacksService(s_invoker).onSubscriptionServiceDeploy(Status.Success, addr);
    }

    /// @notice API function.
    function invokeQuerySubscriptions() public {
        m_invokeType = Invoke.QuerySubscriptions;
        m_invoker = msg.sender;
        Sdk.getAccountsDataByHash(
            tvm.functionId(setInvites),
            tvm.hash(_getAccountCode()),
            address.makeAddrStd(-1, 0)
        );
    }
    
    function _getAccountCode() private view returns (TvmCell) {
        TvmCell code = m_subscriptionBaseImage.toSlice().loadRef();
        return code;
    }

    /// @notice API function.
    function invokeQuerySubscribers(uint256 serviceKey) public {
        s_invoker = msg.sender;
        Sdk.getAccountsDataByHash(
            tvm.functionId(setInvitesSubscriber),
            tvm.hash(_getAccountCodeSubscriber(serviceKey)),
            address.makeAddrStd(-1, 0)
        );
    }
    
    function _getAccountCodeSubscriber(uint256 serviceKey) private returns (TvmCell) {
        TvmCell code = buildAccountHelper(serviceKey);
        return code;
    }

    function _decodeAccountAddress(TvmCell data) internal pure returns (uint256) {
        // pubkey, timestamp, ctor flag, address
        (, , , uint256 serviceKey) = data.toSlice().decode(uint256, uint64, bool, uint256);
        return serviceKey;
    }

    function setInvites(AccData[] accounts) public view {
        uint256[] pubkeys;
        for (uint i = 0; i < accounts.length; i++) {
            pubkeys.push(_decodeAccountAddress(accounts[i].data));
        }
       IonQuerySubscriptions(m_invoker).onQuerySubscriptions(pubkeys);
    }

    function _decodeAccountAddressSubscriber(TvmCell data) internal returns (uint256) {
        // pubkey, timestamp, ctor flag, address
        (subscriberKey) = data.toSlice().decode(uint256);
        return subscriberKey;
    }

    function setInvitesSubscriber(AccData[] accounts) public {
        uint256[] pubkeys;
        for (uint i = 0; i < accounts.length; i++) {
            pubkeys.push(_decodeAccountAddressSubscriber(accounts[i].data));
        }
       IonQuerySubscribers(s_invoker).onQuerySubscribers(pubkeys);
    }

    function returnOnError(Status status) internal {
        if (m_invokeType == Invoke.NewSubscription) {
            returnOnDeployStatus(status, address(0));
        }
        if (s_invokeType == Invoke.NewSubscriptionService) {
            returnOnDeploySubscriptionService(status, address(0));
        }
    }

    function returnOnDeployStatus(Status status, address addr) internal view {
        ISubsManCallbacks(m_invoker).onSubscriptionDeploy(status, addr);
    }

    function returnOnDeploySubscriptionService(Status status, address addr) internal {
        Terminal.print(0, "Send error back from invoked debot.");
        ISubsManCallbacksService(s_invoker).onSubscriptionServiceDeploy(status, addr);
    }
    
}
