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

    function buildAccount(uint256 ownerKey, uint256 serviceKey) private view returns (TvmCell image) {
        TvmCell code = m_subscriptionBaseImage.toSlice().loadRef();
        TvmCell newImage = tvm.buildStateInit({
            code: code,
            pubkey: ownerKey,
            varInit: { 
                serviceKey: serviceKey,
                user_wallet: address(tvm.hash(buildWallet(ownerKey))),
                to: address(0xe17ac4e77f46626579c7c4fefe35286117384c5ccfc8745c9780cdf056c378bf),
                value: 1000000000,
                period: 60
            },
            contr: Subscription
        });
        image = newImage;
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
        }
    }

    function deployAccountHelper(uint256 ownerKey, uint256 serviceKey) public view {
        require(msg.value >= 1 ton, 102);
        TvmCell state = buildAccount(ownerKey, serviceKey);

        new Subscription{value: 10 ton, flag: 1, bounce: true, stateInit: state}();
    }

    function deployAccount() view public {
        TvmCell body = tvm.encodeBody(SubsMan.deployAccountHelper, m_ownerKey, m_serviceKey);
        this.callMultisig(m_wallet, m_ownerKey, m_sbHandle, address(this), body, 3 ton, tvm.functionId(checkAccount));
    }
 
    function deployWallet() view public {
        TvmCell body = tvm.encodeBody(SubsMan.deployWalletHelper, m_ownerKey);
        this.callMultisig(m_wallet, m_ownerKey, m_sbHandle, address(this), body, 2 ton, tvm.functionId(printWalletStatus));
    }

    function printWalletStatus() public {
        Terminal.print(0, "Wallet deployed.");
    }

    function checkAccount() public {
        address account = address(tvm.hash(buildAccount(m_ownerKey, m_serviceKey)));
        Sdk.getAccountCodeHash(tvm.functionId(checkHash), account);
    }

    function menuCheckAccount(uint32 index) public {
        index;
        checkAccount();
    }

    function checkHash(uint256 code_hash) public {
        Terminal.print(0, "onSuccess -> checkAccount -> checkHash");
        if (code_hash == tvm.hash(buildAccount(m_ownerKey, m_serviceKey)) || code_hash == 0) {
            Menu.select("Waiting for the Account deployment...", "", [ MenuItem("Check again", "", tvm.functionId(menuCheckAccount)) ]);
            return;
        }
        Terminal.print(0, "Done");
        address account = address(tvm.hash(buildAccount(m_ownerKey, m_serviceKey)));
        returnOnDeployStatus(Status.Success, account);
    }

    function callMultisig(address src, uint256 pubkey, uint32 sbhandle, address dest, TvmCell payload, uint128 value, uint32 gotoId) public {
        optional(uint256) pubkey = pubkey;
        optional(uint32) sbhandle = sbhandle;
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
        if (m_gotoId == tvm.functionId(printServiceStatus)) {
            this.printServiceStatus();
        }
    }

    function onError(uint32 sdkError, uint32 exitCode) public {
        // TODO: handle errors
        Terminal.print(0, format("Error: sdk code = {}, exit code = {}", sdkError, exitCode));
        returnOnError(Status.MultisigFailed);
    }

    function setResult() public {
        m_continue = tvm.functionId(deployAccount);
        Terminal.print(m_continue, "Deploying account...");
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
        setResult();
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
        s_to = to;
        s_period = period;
        s_value = value;
        s_args = args;
        s_sbHandle = sbHandle;
        s_wallet = wallet;
        deployService();
    }
    
    function setSubscriptionService(TvmCell image) public onlyOwner {
        s_subscriptionServiceImage = image;
    }

    function buildService(uint256 ownerKey, address to, uint32 period, uint128 value) private view returns (TvmCell image) {
        TvmCell code = s_subscriptionServiceImage.toSlice().loadRef();
        TvmCell newImage = tvm.buildStateInit({
            code: code,
            pubkey: ownerKey,
            varInit: { 
                to: to,
                value: value,
                period: period
            },
            contr: SubscriptionService
        });
        image = newImage;
    }

    function deployServiceHelper(uint256 ownerKey, address to, uint32 period, uint128 value) public view {
        require(msg.value >= 1 ton, 102);
        TvmCell state = buildService(ownerKey, to, period, value);
        new SubscriptionService{value: 1 ton, flag: 1, bounce: true, stateInit: state}();
    }

    function deployService() view public {
        TvmCell body = tvm.encodeBody(SubsMan.deployServiceHelper, s_ownerKey, s_to, s_period, s_value);
        this.callMultisig(s_wallet, s_ownerKey, s_sbHandle, address(this), body, 1 ton, tvm.functionId(printServiceStatus));
    }

    function printServiceStatus() public {
        Terminal.print(0, "Service deployed.");
        address addr = address(tvm.hash(buildService(s_ownerKey, s_to, s_period, s_value)));
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
