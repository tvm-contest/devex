pragma ton-solidity >=0.43.0;
pragma AbiHeader expire;
pragma AbiHeader time;
pragma AbiHeader pubkey;
import "https://raw.githubusercontent.com/tonlabs/debots/main/Debot.sol";
import "https://raw.githubusercontent.com/tonlabs/DeBot-IS-consortium/main/Terminal/Terminal.sol";
import "https://raw.githubusercontent.com/tonlabs/DeBot-IS-consortium/main/UserInfo/UserInfo.sol";
import "https://raw.githubusercontent.com/tonlabs/DeBot-IS-consortium/main/AmountInput/AmountInput.sol";
import "https://raw.githubusercontent.com/tonlabs/DeBot-IS-consortium/main/ConfirmInput/ConfirmInput.sol";
import "https://raw.githubusercontent.com/tonlabs/debots/main/Sdk.sol";
import "SubsMan.sol";
import "ISubsManCallbacks.sol";
import "SubscriptionService.sol";
import "https://raw.githubusercontent.com/tonlabs/DeBot-IS-consortium/main/AddressInput/AddressInput.sol";

interface ISubscription {
    function cancel() external;
}

contract DeployerDebot is Debot, ISubsManCallbacks, IonQuerySubscriptions  {
    bytes m_icon;
    uint128 m_tons;

    address m_subsman;
    uint256 m_ownerKey;
    uint256 m_serviceKey;
    uint32 m_sbHandle;
    address m_wallet;
    address subscrAddr;
    uint128 m_balance;
    uint128 s_balance;
    TvmCell m_subscriptionServiceImage;
    TvmCell m_subscriptionWalletImage;
    AccData[] s_accounts;
    AccData[] m_accounts;
    address walletAddr;
    address serviceAddr;
    uint8 query_type; 
    // 0 - menu
    // 1 - for calculations
    uint128 calc_global;
    SubscriptionService.ServiceParams[] m_sparams;
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

    function setSubscriptionWalletCode(TvmCell image) public onlyOwner {
        m_subscriptionWalletImage = image;
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
        UserInfo.getAccount(tvm.functionId(setDefaultAccount));
    }

    function mainMenu() public {
        Menu.select("Available actions:", "", [
            MenuItem("Subscribe", "", tvm.functionId(menuDeploySubscription)),
            MenuItem("My subscriptions", "", tvm.functionId(menuShowSubscription)),
            MenuItem("Manage wallet", "", tvm.functionId(ManageWallet))
        ]);
    }

    function menuDeploySubscription(uint32 index) public {
        index;
        QueryServices();
    }

    function menuServiceAddress(uint32 index) public {
        index = index;
        AddressInput.get(tvm.functionId(setServiceAddress), "Enter address of service which you want to subscribe to: ");
        
    }
    
    function setServiceAddress(address value) public {
        address sAddr = address.makeAddrStd(0, value.value - 1);
        serviceAddr = address.makeAddrStd(0, value.value);
        getServiceKey(sAddr);
    }

    function setServiceKey(AccData[] accounts) public {
        if (accounts.length != 0 && accounts[0].id == serviceAddr) {
            m_serviceKey = _decodeKeyFromData(accounts[0].data);
            getSigningBox();
        } else {
            Terminal.print(0, "There is no such service.");
            this.start();
        }
    }

    function getServiceKey(address addr) public {
        TvmCell code = buildServiceHelper();
        Sdk.getAccountsDataByHash(
            tvm.functionId(setServiceKey),
            tvm.hash(code),
            addr
        );
    }

    function ManageWallet(uint32 index) public {
        index;       
        walletAddr = address(tvm.hash(buildWallet(m_ownerKey)));
        getWalletBalance(m_wallet);
    }

    function menuManageWallet() public {
        Menu.select("Available actions", "", [
            MenuItem("Top up wallet", "", tvm.functionId(menuTopUpWallet)),
            MenuItem("Main menu", "", tvm.functionId(this.start))
        ]);
    }

    function buildWallet(uint256 ownerKey) private view returns (TvmCell image) {
        TvmCell code = m_subscriptionWalletImage.toSlice().loadRef();
        TvmCell newImage = tvm.buildStateInit({
            code: code,
            pubkey: ownerKey
        });
        image = newImage;
    }

    function menuTopUpWallet(uint32 index) public {
        index = index;
        TopUpWallet();
    }

    function TopUpWallet() public {
        AmountInput.get(tvm.functionId(setTransaction), "How many tokens to send?", 9, 1e7, m_balance);
    }

    function setTransaction(uint128 value) public {
        m_tons = value;
        optional(uint256) pubkey = 0;
        TvmCell m_payload;
        IMultisig(m_wallet).submitTransaction{
            abiVer: 2,
            extMsg: true,
            sign: true,
            pubkey: pubkey,
            time: uint64(now),
            expire: 0,
            callbackId: tvm.functionId(_onSuccess),
            onErrorId: tvm.functionId(_onError)
        } (walletAddr, m_tons, false, false, m_payload);
    }

    function _onSuccess(uint64 transId) public {
        Terminal.print(0, "Success.");
        this.start();
    }

    function _onError(uint32 sdkError, uint32 exitCode) public {
        Terminal.print(0, format("Error: sdk code = {}, exit code = {}", sdkError, exitCode));
        this.start();
    }

    function _decodeSubscriptionParams(TvmCell data) internal view returns (SubscriptionService.ServiceParams) {
        SubscriptionService.ServiceParams sparams;
        (, , , TvmCell params) = data.toSlice().decode(uint256, uint64, bool, TvmCell);
        (sparams.to, sparams.value, sparams.period, sparams.name, sparams.description) = params.toSlice().decode(address, uint128, uint32, string, string);
        return sparams;
    }

    function printSubscriprionsList(AccData[] accounts) public {
        MenuItem[] items;
        s_accounts = accounts;
        SubscriptionService.ServiceParams sparams;
        for(uint i = 0; i < accounts.length; i++) {
            sparams = _decodeSubscriptionParams(accounts[i].data);
            m_sparams.push(sparams);
            items.push(MenuItem(format("➤ {}", sparams.name), "", tvm.functionId(printSubscriprionInfo)));
        }
        items.push(MenuItem("Subscribe to the specific service using address", "", tvm.functionId(menuServiceAddress)));
        items.push(MenuItem("Main menu", "", tvm.functionId(this.start)));
        Menu.select(format("{} subscription services has been found.", accounts.length), "", items);
    }

    function buildServiceHelper() public view returns (TvmCell) {
        TvmCell code = m_subscriptionServiceImage.toSlice().loadRef();
        return code;      
    }

    function getWalletBalance(address value) public returns (uint128){
        Sdk.getBalance(tvm.functionId(setBalance), value);
    }

    function setBalance(uint128 nanotokens) public {
        m_balance = nanotokens;
        (uint64 dec, uint64 float) = tokens(m_balance);
        Terminal.print(0,format("Wallet balance is {}.{} tons", dec, float));
        getWalletBalance2(walletAddr);
    } 

    function setBalance2(uint128 nanotokens) public {
        s_balance = nanotokens;
        (uint64 dec, uint64 float) = tokens(s_balance);
        Terminal.print(0,format("Subscription wallet balance is {}.{} tons", dec, float));
        calculate();
    } 

    function calculate() public {
        query_type = 1;
        SubsMan(m_subsman).invokeQuerySubscriptions(m_ownerKey);
    }

    function getWalletBalance2(address value) public returns (uint128){
        Sdk.getAccountType(tvm.functionId(checkStatus), value);
    }

    function checkStatus(int8 acc_type) public {
        if (acc_type == -1 || acc_type == 0) {
            ConfirmInput.get(tvm.functionId(checkStatusDeploy), "Subscription wallet doesn't exist. It will be deployed when you subscribe first time. Or you can deploy it now.\nDeploy?");
        } else {
            Terminal.print(0,format("Subscription wallet address: {}", walletAddr));
            Sdk.getBalance(tvm.functionId(setBalance2), walletAddr);
        }        
    }

    function checkStatusDeploy(bool value) public {
        if ( value == true ) {
            depWallet();
        } else {
            this.start();
        }
    }

    function depWallet() public {
        uint256[] keys;
        if (m_sbHandle == 0) {
            SigningBoxInput.get(
                tvm.functionId(setSigningBoxHandle3),
                "Choose your keys to sign transactions from your wallet.",
                keys
            );
        }
        else {
           SubsMan(m_subsman).signSubscriptionWalletCode(m_sbHandle, m_wallet, m_ownerKey); 
        }
    }

    function walletDetails() public {
        Terminal.print(0,format("Subscription wallet successfully deployed."));
        this.start();
    }

    function tokens(uint128 nanotokens) private pure returns (uint64, uint64) {
        uint64 decimal = uint64(nanotokens /  1e9);
        uint64 float = uint64(nanotokens - (decimal * 1e9));
        return (decimal, float);
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
        m_wallet = value;
        UserInfo.getPublicKey(tvm.functionId(setDefaultPubkey));

    }

    function setDefaultPubkey(uint256 value) public {
        m_ownerKey = value;
        mainMenu();
    }

    function setSigningBox(uint32 handle) public {
        m_sbHandle = handle;
    }

    function menuShowSubscription(uint32 index) public {
        index;
        UserInfo.getPublicKey(tvm.functionId(setDefaultPubkey2));
    }

    function setDefaultPubkey2(uint256 value) public {
        m_ownerKey = value;
        SubsMan(m_subsman).invokeQuerySubscriptions(m_ownerKey);
    }

    function _decodeKeyFromData(TvmCell data) internal pure returns (uint256) {
        (uint256 key, ,) = data.toSlice().decode(uint256, uint64, bool);
        return key;        
    }

    function _decodeServiceKey(TvmCell data) internal pure returns (uint256) {
        (uint256 svcKey, ,) = data.toSlice().decode(uint256, uint64, bool);
        return svcKey;
    }

    function getSigningBox() public {
        uint256[] keys;
        if (m_sbHandle == 0) {
            SigningBoxInput.get(
                tvm.functionId(setSigningBoxHandle),
                "Choose your keys to sign transactions from your wallet.",
                keys
            );
        } else {
            setSigningBoxHandle(m_sbHandle);
        }
    }

    function printSubscriprionInfo(uint32 index) public {
        m_serviceKey = _decodeServiceKey(s_accounts[index].data);
        Terminal.print(0, format("Name: {}\nDescription: {}\nPeriod: {}\nPrice: {}\nAddress: {}",  m_sparams[index].name,
                                                                                                m_sparams[index].description, 
                                                                                                m_sparams[index].period,                                                                                   
                                                                                                m_sparams[index].value,
                                                                                                s_accounts[index].id)
        );       
        ConfirmInput.get(tvm.functionId(checkConfirmDeploy), "Subscribe?");
    }

    function checkConfirmDeploy(bool value) public {
        if (value == true) {
            getSigningBox();
        } else {
            menuDeploySubscription(0);
        }
    }

    function setSigningBoxHandle(uint32 handle) public {
        m_sbHandle = handle;
        subsmanInvokeDeploy();
    }

    function setSigningBoxHandle2(uint32 handle) public {
        m_sbHandle = handle;
        invokeCancel();
    }

    function setSigningBoxHandle3(uint32 handle) public {
        m_sbHandle = handle;
        SubsMan(m_subsman).signSubscriptionWalletCode(m_sbHandle, m_wallet, m_ownerKey);
    }

    function invokeCancel() public view {
        optional(uint256) pubkey = m_ownerKey;
        optional(uint32) sbhandle = m_sbHandle;
        ISubscription(subscrAddr).cancel{
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

    function onSubscriptionDeploy(Status status) external override{
        uint8 stat = uint8(status);
        if (status == Status.Success) {
            Terminal.print(0, "You successfully subscribed.");
        } else {
            Terminal.print(0, format("Subscription deploy failed. Error status {}", stat));
        }

        this.start();
    }

    function onQuerySubscriptions(AccData[] accounts) external override{
        MenuItem[] items;
        m_accounts = accounts;
        SubscriptionService.ServiceParams sparams;
        delete m_sparams;
        if (query_type == 0) { 
            for(uint i = 0; i < accounts.length; i++) {
                // handle in case of empty data
                sparams = _decodeSubscriptionParams(accounts[i].data);
                m_sparams.push(sparams);
                items.push(MenuItem(format("➤ {}", sparams.name), "", tvm.functionId(menuManageSubscription)));
            }
            items.push(MenuItem("Main menu", "", tvm.functionId(this.start)));
            if (accounts.length > 0) {
                Menu.select(format("{} your subscriptions has been found. To manage it choose subscription from the list:", accounts.length), "", items);
            } else {
                Terminal.print(tvm.functionId(this.start), format("You don't have subscriptions yet."));
            }
        } else {
            delete calc_global; 
            for(uint i = 0; i < accounts.length; i++) {
                sparams = _decodeSubscriptionParams(accounts[i].data);
                calc_global = calc_global + sparams.value;
            }
            if (calc_global != 0) {
                (uint64 dec, uint64 float) = tokens(s_balance);
                if (dec == 0) {
                    dec = 1;
                }
                float;
                if (calc_global <= dec) {
                    Terminal.print(0, format("You have sufficient balance to ensure the next payment."));
                } else {
                    Terminal.print(0, format("Recommended sufficient balance - {}. Top up you wallet on {} to ensure the next payment.", calc_global, calc_global - dec + 1));
                }
            }
            query_type = 0;
            menuManageWallet();
        }
    }

    function menuManageSubscription(uint32 index) public {
        subscrAddr = m_accounts[index].id;
        Terminal.print(0, format("Name: {}\nDescription: {}\nPeriod: {}\nPrice: {}\nAddress: {}",  m_sparams[index].name,
                                                                                                m_sparams[index].description, 
                                                                                                m_sparams[index].period,                                                                                   
                                                                                                m_sparams[index].value,
                                                                                                subscrAddr)
        );
        Menu.select("Available actions:", "", [
            MenuItem("Cancel subscription", "", tvm.functionId(cancelSubscription)),
            MenuItem("Main menu", "", tvm.functionId(this.start))
        ]);
    }

    function cancelSubscription(uint32 index) public {
        index;
        uint256[] keys;
        if (m_sbHandle == 0) {
            SigningBoxInput.get(
                tvm.functionId(setSigningBoxHandle2),
                "Choose your keys to sign transactions from your wallet.",
                keys
            );
        }
        else {
            invokeCancel();
        }
    }

    function onSuccess() public {
        Terminal.print(0, "You successfully unsubscribed.");
        this.start();
    }

    function onError(uint32 sdkError, uint32 exitCode) public {
        // TODO: handle errors
        Terminal.print(0, format("Error: sdk code = {}, exit code = {}", sdkError, exitCode));
    }

    /// @notice Returns Metadata about DeBot.
    function getDebotInfo() public functionID(0xDEB) override view returns(
        string name, string version, string publisher, string caption, string author,
        address support, string hello, string language, string dabi, bytes icon
    ) {
        name = "Subscriber DeBot";
        version = "0.1.0";
        publisher = "INTONNATION";
        caption = "Subscriber DeBot";
        author = "INTONNATION";
        support = address(0x1dfa35539efbcec0703a25f77a166ca1ab97919ae430101bfb54c6f7a1e12a37);
        hello = "Hello! Use this DeBot to manage your subscriptions";
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
