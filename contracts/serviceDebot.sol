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
    uint64 deployment_date;
    TvmCell s_subscriptionServiceImage;
    uint32 service_period;
    uint256 subscribers;
    address serviceAddr;

    modifier onlyOwner() {
        tvm.accept();
        _;
    }

    function setSubscriptionService(TvmCell image) public onlyOwner {
        s_subscriptionServiceImage = image;
    }

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
        name = "Service Deployer";
        version = "0.1.0";
        publisher = "INTONNATION";
        caption = "Service Deployer";
        author = "INTONNATION";
        support = address.makeAddrStd(0, 0);
        hello = "Hello, I am a service deployer DeBot.";
        language = "en";
        dabi = m_debotAbi.get();
        icon = s_icon;
    }

    function getRequiredInterfaces() public view override returns (uint256[] interfaces) {
        return [ Terminal.ID, UserInfo.ID ];
    }

    /// @notice Entry point function for DeBot.
    function start() public override {
        setUserInfo();
    }

    function mainMenu() public {
        Menu.select("Available options:", "", [
            MenuItem("Deploy service", "", tvm.functionId(preDeployCheck)),
            MenuItem("Get service info", "", tvm.functionId(menuShowSubscribers)),
            MenuItem("Delete my service", "", tvm.functionId(menuCheckService))
        ]);
    }

    function setUserInfo() public {
        UserInfo.getAccount(tvm.functionId(setWalletAddress));
    }

    function menuCheckService(uint32 index) public {
        index;
        serviceAddr = address(tvm.hash(buildService()));
        QueryServices(tvm.functionId(menuDeleteService));
    }

    function menuDeleteService(AccData[] accounts) public {
        address addr = address.makeAddrStd(0, tvm.hash(buildService()));
        if (accounts.length != 0 && accounts[0].id == addr) {
            uint256[] keys;
            if (s_sbHandle == 0) {
                SigningBoxInput.get(
                    tvm.functionId(setSigningBoxHandle2),
                    "Choose your keys to sign transaction.",
                    keys
                );
            }
            else {
                invokeDelete();
            }
        } else {
            Menu.select("You have no service deployed. Do you want to create it?", "", [
                MenuItem("Yes", "", tvm.functionId(preDeployCheck)),
                MenuItem("No", "", tvm.functionId(this.start))
            ]);  
        }
    }

    function invokeDelete() public {
        optional(uint256) pubkey = s_ownerKey;
        optional(uint32) sbhandle = s_sbHandle;
        SubscriptionService(serviceAddr).selfdelete{
            abiVer: 2,
            extMsg: true,
            sign: true,
            pubkey: pubkey,
            time: 0,
            expire: 0,
            signBoxHandle: sbhandle,
            callbackId: tvm.functionId(onSuccess),
            onErrorId: tvm.functionId(onError)
        }();
    }

    function onSuccess() public {
        Terminal.print(0, format("You successfully deleted your service {}", serviceAddr));
        delete s_name;
        delete s_to;
        delete s_description;
        delete s_value;
        delete s_period;
        this.start();
    }

    function onError(uint32 sdkError, uint32 exitCode) public {
        // TODO: handle errors
        Terminal.print(0, format("Error: sdk code = {}, exit code = {}", sdkError, exitCode));
    }

    function preDeployCheck(uint32 index) public {
        QueryServices(tvm.functionId(menuDeployService));
    }

    function menuDeployService(AccData[] accounts) public {
        address addr = address.makeAddrStd(0, tvm.hash(buildService()));
        if (accounts.length == 0 || accounts[0].id != addr) {
            if (s_name.empty()) {
                Terminal.input(tvm.functionId(setSubscriptionName), "Input the name of your service:", false);
            }
            if (s_description.empty()) {
                Terminal.input(tvm.functionId(setSubscriptionDesciption), "Provide description for subscribers:", false);
            }     
            if (s_period == 0 ) {
                Terminal.input(tvm.functionId(setSubscriptionPeriod), "Input payment period for subscribers (days):", false);
            }
            if (s_value == 0) {
                Terminal.input(tvm.functionId(setubscriptionValue), "Input a cost of your service subscription for selected period (TONs):", false);
            }
            if (s_to == address(0)) {
                AddressInput.get(tvm.functionId(setPaymentAddress), "Input an address to receive payments:");
            }
        } else {
            Terminal.print(tvm.functionId(this.start), "Your account already has a service. Please delete it first or choose another account.");
        }
    }

    function menuShowSubscribers(uint32 index) public {
        index;
        QueryServices(tvm.functionId(subsmanInvokeQuerySubscribers));
    }

    function setWalletAddress(address value) public {
        Terminal.print(0, format("User account {}", value));
        s_wallet = value;
        UserInfo.getPublicKey(tvm.functionId(setOwnerKey));
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

    function setubscriptionValue(string value) public {
        bool status;
        uint uvalue;
        (uvalue, status) = stoi(value);
        s_value = uint128(uvalue);
    }

    function setPaymentAddress(address value) public {
        s_to = value;
        getSigningBox();
    }

    function setOwnerKey(uint256 value) public {
        Terminal.print(0, format("User public key {:X}", value));
        s_ownerKey = value;
        mainMenu();
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

    function setSigningBoxHandle2(uint32 handle) public {
        s_sbHandle = handle;
        invokeDelete();
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

    function onSubscriptionServiceDeploy(Status status, address addr) external override {
        uint8 stat = uint8(status);
        if (status == Status.Success) {
            Terminal.print(0, format("Service deployed successfully:\n{}", addr));
        } else {
            Terminal.print(0, format("Service deploy failed. Error status {}", stat));
        }
        this.start();
    }

    function subsmanInvokeQuerySubscribers(AccData[] accounts) public {
        address addr = address.makeAddrStd(0, tvm.hash(buildService()));
        if (accounts.length != 0 && accounts[0].id == addr) {
            Terminal.print(0, "Service exist.");
            SubsMan(s_subsman).invokeQuerySubscribers(
                s_ownerKey
            );
        } else {
            Menu.select("You have no service deployed. Do you want to create it?", "", [
                MenuItem("Yes", "", tvm.functionId(preDeployCheck)),
                MenuItem("No", "", tvm.functionId(this.start))
            ]);
        }
    }

    function onQuerySubscribers(uint256[] keys) external override {
        subscribers = keys.length;
        QueryServices(tvm.functionId(printSubscriprionsList));
    }

    function buildService() private returns (TvmCell image) {
        TvmCell code = buildServiceHelper();
        TvmCell state = tvm.buildStateInit({
            code: code,
            pubkey: s_ownerKey,
            varInit: {
                serviceKey: s_ownerKey
            },
            contr: SubscriptionService
        });
        image = tvm.insertPubkey(state, s_ownerKey);
    }

    function buildServiceHelper() private returns (TvmCell) {
        TvmCell code = s_subscriptionServiceImage.toSlice().loadRef();
        return code;
    }

    function printSubscriprionsList(AccData[] accounts) public {
        SubscriptionService.ServiceParams svcparams;
        (, , , TvmCell _params) = accounts[0].data.toSlice().decode(uint256, uint64, bool, TvmCell);
        (svcparams.to, svcparams.value, svcparams.period, svcparams.name, svcparams.description) = _params.toSlice().decode(address, uint128, uint32, string, string);
        Terminal.print(0, format("Name: {}\nDescription: {}\nPeriod: {}\nPrice per period: {}\nSubscribers count: {}\nExpected monthly income: {}", svcparams.name, svcparams.description, svcparams.period, svcparams.value, subscribers, subscribers*svcparams.value));
        this.start();
    }

    function QueryServices(uint32 goto) public {
        TvmCell code = buildServiceHelper();
        uint256 svc_addr = tvm.hash(buildService()) - 1;
        address addr = address.makeAddrStd(0, svc_addr);
        Sdk.getAccountsDataByHash(
            goto,
            tvm.hash(code),
            addr
        );
    }
}
