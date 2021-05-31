pragma ton-solidity >=0.42.0;
pragma AbiHeader expire;
pragma AbiHeader time;
pragma AbiHeader pubkey;

import "ui/AddressInput.sol";
import "ui/AmountInput.sol";
import "ui/ConfirmInput.sol";
import "ui/Debot.sol";
import "ui/Menu.sol";
import "ui/Sdk.sol";
import "ui/Terminal.sol";
import "ui/Transferable.sol";
import "ui/Upgradable.sol";
import "ui/NumberInput.sol";

import "./Interfaces.sol";
import "./Libraries.sol";
import "./Structures.sol";

contract DeNSDebot is Debot, Upgradable, Transferable, IDataStructs {
    string[] chain;
    uint chainIdx;
    address root;
    bytes nIcon;
    address currentResolvingAddress;
    RegRequest request;
    uint256 nonce;
    uint128 bidAmount;

    constructor(address _root) public {
        require(tvm.pubkey() != 0);
        require(msg.pubkey() == tvm.pubkey());
        tvm.accept();
        root = _root;
    }

    function onCodeUpgrade() internal override {
        tvm.resetStorage();
    }

    function getRequiredInterfaces() public view override returns (uint256[] interfaces) {
        return [ Terminal.ID, AmountInput.ID, ConfirmInput.ID, AddressInput.ID ];
    }

    function getDebotInfo() public functionID(0xDEB) override view returns(
        string name, string version, string publisher, string key, string author,
        address support, string hello, string language, string dabi, bytes icon
    ) {
        name = "DeNS DeBot";
        version = format("{}.{}.{}", 0,0,1);
        publisher = "TON Labs";
        key = "DeBot for DeNS";
        author = "TON Labs";
        support = address.makeAddrStd(0, 0x97619544fb5d6115b2188350b1172b70952aac40705272d75f44c4685946fea);
        hello = "Hi, I will help you with DeNS manipulations.";
        language = "en";
        dabi = m_debotAbi.get();
        icon = nIcon;
    }

    function start() public override {
        Terminal.print(0, "Welcome to the DeNS debot!");
        Terminal.print(0, "Please select your option:");
        Menu.select ("Options", "Available debot actions", [
            MenuItem("Resolve",     "Resolve name",             tvm.functionId(miResolve)),
            MenuItem("Register",    "Register name",            tvm.functionId(miRegister)),
            MenuItem("Auction",     "Participate in auctions",  tvm.functionId(miAuction)),
            MenuItem("Quit", "", 0)
        ]);
    }

    function miResolve(uint32 index) public {
            require(index >= 0);
            Terminal.inputStr(tvm.functionId(resolveName), "Name to resolve:", false);
    }

    function resolveName(string value) public {
        Terminal.print(0, format("Resolving {}.", value));
        _lookupPreparations(value);
        _recursiveLookup(address(0));
    }

    function _tokenize(string input) private {
        uint length = input.byteLength();
        uint idx = 0;
        for (uint i = 0; i < length; i++) {
            if (input.substr(i, 1) == "/") {
                chain.push(input.substr(idx, i - idx));
            }
        }
        chain.push(input.substr(idx, length - idx));
    }

    function _lookupPreparations(string value) private {
        delete chain;
        _tokenize(value);
        chainIdx = 0;
    }

    function _recursiveLookup(address currentAddress) private {
        string part = chain[chainIdx];
        Terminal.print(0, format("Lookup for {} part.", part));
        IDensRoot(root).resolveRPC{callback: onResolve}(part, currentAddress, PlatformTypes.Certificate);
    }

    function onResolve(address res) public {
        currentResolvingAddress = res;
        Sdk.getAccountType(tvm.functionId(checkStatus), res);
    }

    function resolveOfExistingCert(address res) public {
        Terminal.print(0, format("Got address {}", res));
        if (chainIdx + 1 == chain.length) {
            Terminal.print(0, "Requesting value...");
            IDensCertificate(res).whois{callback: onResolveWhois}();
            return;
        }
        chainIdx += 1;
        string part = chain[chainIdx];
        IDensRoot(root).resolveRPC{
            callback: onResolve
            }(part, res, PlatformTypes.Certificate);
    }

    function checkStatus(int8 acc_type) public {
        if (acc_type == -1)  {
            Terminal.print(0, "Certificate does not exist, name is free to register.");
            start();
        }
        if (acc_type == 0) {
            Terminal.print(0, "Certificate exists");
            resolveOfExistingCert(currentResolvingAddress);
        }
    }

    function onResolveWhois(Whois res) public {
        Terminal.print(0, "Received information:");
        Terminal.print(0, format("Owner: {}", res.owner));
        Terminal.print(0, format("Registered: {}s ago", now - res.registered));
        Terminal.print(0, format("Expires: in {}s", int(res.expiry) - int(now)));
        Terminal.print(0, format("Address value (request result):\n{}", res.value));
        start();
    }

    function miRegister(uint32 index) public {
        require(index >= 0);
        Terminal.inputStr(tvm.functionId(registerName), "Name to register:", false);
    }

    function registerName(string value) public {
        Terminal.print(0, format("Registeration of {} initiated.", value));
        NumberInput.get(tvm.functionId(setRequestedDuration), "Please enter desired duration (in years):", 1, 100);
        request.name = value;
    }
    
    function setRequestedDuration(uint32 value) public {
        request.duration = value;
        AmountInput.get(tvm.functionId(setHashedAmount), "Please enter desired amount for the bid:", 9, 1, 1e13);
    }

    function setHashedAmount(uint128 value) public {
        bidAmount = value;
        nonce = rnd.next();
        AddressInput(tvm.functionId(userAddressSpicified), "Please select wallet address you want to use:");
        
        //IDensRoot(root){callback: onAucResolve}.resolveFull(request.name, PlatformTypes.Auction);
    }

    function userAddressSpicified(address value) {
        IDensRoot(root){callback: sendRegRequest}.generateHash(value, bidAmount, nonce);
    }

    function sendRegRequest(uint256 value) {
        request.hash = value;
        IDensRoot(root).regName(tvm.functionId(regNameCallback), request);
    }

    function regNameCallback(bool success, uint8 failCode, address) {
        ;
    }

    function onAucResolve(address value) public {}

    function miAuction(uint32 index) public {
        require(index >= 0);
        uint256 h = 
        Sdk.getAccountsDataByHash(tvm.functionId(onAccountsByHash),h,address(0x0));
    }

    function onAccountsByHash(ISdk.AccData[] accounts) public {
        m_tpaddrs = new address[](0);
        m_tip3Menu = new  Tip3MenuInfo[](0);
        for (uint i=0; i<accounts.length;i++)
        {
            m_tpaddrs.push(accounts[i].id);
        }

        if (m_tpaddrs.length>0)
        {
            m_curTP = 0;
            getTradingPairStock(m_tpaddrs[m_curTP]);
        }
        else
            Terminal.print(tvm.functionId(showTip3Menu),"no trading pairs!");
    }
}