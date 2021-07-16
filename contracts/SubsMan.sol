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
import "SubsBase.sol";


contract SubsMan is Debot {
    bytes m_icon;

    TvmCell m_subscriptionBaseImage;

    // invoke arguments
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

    Invoke m_invokeType;

    enum Invoke {
        NewSubscription,
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
        publisher = "TON Labs";
        caption = "Managing user subscriptions";
        author = "TON Labs";
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
            varInit: { serviceKey: serviceKey },
            contr: SubsBase
        });
        TvmCell state = tvm.insertPubkey(newImage, serviceKey);
        image = state;
    }

    function deployAccountHelper(uint256 ownerKey, uint256 serviceKey) public view {
        require(msg.value >= 1 ton, 102);
        TvmCell state = buildAccount(ownerKey, serviceKey);

        new SubsBase{value: 1 ton, flag: 1, bounce: true, stateInit: state}();
        
    }

    function deployAccount() public view {
        TvmCell body = tvm.encodeBody(SubsMan.deployAccountHelper, m_ownerKey, m_serviceKey);
        this.callMultisig(address(this), body, 3 ton, tvm.functionId(checkAccount));
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

    function callMultisig(address dest, TvmCell payload, uint128 value, uint32 gotoId) public {
        optional(uint256) pubkey = m_ownerKey;
        optional(uint32) sbhandle = m_sbHandle;
        m_gotoId = gotoId;
        IMultisig(m_wallet).sendTransaction{
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

    /// @notice API function.
    function invokeDeploySubscription(
        uint256 ownerKey,
        uint256 serviceKey,
        address wallet,
        uint32 sbHandle,
        TvmCell args
    ) public {
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
        delete m_serviceKey;
        m_ownerKey = ownerKey;
        m_serviceKey = serviceKey;
        m_wallet = wallet;
        m_args = args;
        m_sbHandle = sbHandle;
        setResult();
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
        // decode invite contract data manually:
        // pubkey, timestamp, ctor flag, address
        (uint256 pubkey, , ,) = data.toSlice().decode(uint256, uint64, bool, address);
        return pubkey;
    }

    function setInvites(AccData[] accounts) public {
        uint256[] pubkeys;
        for (uint i = 0; i < accounts.length; i++) {
            pubkeys.push(_decodeAccountAddress(accounts[i].data));
        }
       IonQuerySubscriptions(m_invoker).onQuerySubscriptions(pubkeys);
    }

    function returnOnError(Status status) internal view {
        if (m_invokeType == Invoke.NewSubscription) {
            returnOnDeployStatus(status, address(0));
        }
    }

    function returnOnDeployStatus(Status status, address addr) internal view {
        ISubsManCallbacks(m_invoker).onSubscriptionDeploy(status, addr);
    }
    
}
