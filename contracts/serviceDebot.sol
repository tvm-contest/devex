pragma ton-solidity ^ 0.47.0;
pragma AbiHeader expire;
pragma AbiHeader time;
pragma AbiHeader pubkey;
import "https://raw.githubusercontent.com/tonlabs/debots/main/Debot.sol";
import "https://raw.githubusercontent.com/tonlabs/DeBot-IS-consortium/main/SigningBoxInput/SigningBoxInput.sol";
import "https://raw.githubusercontent.com/tonlabs/DeBot-IS-consortium/main/Menu/Menu.sol";
import "https://raw.githubusercontent.com/tonlabs/DeBot-IS-consortium/main/ConfirmInput/ConfirmInput.sol";
import "https://raw.githubusercontent.com/tonlabs/DeBot-IS-consortium/main/Terminal/Terminal.sol";
import "https://raw.githubusercontent.com/tonlabs/DeBot-IS-consortium/main/AddressInput/AddressInput.sol";
import "https://raw.githubusercontent.com/tonlabs/DeBot-IS-consortium/main/UserInfo/UserInfo.sol";
import "https://raw.githubusercontent.com/tonlabs/debots/main/Sdk.sol";
import "ISubsManCallbacks.sol";
import "IMultisig.sol";
import "SubsMan.sol";

contract ServiceDebot is Debot, ISubsManCallbacksService, IonQuerySubscribers {
    
    bytes s_icon;

    address s_subsman;
    uint256 s_ownerKey;
    uint32 s_sbHandle;
    address s_wallet;
    address s_to;
    uint128 s_value;
    uint32 s_period;
    string s_description;
    string s_name;

    function setIcon(bytes icon) public {
        require(msg.pubkey() == tvm.pubkey(), 100);
        tvm.accept();
        s_icon = icon;
    }

    function setSubsman(address addr) public {
        require(msg.pubkey() == tvm.pubkey(), 100);
        tvm.accept();
        s_subsman = addr;
    }

    function getDebotInfo() public functionID(0xDEB) override view returns(
        string name, string version, string publisher, string caption, string author,
        address support, string hello, string language, string dabi, bytes icon
    ) {
        name = "Subscription Service Deployer";
        version = "0.1.0";
        publisher = "INTONNATION";
        caption = "Subscription Service Deployment";
        author = "INTONNATION";
        support = address.makeAddrStd(0, 0);
        hello = "Hello, I am a Service Subscription Deployer DeBot.";
        language = "en";
        dabi = m_debotAbi.get();
        icon = s_icon;
    }

    function getRequiredInterfaces() public view override returns (uint256[] interfaces) {
        return [ Terminal.ID ];
    }

    /// @notice Entry point function for DeBot.
    function start() public override {
        UserInfo.getAccount(tvm.functionId(setWalletAddress));
        UserInfo.getPublicKey(tvm.functionId(setOwnerKey));
        Menu.select("I can manage your services", "", [
            MenuItem("Deploy a new service", "", tvm.functionId(menuDeployService)),
            MenuItem("Show my subscribers", "", tvm.functionId(menuShowSubscribers))
        ]);
    }

    function menuDeployService(uint32 index) public {
        index;
        if (s_name.empty()) {
            Terminal.input(tvm.functionId(setSubscriptionName), "Choose a name of your service:", false);
        }
        if (s_description.empty()) {
            Terminal.input(tvm.functionId(setSubscriptionDesciption), "Choose a description for subscribers:", false);
        }     
        if (s_period == 0 ) {
            Terminal.input(tvm.functionId(setSubscriptionPeriod), "Choose a payment period for subscribers:", false);
        }
        if (s_value == 0) {
            Terminal.input(tvm.functionId(setubscriptionValue), "Choose a cost of your subscription for selected period:", false);
        }
        if (s_to == address(0)) {
            AddressInput.get(tvm.functionId(setPaymentAddress), "Choose an address to receive payments for subscriptions:");
        }   
    }

    function menuShowSubscribers(uint32 index) public {
        index;
        subsmanInvokeQuerySubscribers();
    }

    function setWalletAddress(address value) public {
        s_wallet = value;
    }

    function setSubscriptionPeriod(uint32 value) public {
        s_period = value;
    }

    function setSubscriptionName(string value) public {
        s_name = value;
    }

    function setSubscriptionDesciption(string value) public {
        s_description = value;
    }

    function setubscriptionValue(uint128 value) public {
        s_value = value;
    }

    function setPaymentAddress(address value) public {
        s_to = value;
        getSigningBox();
    }

    function setOwnerKey(uint256 value) public {
        Terminal.print(0, format("Your public key {:X}", value));
        s_ownerKey = value;    
    }

    function getSigningBox() public {
        if (s_sbHandle == 0) {
            uint256[] keys;
            SigningBoxInput.get(
                tvm.functionId(setSigningBoxHandle),
                "Choose your keys to sign transactions from multisig.",
                keys
            );
        } else {
            setSigningBoxHandle(s_sbHandle);
        }
    }

    function setSigningBoxHandle(uint32 handle) public {
        s_sbHandle = handle;
        subsmanInvokeDeployService();
    }

    function subsmanInvokeDeployService() public view {
        TvmBuilder args;
        args.store(uint(228));
        SubsMan(s_subsman).invokeDeploySubscriptionService(
            s_ownerKey,
            s_wallet,
            s_to,
            s_sbHandle,
            s_period,
            s_value,
            s_name,
            s_description,
            args.toCell()
        );
    }

    function onSubscriptionServiceDeploy(Status status, address addr) external override{
        uint8 stat = uint8(status);
        if (status == Status.Success) {
            Terminal.print(0, format("Subscription successfully deployed:\n{}", addr));
        } else {
            Terminal.print(0, format("Subscription deploy failed. Error status {}", stat));
        }

        this.start();
    }

    function subsmanInvokeQuerySubscribers() public view {
        SubsMan(s_subsman).invokeQuerySubscribers(
            s_ownerKey
        );
    }

    function onQuerySubscribers(uint256[] keys) external override {
        Terminal.print(0, format("You have {} subscribers", keys.length));
        for (uint i = 0; i < keys.length; i++) {
            Terminal.print(0, format("0x{:X}", keys[i]));
        }
        this.start();
    }

}
