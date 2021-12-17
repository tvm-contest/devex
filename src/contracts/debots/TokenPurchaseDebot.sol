pragma ton-solidity >= 0.43.0;
pragma AbiHeader expire;
pragma AbiHeader time;
pragma AbiHeader pubkey;

// Import debot libs 
import "../debotLib/Debot.sol";
import "../debotLib/Terminal.sol";
import "../debotLib/Menu.sol";
import "../debotLib/AddressInput.sol";
import "../debotLib/ConfirmInput.sol";
import "../debotLib/Upgradable.sol";
import "../debotLib/Sdk.sol";
import "../debotLib/SigningBoxInput.sol";
import "../debotLib//Msg.sol";
import "../debotLib//NumberInput.sol";
import "../debotLib//AmountInput.sol";
import "../debotLib//UserInfo.sol";

import '../DirectSale.sol';

interface IMultisig {
    function sendTransaction(
        address dest,
        uint128 value,
        bool bounce,
        uint8 flags,
        TvmCell payload)
    external;
}

contract TokenPurchaseDebot is Debot, Upgradable {

    address _saleAddress;
    address _addrMultisig;
    address _addrNft;

    uint128 _nftPrice;
    uint32 _keyHandle;

    modifier accept {
        tvm.accept();
        _;
    }

    /*
     *  Overrided Debot functions
     */

    /// @notice Returns Metadata about DeBot.
    function getDebotInfo() public functionID(0xDEB) override view returns(
        string name, string version, string publisher, string key, string author,
        address support, string hello, string language, string dabi, bytes icon
    ) {
        name = "NFT purchase DeBot";
        version = "0.1.0";
        publisher = "";
        key = "Nft purchaser";
        author = "";
        support = address.makeAddrStd(0, 0x66e01d6df5a8d7677d9ab2daf7f258f1e2a7fe73da5320300395f99e01dc3b5f);
        hello = "Hi, i'm a Nft-Purchase DeBot.";
        language = "en";
        dabi = m_debotAbi.get();
        icon = "";
    }

    function getRequiredInterfaces() public view override returns (uint256[] interfaces) {
        return [ Terminal.ID, Menu.ID, AddressInput.ID, SigningBoxInput.ID, ConfirmInput.ID, AmountInput.ID ];
    }

    // initial setup
    function start() public override {
        Terminal.print(0, 'You need to attach future owner of the token.\nIt will be used also to pay for all transactions.');
        attachMultisig();
    }

    function setup1() public {
        uint[] none;
        SigningBoxInput.get(tvm.functionId(setKeyHandle), "Enter keys to sign all operations.", none);

        AddressInput.get(tvm.functionId(saveSaleAddress), "Input sale address: ");
    }
   

    function getSaleInfo() public {
        DirectSale(_saleAddress).getInfo{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(printSaleInfo),
            onErrorId: tvm.functionId(onError),
            time: 0,
            expire: 0,
            sign: false
        }();
    }


    function printSaleInfo(
        address addrRoot,
        address addrOwner,
        address addrNft,
        uint128 nftPrice,
        uint64 saleStartTime,
        uint64 saleEndTime
    ) public {
        Terminal.print(0, format('Root address: {}', addrRoot));
        Terminal.print(0, format('Owner address: {}', addrOwner));
        Terminal.print(0, format('Nft address: {}', addrNft));
        _addrNft = addrNft;
        Terminal.print(0, format('Nft price: {}', nftPrice));
        _nftPrice = nftPrice;
        ConfirmInput.get(tvm.functionId(confirm), "Purchase this token?");
    }

    function confirm(bool value) public {
        if(value){
            makePurchase();
        } else {
            getSaleInfo();
        }
    }

    function makePurchase() public {
        TvmCell payload = tvm.encodeBody(
            DirectSale.buy
        );
        optional(uint256) none;
        IMultisig(_addrMultisig).sendTransaction {
            abiVer: 2,
            extMsg: true,
            sign: true,
            pubkey: none,
            time: 0,
            expire: 0,
            callbackId: tvm.functionId(onTokenBought),
            onErrorId: tvm.functionId(onError),
            signBoxHandle: _keyHandle
        }(_saleAddress, _nftPrice + Fees.MIN_FOR_TRANSFER_OWNERSHIP + 4*Fees.MIN_FOR_MESSAGE , true, 3, payload);
    }

    function saveSaleAddress(address value) public {
        _saleAddress = value;
        getSaleInfo();
    }

    function attachMultisig() public accept {
        AddressInput.get(tvm.functionId(saveMultisig), "Enter address:");
    }
    function saveMultisig(address value) public accept {
        _addrMultisig = value;
        setup1();
    }

    function setKeyHandle(uint32 handle) public accept {
        _keyHandle = handle;
    }

    function onTokenBought() public {
        IData(_addrNft).getInfoResponsible{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(printTokenFinalInfo),
            onErrorId: tvm.functionId(onError),
            time: 0,
            expire: 0,
            sign: false
        }();
        
    }

    function printTokenFinalInfo(
        address addrRoot,
        address addrOwner,
        address addrAuthor,
        address addrData,
        uint256 id,
        bytes name,
        bytes url,
        uint8 number,
        uint8 amount
    ) public {
        Terminal.print(0, format('Token: {}', addrData));
        Terminal.print(0, format('Owner: {}', addrOwner));
        if(addrOwner == _addrMultisig) {
            Terminal.print(0, 'Purchase was successfull!');
        } else {
            Terminal.print(0, 'Purchase has failed!');
        }
        Terminal.print(0, 'Thanks for using our service. ^^');
    }
    function onError(uint32 sdkError, uint32 exitCode) public {
        Terminal.print(0, format("Sdk error {}. Exit code {}.", sdkError, exitCode));
        getSaleInfo();
    }


    function onCodeUpgrade() internal override {
        tvm.resetStorage();
    }
}