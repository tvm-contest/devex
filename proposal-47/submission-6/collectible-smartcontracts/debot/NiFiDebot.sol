pragma ton-solidity >=0.47.0;
pragma AbiHeader expire;
pragma AbiHeader time;
pragma AbiHeader pubkey;
// import required DeBot interfaces and basic DeBot contract.
import "https://raw.githubusercontent.com/tonlabs/debots/main/Debot.sol";
import "https://raw.githubusercontent.com/tonlabs/DeBot-IS-consortium/main/UserInfo/UserInfo.sol";
import "https://raw.githubusercontent.com/tonlabs/DeBot-IS-consortium/main/ConfirmInput/ConfirmInput.sol";
import "https://raw.githubusercontent.com/tonlabs/DeBot-IS-consortium/main/Terminal/Terminal.sol";
import "https://raw.githubusercontent.com/tonlabs/DeBot-IS-consortium/main/Menu/Menu.sol";
import "Upgradable.sol";

abstract contract AMSig {
    function sendTransaction(
        address dest,
        uint128 value,
        bool bounce,
        bool allBalance,
        TvmCell payload)
    public {}
    function submitTransaction(
        address dest,
        uint128 value,
        bool bounce,
        bool allBalance,
        TvmCell payload)
    public returns (uint64 transId) {}
}

abstract contract ACollectionRoot {
    function getInfo() public functionID(0xa) returns(string  name, string  symbol, uint128 totalSupply) {}
    function getCollectionAddress(uint64 id) public returns(address addr) {}
}

abstract contract ACollection {
    function mintToken() public {}
    function getInfo() public functionID(0xa) returns(uint64 id, string  name, string  symbol, uint64 totalSupply, uint64 limit, address creator, uint32 creatorFees, string hash, uint128 mintCost , uint32 startTime) {}
}

