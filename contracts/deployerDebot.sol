pragma ton-solidity >=0.43.0;
pragma AbiHeader expire;
pragma AbiHeader time;
pragma AbiHeader pubkey;
import "https://raw.githubusercontent.com/tonlabs/debots/main/Debot.sol";
import "https://raw.githubusercontent.com/tonlabs/DeBot-IS-consortium/main/Terminal/Terminal.sol";
import "https://raw.githubusercontent.com/tonlabs/DeBot-IS-consortium/main/UserInfo/UserInfo.sol";
import "SubsMan.sol";
import "ISubsManCallbacks.sol";

contract DeployerDebot is Debot, ISubsManCallbacks, IonQuerySubscriptions  {
    bytes m_icon;

    address m_subsman;
    uint256 m_ownerKey;
    uint256 m_serviceKey;
    uint32 m_sbHandle;
    address m_wallet;
    TvmCell m_subscriptionServiceImage;
    AccData[] m_accounts;

    function setIcon(bytes icon) public {
        require(msg.pubkey() == tvm.pubkey(), 100);
        tvm.accept();
        m_icon = icon;
    }

    function setSubsman(address addr) public {
        require(msg.pubkey() == tvm.pubkey(), 100);
        tvm.accept();
        m_subsman = addr;
    }

    modifier onlyOwner() {
        tvm.accept();
        _;
    }

    function setSubscriptionService(TvmCell image) public onlyOwner {
        m_subscriptionServiceImage = image;
    }

    /// @notice Entry point function for DeBot.
    function start() public override {
        Menu.select("I can manage your subscriptions", "", [
            MenuItem("Deploy new subscription", "", tvm.functionId(menuDeploySubscription)),
            MenuItem("Show my subscriptions", "", tvm.functionId(menuShowSubscription))
        ]);
    }

    function menuDeploySubscription(uint32 index) public {
        index;
        UserInfo.getAccount(tvm.functionId(setDefaultAccount));
        UserInfo.getPublicKey(tvm.functionId(setDefaultPubkey));
        QueryServices();
    }

    function menuServiceKey(uint32 index) public {
        index = index;
        Terminal.input(tvm.functionId(setServiceKey), "Enter public key of service which you want to subscribe to: ", false);
    }

    function _decodeServiceKey(TvmCell data) internal returns (uint256) {
        Terminal.print(0, "_decodeServiceKey...");
        (uint256 svcKey, ,) = data.toSlice().decode(uint256, uint64, bool);
        return svcKey;
    }

    function printSubscriprionsList(AccData[] accounts) public {
        MenuItem[] items;
        m_accounts = accounts;
        for(uint i = 0; i < accounts.length; i++) {
            items.push(MenuItem(format("{}", _decodeServiceKey(accounts[i].data)), "", tvm.functionId(getSigningBox)));
        }
        items.push(MenuItem("Select subcription service by pubkey", "", tvm.functionId(menuServiceKey)) );
        Menu.select(format("{} Subscription services has been found. Choose service from the list or enter its pubkey manually:", accounts.length), "", items);
    }

    function buildServiceHelper() public returns (TvmCell) {
        TvmCell code = m_subscriptionServiceImage.toSlice().loadRef();
        return code;      
    }

    function QueryServices() public {
        TvmCell code = buildServiceHelper();
        Sdk.getAccountsDataByHash(
            tvm.functionId(printSubscriprionsList),
            tvm.hash(code),
            address.makeAddrStd(-1, 0)
        );
    }

    function setDefaultAccount(address value) public {
        Terminal.print(0, format("User account {}", value));
        m_wallet = value;
    }

    function setDefaultPubkey(uint256 value) public {
        Terminal.print(0, format("User public key {:X}", value));
        m_ownerKey = value;
    }

    function setSigningBox(uint32 handle) public {
        Terminal.print(0, format("Signing box handle {}", handle));
        m_sbHandle = handle;
    }

    function menuShowSubscription(uint32 index) public {
        index;
        UserInfo.getAccount(tvm.functionId(setDefaultAccount));
        UserInfo.getPublicKey(tvm.functionId(setDefaultPubkey));
        SubsMan(m_subsman).invokeQuerySubscriptions(m_ownerKey);
    }

    function _decodeWalletKey(TvmCell data) internal returns (uint256) {
        (uint256 walletKey, ,) = data.toSlice().decode(uint256, uint64, bool);
        return walletKey;        
    }

    function setServiceKey(string value) public {
        if (!_parseServiceKey(value)) return;
        getSigningBox(0);
    }

    function getSigningBox(uint32 index) public {
        uint256[] keys;
        if (m_serviceKey == 0) {
            m_serviceKey = _decodeServiceKey(m_accounts[index].data);
        }
        if (m_sbHandle == 0) {
            SigningBoxInput.get(
                tvm.functionId(setSigningBoxHandle),
                "Choose your keys to sign transactions from multisig.",
                keys
            );
        } else {
            setSigningBoxHandle(m_sbHandle);
        }
    }

    function setSigningBoxHandle(uint32 handle) public {
        m_sbHandle = handle;
        subsmanInvokeDeploy();
    }

    function subsmanInvokeDeploy() public view {
        TvmBuilder args;
        args.store(uint(228));
        SubsMan(m_subsman).invokeDeploySubscription(
            m_ownerKey,
            m_serviceKey,
            m_wallet,
            m_sbHandle,
            args.toCell()
        );
    }

    function onSubscriptionDeploy(Status status, address addr) external override{
        uint8 stat = uint8(status);
        if (status == Status.Success) {
            Terminal.print(0, format("Subscription successfully deployed:\n{}", addr));
        } else {
            Terminal.print(0, format("Subscription deploy failed. Error status {}", stat));
        }

        this.start();
    }
    function onQuerySubscriptions(uint256[] keys) external override{
        Terminal.print(0, format("You have {} subscriptions", keys.length));
        for (uint i = 0; i < keys.length; i++) {
            Terminal.print(0, format("0x{:X}", keys[i]));
        }
        this.start();
    }

    /// @notice Returns Metadata about DeBot.
    function getDebotInfo() public functionID(0xDEB) override view returns(
        string name, string version, string publisher, string caption, string author,
        address support, string hello, string language, string dabi, bytes icon
    ) {
        name = "Subscription Deployer";
        version = "0.2.0";
        publisher = "INTONNATION";
        caption = "Subscription Deployment";
        author = "INTONNATION";
        support = address.makeAddrStd(0, 0);
        hello = "Hello, I am a Subscription Deployer DeBot.";
        language = "en";
        dabi = m_debotAbi.get();
        icon = m_icon;
    }

    function getRequiredInterfaces() public view override returns (uint256[] interfaces) {
        return [ Terminal.ID, UserInfo.ID ];
    }

    //
    // Private Helpers
    //

    function _parseServiceKey(string value) private returns (bool) {
        (uint256 key, bool res) = stoi("0x" + value);
        if (!res) {
            Terminal.print(tvm.functionId(Debot.start), "Invalid public key.");
            return res;
        }
        m_serviceKey = key;
        return res;
    }

}
