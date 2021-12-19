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
    bool _isSaleStarted;
    uint128 _nftPrice;
    uint64 _saleDuration;


    function start() public override {
        Terminal.print(0, "You need to attach wallet that will be used to pay for all transactions.");
        attachWallet();
    }

    function menu() public {
        MenuItem[] _items;
        
        Terminal.print(0, format( "Your NFT address is {}", _addrNft));

        if (_isRootTrusted) {
            _items.push(MenuItem("Create sale", "", tvm.functionId(createSale)));
            _items.push(MenuItem("Get transfer rights back", "", tvm.functionId(revokeRights)));
        } else {
            Terminal.print(0, format( "Sale address is {}", _addrSale));
            _items.push(MenuItem("Cancel sale", "", tvm.functionId(cancelSale)));
            if (_isSaleStarted) {
                _items.push(MenuItem("Show sale info", "", tvm.functionId(showSaleInfo)));
            } else {
                _items.push(MenuItem("Start sale", "", tvm.functionId(setSaleParams)));
            }
        }
        
        _items.push(MenuItem("Change NFT", "", tvm.functionId(enterNft)));
        
        Menu.select("Choose option", "", _items);
    }

    /*
    * WALLET
    */

    function attachWallet() public {
        AddressInput.get(tvm.functionId(saveMultisig), "Enter your wallet address:");
    }

    function saveMultisig(address value) public {
        _addrWallet = value;
        enterKeys();
    }
    
    function enterKeys() public {
        uint[] none;
        SigningBoxInput.get(tvm.functionId(setKeyHandle), "Enter keys to sign all operations.", none);
    }
    
    function setKeyHandle(uint32 handle) public {
        _keyHandle = handle;
        enterNft();    
    } 
  
    /*
    * NFT
    */

    function enterNft() public {
        AddressInput.get(tvm.functionId(setNftAddress), "Enter NFT address:");
    }

    function setNftAddress(address value) public {
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
        if (_addrWallet == addrOwner) {
            getTrusted();
        } else {
            Terminal.print(0, format("This NFT has a different owner"));
            enterNft();
        }
    }

    /*
    * TRUSTED
    */

    function getTrusted() public view {
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
        if (addr == _addrDirectSaleRoot) {
            _isRootTrusted = true;
            _isSaleStarted = false;
            menu();
        } else if (addr == address(0)) {
            ConfirmInput.get(tvm.functionId(grantOwnership), "Trader is not set as trusted yet. Give it rights to sell your NFT?");
        } else {
            _addrSale = addr;
            getSaleInfo(tvm.functionId(isNftOnSale));
        }
    }

    function grantOwnership(bool value) public view {
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

    function createSale(uint32 index) public view {
        TvmCell payload = tvm.encodeBody(
            DirectSaleRoot.createSale,
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

    function getSaleAddress() public view {
        DirectSaleRoot(_addrDirectSaleRoot).getSaleAddress{
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
        _isRootTrusted = false;
        _addrSale = addrSale;
        Terminal.print(0, "Sale successfully created");
        menu();
    }

    /*
    * SET SALE PARAMS
    */

    function setSaleParams(uint32 index) public {
        NumberInput.get(tvm.functionId(setPrice), "Enter NFT price:", 1, 999999999999999);
    }

    function setPrice(int256 value) public {
        _nftPrice = uint128(value);
        ConfirmInput.get(tvm.functionId(setLimitation), "Is sale duration limited?");
    }

    function setLimitation(bool value) public {
        if (value) {
            NumberInput.get(tvm.functionId(setDuration), "Enter sale duration (in seconds):", 1, 999999999999999);
        } else {
            startSale();
        }
    }

    function setDuration(int256 value) public {
        _saleDuration = uint64(value);
        startSale();
    }

    /*
    * START SALE
    */

    function startSale() private view {
        TvmCell payload = tvm.encodeBody(
            DirectSale.start,
            _nftPrice,
            _saleDuration > 0,
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
            callbackId: tvm.functionId(onSaleStarted),
            onErrorId: 0,
            signBoxHandle: _keyHandle
        }(_addrSale, 2 ton, true, 3, payload);
    }

    function onSaleStarted() public {
        _isSaleStarted = true;
        Terminal.print(0, "Sale successfully started");
        menu();
    }

    /*
    * CANCEL SALE
    */

    function cancelSale() public view {
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
            callbackId: tvm.functionId(onSaleCanceled),
            onErrorId: 0,
            signBoxHandle: _keyHandle
        }(_addrSale, 2 ton, true, 3, payload);
    }

    function onSaleCanceled() public {
        Terminal.print(0, "Sale successfully canceled");
        enterNft();
    }

    /*
    * REVOKE TRANSFER RIGHTS
    */

    function revokeRights() public view {
        TvmCell payload = tvm.encodeBody(
            DirectSaleRoot.returnRights,
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
            callbackId: tvm.functionId(onRightsRevoked),
            onErrorId: 0,
            signBoxHandle: _keyHandle
        }(_addrDirectSaleRoot, 2 ton, true, 3, payload);
    }

    function onRightsRevoked() public {
        Terminal.print(0, "Transfer rights successfully returned");
        enterNft();
    }

    /*
    * SALE INFO
    */

    function getSaleInfo(uint32 answerId) public view {
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
        if (addrRoot == _addrDirectSaleRoot &&
            addrNft == _addrNft &&
            addrOwner == _addrWallet) {
            _isSaleStarted = (saleStartTime != 0);
            menu();
        } else {
            Terminal.print(0, "Transfer rights of this NFT have already been granted to another address");
            enterNft();
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
        Terminal.print(0, "Sale Info:");
        Terminal.print(0, format("Price: {}", nftPrice));
        if (saleEndTime == 0) {
            Terminal.print(0, "Sale duration is unlimited");
        } else {
            if (saleEndTime > now) {
                Terminal.print(0, format("Seconds left until the end of sale: {}", saleEndTime - now));
            } else {
                Terminal.print(0, "Sale duration expired");
            }
        }
        menu();
    }

    function showSaleInfo() public view {
        getSaleInfo(tvm.functionId(printSaleInfo));
    }

    function onErrorSale(uint32 sdkError, uint32 exitCode) public {
        Terminal.print(0, format("This NFT cannot be put up for sale (sdkError: {}, exitCode: {})", sdkError, exitCode));
        enterNft();
    }

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
}