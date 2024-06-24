pragma ton-solidity >=0.43.0;

pragma AbiHeader expire;
pragma AbiHeader time;
pragma AbiHeader pubkey;

import "../vendoring/Debot.sol";
import "../vendoring/Terminal.sol";
import "../vendoring/SigningBoxInput.sol";
import "../vendoring/Menu.sol";
import "../vendoring/AmountInput.sol";
import "../vendoring/AddressInput.sol";
import "../vendoring/ConfirmInput.sol";
import "../vendoring/Upgradable.sol";
import "../vendoring/Sdk.sol";

import "../../contracts/market/DirectSell.sol";
import "../../contracts/market/DirectSellRoot.sol";

interface IMultisig {

    function sendTransaction(
        address dest,
        uint128 value,
        bool bounce,
        uint8 flags,
        TvmCell payload
    ) external;
}

contract BuyDebot is Debot, Upgradable{
 
    address _addrMultisig;
    address _addrDirectSell;
    uint32 _keyHandle;

    modifier accept(){
        tvm.accept();
        _;
    }

    

    function getDebotInfo() public functionID(0xDEB) override view returns(
        string name, string version, string publisher, string key, string author,
        address support, string hello, string language, string dabi, bytes icon
    ) {
        name = "🔷Buy debot";
        version = "0.0.1";
        publisher = "";
        key = "";
        author = "Jack Karver";
        support = address.makeAddrStd(0, 0x000000000000000000000000000000000000000000000000000000000000);
        hello = "🖖Hello, i am an Nft buy DeBot.";
        language = "en";
        dabi = m_debotAbi.get();
        icon = '';
    }
    
    function getRequiredInterfaces() public view override returns (uint256[] interfaces) {
        return [ Terminal.ID, Menu.ID, AddressInput.ID, SigningBoxInput.ID, ConfirmInput.ID, AmountInput.ID ];
    }
    
    function start() public override {
        mainMenu();
    }
    
    function mainMenu() public {
        if(_addrMultisig == address(0)) {
            Terminal.print(0, '💳Looks like you do not have attached Multi-Signature Wallet.');
            attachMultisig();
        } else {
            restart();
        }
    }

    function restart() public {
        if(_keyHandle == 0){
            uint[] none;
            SigningBoxInput.get(tvm.functionId(setKeyHandle), "🔑Enter keys to sign", none);
            return;
        }
        menu();
    }

    function menu() public{
        MenuItem[] _items;
            _items.push(MenuItem("💲Buy Nft","",tvm.functionId(buyNft)));
        Menu.select("What we will do?","", _items);        
    }

    function buyNft() public{        
        AddressInput.get(tvm.functionId(setDirectSellAddr), "📝Enter the address of the Direct sell contract with token you want to buy");
        buyNftS2();
    }

    function buyNftS2() public view{
        DirectSell(_addrDirectSell).getInfo{
            abiVer: 2,
            extMsg: true,
            callbackId:tvm.functionId(checkResult),
            onErrorId: tvm.functionId(onBuyError),
            time: 0,
            expire: 0,
            sign: false
        }();
    }

    function checkResult(
        address addrOwner,
        address addrNFT,
        bool alreadyBought,
        bool withdrawn,
        bool isNftTradable,
        uint128 price,
        uint64 endUnixtime) 
        public {
        Terminal.print(0, format("🙋‍♂️Address Owner: {}", addrOwner));
        Terminal.print(0, format("📝Address NFT: {}", addrNFT));
        if(alreadyBought == false && withdrawn == false && isNftTradable == true){
            Terminal.print(0, format("💱Is tradable?: Yes"));
            Terminal.print(0, format("🏷️Price: {}", price));
            uint64 remains = endUnixtime - now;
            uint64 day = remains/(3600*24);
            remains = remains%(3600*24);
            uint64 hrs = remains/3600;
            remains = remains%3600;
            uint mins = remains/60;
            remains = remains%60;
            Terminal.print(0, format("⏱️Time left: {} day, {}h {}m {}s", day, hrs, mins, remains));
            MenuItem[] items;
            items.push(MenuItem("💲Buy token", "", tvm.functionId(buyNftFinally)));
            items.push(MenuItem("↩️Restart","",tvm.functionId(restart)));
            Menu.select("✔️You can buy this NFT", "", items);            
        }
        else{
            MenuItem[] items;
            Terminal.print(0, format("💱Is tradable?: No"));
            items.push(MenuItem("↩️Restart","",tvm.functionId(restart)));
            Menu.select("❌You can't buy this NFT", "", items);
        }
         
    }

    function buyNftFinally() public view{
        TvmCell payload = tvm.encodeBody(
            DirectSell.buyNftToken
        );
        optional(uint256) pubkey;
        IMultisig(_addrMultisig).sendTransaction{
            abiVer: 2,
            extMsg: true,
            sign: true,
            pubkey: pubkey,
            time: uint64(now),
            expire: 0,
            callbackId:tvm.functionId(onBuySuccess),
            onErrorId: tvm.functionId(onBuyError),            
            signBoxHandle: _keyHandle
        }(_addrDirectSell, 0 ton, true, 3, payload);
    }
    
    function onBuySuccess() public {
        Terminal.print(0, "✔️Token is already yours!");
        restart();
    }

    function onBuyError(uint32 sdkError, uint32 exitCode) public{
        Terminal.print(0, format("🔴Sdk error {}. Exit code {}.", sdkError, exitCode));
        restart();
    }

    function setDirectSellAddr(address value) public{
        _addrDirectSell = value;
    }

    function setKeyHandle(uint32 handle) public {
        _keyHandle = handle;
        restart();
    }  
    
    function attachMultisig() public {
        AddressInput.get(tvm.functionId(saveMultisig), "📝Enter Multi-Signature Wallet address: ");
    }

     function saveMultisig(address value) public {
        tvm.accept();
        _addrMultisig = value;
        restart();
    }

    function onCodeUpgrade () internal override {
        tvm.resetStorage();
    }

}
