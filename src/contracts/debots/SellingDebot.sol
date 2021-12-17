pragma ton-solidity >= 0.43.0;
pragma AbiHeader expire;
pragma AbiHeader time;
pragma AbiHeader pubkey;

import "../debotLib/Debot.sol";
import "../debotLib/Terminal.sol";
import "../debotLib/Menu.sol";
import "../debotLib/AddressInput.sol";
import "../debotLib/ConfirmInput.sol";
import "../debotLib/SigningBoxInput.sol";
import "../debotLib//NumberInput.sol";

import "../interfaces/IMultisig.sol";
import "../ADataCore.sol";
import "../DirectSaleRoot.sol";
import "../DirectSale.sol";

contract SellingDebot is Debot {

    address static _addrDirectSaleRoot;

    address _addrWallet;
    uint32 _keyHandle;
    
    address _addrNft;
    address _addrSale;
    bool _isRootTrusted;
    uint128 _nftPrice;
    bool _isDurationLimited;
    uint64 _saleDuration;


    /// @notice Returns Metadata about DeBot.
    function getDebotInfo() public functionID(0xDEB) override view returns(
        string name, string version, string publisher, string key, string author,
        address support, string hello, string language, string dabi, bytes icon
    ) {
        name = "NFT selling DeBot";
        version = "0.0.1";
        publisher = "";
        key = "";
        author = "";
        support = address(0);
        hello = "Hi, i'm a Nft Selling DeBot.";
        language = "en";
        dabi = m_debotAbi.get();
        icon = "";
    }

    function getRequiredInterfaces() public view override returns (uint256[] interfaces) {
        return [ Terminal.ID, Menu.ID, AddressInput.ID, SigningBoxInput.ID, ConfirmInput.ID, NumberInput.ID ];
    }

    function start() public override {
        Terminal.print(0, 'You need to attach wallet that will be used to pay for all transactions.');
        attachWallet();
    }

    function menu() public {
        MenuItem[] _items;
        
        Terminal.print(0, format( "Your NFT address is {}", _addrNft));

        if (_isRootTrusted) {
            _items.push(MenuItem("Create sale", "", tvm.functionId(createSale)));
        } else {
            _items.push(MenuItem("Cancel sale", "", tvm.functionId(cancelSale)));
            _items.push(MenuItem("Show sale info", "", tvm.functionId(showSaleInfo)));
        }
        
        _items.push(MenuItem("Change NFT", "", tvm.functionId(enterNft)));
        
        Menu.select("Choose option=", "", _items);
    }

    /*
    * WALLET
    */

    function attachWallet() public {
        tvm.accept();
        AddressInput.get(tvm.functionId(saveMultisig), "Enter your wallet address:");
    }

    function saveMultisig(address value) public {
        tvm.accept();
        _addrWallet = value;
        enterKeys();
    }
    
    function enterKeys() public {
        uint[] none;
        SigningBoxInput.get(tvm.functionId(setKeyHandle), "Enter keys to sign all operations.", none);
    }
    
    function setKeyHandle(uint32 handle) public {
        tvm.accept();
        _keyHandle = handle;
        enterNft();    
    } 
  
    /*
    * NFT
    */

    function enterNft() public {
        tvm.accept();
        AddressInput.get(tvm.functionId(setNFT), "Enter NFT address:");
    }

    function setNFT(address value) public {
        tvm.accept();
        _addrNft = value;
        
        DataCore(_addrNft).getOwner{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(checkOwnership),
            onErrorId: 0,
            time: 0,
            expire: 0,
            sign: false
        }();
    }

    function checkOwnership(address addrOwner) public {
        tvm.accept();
        if (_addrWallet == addrOwner) {
            getTrusted();
        } else {
            Terminal.print(tvm.functionId(enterNft), format("This NFT has a different owner"));
        }
    }

    /*
    * TRUSTED
    */

    function getTrusted() public {
        tvm.accept();
        DataCore(_addrNft).getAllowance{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(checkTrusted),
            onErrorId: 0,
            time: 0,
            expire: 0,
            sign: false
        }();
    }

    function checkTrusted(address addr) public {
        tvm.accept();
        if (addr == _addrDirectSaleRoot) {
            _isRootTrusted = true;
            menu();
        } else if (addr == address(0)) {
            ConfirmInput.get(tvm.functionId(grantOwnership), "DirectSaleRoot is not trusted yet. Give it rights to sell?");
        } else {
            _addrSale = addr;
            getSaleInfo(_addrSale, tvm.functionId(isNftOnSale));
        }
    }

    function grantOwnership(bool value) public {
        tvm.accept();
        if (value) {
            TvmCell payload = tvm.encodeBody(DataCore.lendOwnership, _addrDirectSaleRoot);
            optional(uint256) none;
            IMultisig(_addrWallet).sendTransaction {
                abiVer: 2,
                extMsg: true,
                sign: true,
                pubkey: none,
                time: 0,
                expire: 0,
                callbackId: tvm.functionId(getTrusted),
                onErrorId: tvm.functionId(onErrorSale),
                signBoxHandle: _keyHandle
            }(_addrNft, 2 ton, true, 3, payload);
        }
    }

    /*
    * CREATE NEW SALE
    */

    function createSale(uint32 index) public {
        tvm.accept();
        TvmCell payload = tvm.encodeBody(
            IDirectSaleRoot.createSale,
            _addrNft
        );
        optional(uint256) none;
        IMultisig(_addrWallet).sendTransaction {
            abiVer: 2,
            extMsg: true,
            sign: true,
            pubkey: none,
            time: 0,
            expire: 0,
            callbackId: tvm.functionId(getSaleAddress),
            onErrorId: 0,
            signBoxHandle: _keyHandle
        }(_addrDirectSaleRoot, 2 ton, true, 3, payload);
    }

    function getSaleAddress() public {
        tvm.accept();
        IDirectSaleRoot(_addrDirectSaleRoot).getSaleAddress{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(setSaleAddress),
            onErrorId: 0,
            time: 0,
            expire: 0,
            sign: false
        }(_addrWallet, _addrNft);
    }

    function setSaleAddress(address addrSale) public {
        _addrSale = addrSale;
        NumberInput.get(tvm.functionId(setPrice), "Enter NFT price:", 1, 999999999999999);
    }

    /*
    * SET SALE PARAMS
    */

    function setPrice(int256 value) public {
        _nftPrice = uint128(value);
        ConfirmInput.get(tvm.functionId(setLimitation), "Is sale duration limited?");
    }


    function setLimitation(bool value) public {
        _isDurationLimited = value;
        if (_isDurationLimited) {
            startSale();
        } else {
            NumberInput.get(tvm.functionId(setDuration), "Enter sale duration:", 1, 999999999999999);
        }
    }

    function setDuration(int256 value) public {
        _saleDuration = uint64(value);
        _isRootTrusted = false;
        startSale();
    }

    /*
    * START SALE
    */

    function startSale() private {
        tvm.accept();
        TvmCell payload = tvm.encodeBody(
            DirectSale.start,
            _nftPrice,
            _isDurationLimited,
            _saleDuration
        );
        optional(uint256) none;
        IMultisig(_addrWallet).sendTransaction {
            abiVer: 2,
            extMsg: true,
            sign: true,
            pubkey: none,
            time: 0,
            expire: 0,
            callbackId: tvm.functionId(menu),
            onErrorId: 0,
            signBoxHandle: _keyHandle
        }(_addrSale, 2 ton, true, 3, payload);
    }

    /*
    * CANCEL SALE
    */

    function cancelSale() public view {
        tvm.accept();
        TvmCell payload = tvm.encodeBody(
            DirectSale.cancel
        );
        optional(uint256) none;
        IMultisig(_addrWallet).sendTransaction {
            abiVer: 2,
            extMsg: true,
            sign: true,
            pubkey: none,
            time: 0,
            expire: 0,
            callbackId: tvm.functionId(enterNft),
            onErrorId: 0,
            signBoxHandle: _keyHandle
        }(_addrSale, 2 ton, true, 3, payload);
    }

    /*
    * CHECK SALE INFO
    */

    function getSaleInfo(address addrSale, uint32 answerId) public {
        tvm.accept();
        DirectSale(_addrSale).getInfo{
            abiVer: 2,
            extMsg: true,
            callbackId: answerId,
            onErrorId: tvm.functionId(onErrorSale),
            time: 0,
            expire: 0,
            sign: false
        }();
    }

    function isNftOnSale(
        address addrRoot,
        address addrOwner,
        address addrNft,
        uint128 nftPrice,
        uint64 saleStartTime,
        uint64 saleEndTime
    ) public {
        tvm.accept();
        if (addrRoot == _addrDirectSaleRoot &&
            addrNft == _addrNft &&
            addrOwner == _addrWallet) {
            menu();
        } else {
            onErrorSale(0,0);
        }
    }

    function printSaleInfo(
        address addrRoot,
        address addrOwner,
        address addrNft,
        uint128 nftPrice,
        uint64 saleStartTime,
        uint64 saleEndTime
    ) public {
        Terminal.print(0, format("addrRoot: {}", addrRoot));
        Terminal.print(0, format("addrOwner: {}", addrOwner));
        Terminal.print(0, format("addrNft: {}", addrNft));
        Terminal.print(0, format("nftPrice: {}", nftPrice));
        Terminal.print(0, format("saleStartTime: {}", saleStartTime));
        Terminal.print(tvm.functionId(menu), format("saleEndTime: {}", saleEndTime));
    }

    function showSaleInfo() public {
        getSaleInfo(_addrSale, tvm.functionId(printSaleInfo));
    }

    function onErrorSale(uint32 sdkError, uint32 exitCode) public {
        Terminal.print(tvm.functionId(enterNft), format("This NFT cannot be put up for sale (sdkError: {}, exitCode: {})", sdkError, exitCode));
    }
}