contract MintDebot is Debot, Upgradable {

    address _root;

    TvmCell _sendMsg;
    address _userMsig;
    uint32 _userSign;
    MenuItem[] _items;
    address[] _collections;
    uint64 _curItem;
    uint64 _totalSupply;
    uint128 _mintCost;
    address _mintAddr;
    bytes _icon;

    function setRoot(address addr) public {
        require(msg.pubkey()==tvm.pubkey(),101);
        tvm.accept();
        _root = addr;
    }

    function setIcon(bytes icon) public {
        require(msg.pubkey()==tvm.pubkey(),101);
        tvm.accept();
        _icon = icon;
    }

    function start() public override {
        UserInfo.getAccount(tvm.functionId(getAccount));
    }

    function getAccount(address value) public {
        _userMsig = value;
        UserInfo.getSigningBox(tvm.functionId(getSigningBox));
    }

    function getSigningBox(uint32 handle) public {
        _userSign = handle;
        optional(uint256) none;
        ACollectionRoot(_root).getInfo{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(getRootInfo),
            onErrorId: tvm.functionId(getMethodError),
            time: 0,
            expire: 0,
            sign: false,
            pubkey: none
        }();
    }

    function getMethodError(uint32 sdkError, uint32 exitCode) public {
        Terminal.print(0, format("Get method error. Sdk error = {}, Error code = {}", sdkError, exitCode));
    }

    function getRootInfo(string  name, string  symbol, uint64 totalSupply) public {
        _curItem = 1;
        _totalSupply = totalSupply;
        _items = new MenuItem[](0);
        _collections = new address[](0);
        collectInfo();
    }

    function collectInfo() public {
        if (_curItem<=_totalSupply) {
            optional(uint256) none;
            ACollectionRoot(_root).getCollectionAddress{
                abiVer: 2,
                extMsg: true,
                callbackId: tvm.functionId(getCollctionAddress),
                onErrorId: tvm.functionId(getMethodError),
                time: 0,
                expire: 0,
                sign: false,
                pubkey: none
            }(_curItem);
        } else {
            showCollectionMenu();
        }
    }

    function getCollctionAddress(address addr) public {
        _collections.push(addr);
        optional(uint256) none;
        ACollection(addr).getInfo{
                abiVer: 2,
                extMsg: true,
                callbackId: tvm.functionId(getCollectionMenuInfo),
                onErrorId: tvm.functionId(getMethodError),
                time: 0,
                expire: 0,
                sign: false,
                pubkey: none
            }();
    }

    function getCollectionMenuInfo(uint64 id, string  name, string  symbol, uint64 totalSupply, uint64 limit, address creator, uint32 creatorFees, string hash, uint128 mintCost , uint32 startTime) public{
        MenuItem i = MenuItem(name,"",tvm.functionId(onCollectionMenu));
        _items.push(i);
        _curItem++;
        collectInfo();
    }

    function showCollectionMenu() public {
        if (_items.length != 0){
            Menu.select("Select collection","",_items);
        } else {
            Terminal.print(0, "Collections not found");
        }
    }

    function onCollectionMenu(uint32 index) public {
        _mintAddr = _collections[index];
        optional(uint256) none;
        ACollection(_collections[index]).getInfo{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(getCollectionMintInfo),
            onErrorId: tvm.functionId(getMethodError),
            time: 0,
            expire: 0,
            sign: false,
            pubkey: none
        }();
    }

    function getCollectionMintInfo(uint64 id, string  name, string  symbol, uint64 totalSupply, uint64 limit, address creator, uint32 creatorFees, string hash, uint128 mintCost , uint32 startTime) public{
        Terminal.print(0,format("Collection: {}\nSupply: {}/{}\nMint start time: {}",name,totalSupply,limit,startTime));
        MenuItem[] items;
        _mintCost = mintCost;
        if (totalSupply<limit) {
            if (now<startTime) {
                Terminal.print(0,"Minting is not start yet!");
            } else {
                items.push(MenuItem("Mint","",tvm.functionId(onMint)));
                if (creator==_userMsig) items.push(MenuItem("Owner mint","",tvm.functionId(onMintOwner)));
            }
        }
        items.push(MenuItem("Back","",tvm.functionId(onMintBack)));
        Menu.select("","",items);
    }

    function onMintBack(uint32 index) public {
        showCollectionMenu();
    }

    function onMintOwner(uint32 index) public {
        _mintCost = 0.5 ton;
        onMint(index);
    }

    function onMint(uint32 index) public {
        TvmCell payload = tvm.encodeBody(ACollection.mintToken);
        optional(uint256) none;
        _sendMsg = tvm.buildExtMsg({
            abiVer: 2,
            dest: _userMsig,
            callbackId: tvm.functionId(onMintSuccess),
            onErrorId: tvm.functionId(onMintError),
            time: 0,
            expire: 0,
            sign: true,
            pubkey: none,
            signBoxHandle: _userSign,
            call: {AMSig.submitTransaction, _mintAddr, _mintCost, true, false, payload}
        });
        ConfirmInput.get(tvm.functionId(confirmTransfer), format("Do you want to mint random token for {:t} EVER", _mintCost));
    }

    function confirmTransfer(bool value) public {
        if (value) {
            Terminal.print(tvm.functionId(sendMsg),"⚠ In case you experience problems with message processing please reload the debot");
        } else {
            Terminal.print(tvm.functionId(showCollectionMenu), "Terminated!");
        }
    }

    function sendMsg() public {
        tvm.sendrawmsg(_sendMsg, 1);
    }

    function onMintError(uint32 sdkError, uint32 exitCode) public {
        ConfirmInput.get(tvm.functionId(confirmTransfer), format("Transaction failed. Sdk error = {}, Error code = {}\nDo you want to retry?", sdkError, exitCode));
    }

    function onMintSuccess(uint256 id) public {
        Terminal.print(0,"Minted!");
        showCollectionMenu();
    }

    /*
    *  Implementation of DeBot
    */
    function getDebotInfo() public functionID(0xDEB) override view returns(
        string name, string version, string publisher, string caption, string author,
        address support, string hello, string language, string dabi, bytes icon
    ) {
        name = "NiFi Club";
        version = "0.1.0";
        publisher = "";
        caption = "";
        author = "NiFi Club";
        support = address.makeAddrStd(0, 0x0);
        hello = "";
        language = "en";
        dabi = m_debotAbi.get();
        icon = _icon;
    }

    function getRequiredInterfaces() public view override returns (uint256[] interfaces) {
        return [ ConfirmInput.ID, Menu.ID, Terminal.ID, UserInfo.ID ];
    }

    /*
    *  Implementation of Upgradable
    */
    function onCodeUpgrade() internal override {
        tvm.resetStorage();
    }

}
