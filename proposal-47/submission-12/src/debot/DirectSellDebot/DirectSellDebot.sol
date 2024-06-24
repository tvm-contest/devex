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

import "../../contracts/interfaces/IData.sol";
import "../../contracts/market/DirectSellRoot.sol";
import "../../contracts/market/DirectSell.sol";


interface IDirectSellRoot {

    function deployDirectSell(
        address directSellCreator,
        uint64 durationInSec,
        address addrNFT,
        uint128 price 
    ) external;

    function getDirectSellAddress(
        address addrOwner, 
        address addrNFT
    ) external;
}

interface IDirectSell {

    function getInfo() external view returns(
        address addrRoot,
        address addrOwner,
        address addrNFT,
        bool alreadyBought,
        bool withdrawn,
        bool isNftTradable,
        uint128 price,
        uint64 endUnixtime
    );

    function cancel() external;
}

interface IMultisig {

    function sendTransaction(
        address dest,
        uint128 value,
        bool bounce,
        uint8 flags,
        TvmCell payload
    ) external;

}

struct DirectSellDetails {
    address addrOwner;
    address addrNFT;
    uint128 price;
    uint64 endUnixtime;
}

struct NFTParams {
    address addrData;
    address addrRoot;
    address addrOwner;
    address addrTrusted;
    string rarityName;
    string url;
}

contract DirectSellDeboot is Debot {

    uint128  _min_duration_minutes=10;
    uint128  _max_duration_minutes=1440;

    uint128  _min_durations_hours=1;
    uint128  _max_durations_hours=168;

    uint128  _min_durations_days=1;
    uint128  _max_durations_days=30;

    address _directSellRootAddr;
    uint32 _keyHandle;

    address _addrNFT;
    DirectSellDetails _directSellDetails;
    NFTParams _nftParams;
    address _addrMultisig;
    uint128 _price;
    int256 _durationInSec;
    address _directSellAddr;

    /// @notice Returns Metadata about DeBot.
    function getDebotInfo() public functionID(0xDEB) override view returns(
        string name, string version, string publisher, string caption, string author,
        address support, string hello, string language, string dabi, bytes icon
    ) {
        name = "Direct NFT Sales Debot";
        version = "0.1.0";
        publisher = "";
        caption = "";
        author = "Riezowe Kawatashi";
        support = address(0);
        hello = "Hi, I will help you sell NFTs!";
        language = "en";
        dabi = m_debotAbi.get();
        icon = "";
    }

    function getRequiredInterfaces() public view override returns (uint256[] interfaces) {
        return [ Terminal.ID, Sdk.ID, AddressInput.ID, Menu.ID, AmountInput.ID, ConfirmInput.ID];
    }

    function setSellRootContractAddr(address value) public {
        _directSellRootAddr = value;
        printNftInfo();
    }

    function setDurationMinMaxMinutes(uint128  min_duration_minutes, uint128  max_duration_minutes) public {
        require(msg.pubkey() == tvm.pubkey(), 100);
        tvm.accept();

        _min_duration_minutes = min_duration_minutes;
        _max_duration_minutes = max_duration_minutes;
    }

    function setDurationMinMaxDays(uint128  min_durations_days, uint128  max_durations_days) public {
        require(msg.pubkey() == tvm.pubkey(), 100);
        tvm.accept();

        _min_durations_days = min_durations_days;
        _max_durations_days = max_durations_days;
    }

    function setDurationMinMaxHours(uint128  min_durations_hours, uint128  max_durations_hours) public {
        require(msg.pubkey() == tvm.pubkey(), 100);
        tvm.accept();

        _min_durations_hours = min_durations_hours;
        _max_durations_hours = max_durations_hours;
    }

    /// @notice Entry point function for DeBot.
    function start() public override {
        _start();
    }

    function _start() public {
        AddressInput.get(tvm.functionId(getNftAddress), "Please enter address of NFT which you want to sell");
    }

    function getNftAddress(address value) public {
        Sdk.getAccountType(tvm.functionId(checkNftAccountStatus), value);
        _addrNFT = value;
	}

    function checkNftAccountStatus(int8 acc_type) public {
        if (!_checkAccountStatus(acc_type, "NFT contract")) {
            _restart();
            return;
        }

        getNftContractData();
    }

    function _checkAccountStatus(int8 acc_type, string obj) private returns (bool) {
        if (acc_type == -1)  {
            Terminal.print(0, obj + " is inactive");
            return false;
        }
        if (acc_type == 0) {
            Terminal.print(0, obj + " is uninitialized");
            return false;
        }
        if (acc_type == 2) {
            Terminal.print(0, obj + " is frozen");
            return false;
        }
        return true;
    }

    function getNftContractData() public view {
        _getNftContractDetail(tvm.functionId(setNftItemDetails));
    }

    function _restart() public {
        _addrNFT = address(0);
        _price = 0;
        _durationInSec = 0;
        _directSellAddr = address(0);

        _nftParams.rarityName = "";
        _nftParams.url = "";

        _directSellDetails.addrOwner = address(0);
        _directSellDetails.addrNFT = address(0);
        _directSellDetails.price = 0;
        _directSellDetails.endUnixtime = 0;

        _start();
    }

    function _getNftContractDetail(uint32 answerId) private view {
        IData(_addrNFT).getInfo{
            abiVer: 2,
            extMsg: true,
            callbackId: answerId,
            onErrorId: tvm.functionId(onError),
            time: uint64(now),
            expire: 0,
            sign: false
        }();
    }

    function onError(uint32 sdkError, uint32 exitCode) public {
        Terminal.print(0, format("🔴 Sdk error {}. Exit code {}.", sdkError, exitCode));
        _restart();
    }

    function setNftItemDetails(    
        address addrData,
        address addrRoot,
        address addrOwner,
        address addrTrusted,
        string rarityName,
        string url
    ) public 
    {
        _nftParams.addrData = addrData;
        _nftParams.addrRoot = addrRoot;
        _nftParams.addrOwner = addrOwner;
        _nftParams.addrTrusted = addrTrusted;
        _nftParams.rarityName = rarityName;
        _nftParams.url = url;

        getWalletData();
    }


    function getWalletData() public {
        _addrMultisig = address(0);
        AddressInput.get(tvm.functionId(_getWalletAddress), "📝 Enter Multi-Signature Wallet address: ");
    }

    function _getWalletAddress(address value) public  {
        Sdk.getAccountType(tvm.functionId(checkWalletAccountStatus), value);
        _addrMultisig = value;
	}

    function getWalletKeys() public {
        uint[] none;
        SigningBoxInput.get(tvm.functionId(setKeyHandle), "🔑 Enter keys to sign all operations.", none);
    }

    function setKeyHandle(uint32 handle) public {
        tvm.accept();
        _keyHandle = handle;
        getSellRootContractAddr();
    }

    function getSellRootContractAddr() public {
        _directSellRootAddr = address(0);
        AddressInput.get(tvm.functionId(setSellRootContractAddr), "📝 Enter Direct Sell Root address: ");
    }

    function checkWalletAccountStatus(int8 acc_type) public {
        if (!_checkAccountStatus(acc_type, "Wallet")) {
            getWalletData();
            return;
        }

        Sdk.getAccountCodeHash(tvm.functionId(checkWalletHash), _addrMultisig);
    }

    function checkWalletHash(uint256 code_hash) public {
        // safe msig
        if (code_hash != 0x80d6c47c4a25543c9b397b71716f3fae1e2c5d247174c52e2c19bd896442b105 &&
        // surf msig
            code_hash != 0x207dc560c5956de1a2c1479356f8f3ee70a59767db2bf4788b1d61ad42cdad82 &&
        // 24 msig
            code_hash != 0x7d0996943406f7d62a4ff291b1228bf06ebd3e048b58436c5b70fb77ff8b4bf2 &&
        // 24 setcode msig
            code_hash != 0xa491804ca55dd5b28cffdff48cb34142930999621a54acee6be83c342051d884 &&
        // setcode msig
            code_hash != 0xe2b60b6b602c10ced7ea8ede4bdf96342c97570a3798066f3fb50a4b2b27a208) {

            Terminal.print(0, "Unknown wallet type");
            getWalletData();
            return;
        }
        getWalletKeys();
    }

    function printNftInfo() public {
        printNFTDetails();
        CheckOwner();
    }

    function printNFTDetails() public {
        string str = format("NFT address: {}\nNFT owner: {}\nRarity: {}\nMedia link: {}",
            _nftParams.addrData,
            _nftParams.addrOwner,
            _nftParams.rarityName,
            _nftParams.url
        );

        Terminal.print(0, str);
    }

    function CheckOwner() public {
        if (_addrMultisig != _nftParams.addrOwner) {
            Terminal.print(0, "You are not owner of NFT");
            getWalletData();
        }

        getPrice();
    }

    // function CheckAlreadySell() public {
    //     if (_s_lendOwnerDetails.lend_finish_time > now)
    //     {
    //         printAlreadyOnSale();
    //         return;
    //     }
    //     getPrice();
    // }

    // function printAlreadyOnSale()public {
    //     string str = format("Nft contract already on sale by address {}",
    //         _s_lendOwnerDetails.lend_owner_addr);

    //     Terminal.print(tvm.functionId(getDirectSellContractData2), str);
    // }


    // function getDirectSellContractData2() public view  {
    //     optional(uint256) none;
        
    //     IDirectSell(_s_lendOwnerDetails.lend_owner_addr).getDetails{
    //         abiVer: 2,
    //         extMsg: true,
    //         sign: false,
    //         pubkey: none,
    //         time: uint64(now),
    //         expire: 0,
    //         callbackId: tvm.functionId(setDirectSellContractData2),
    //         onErrorId: 0
    //     }();
    // } 

    // function setDirectSellContractData2(
    //         address walletCreator,
    //         uint64 endUnixtime,
    //         address wallet_market,
    //         uint128 wallet_perc,
    //         address walletNft,
    //         uint128 price) public {

    //     _directSellDetails.wallet_destruct_rewards = walletCreator;
    //     _directSellDetails.endUnixtime = endUnixtime;
    //     _directSellDetails.wallet_market = wallet_market;
    //     _directSellDetails.wallet_perc = wallet_perc;
    //     _directSellDetails.walletNft = walletNft;
    //     _directSellDetails.price = price;

    //     CanCancel();
    // }

    // function CanCancel() public {
    //     if (_directSellDetails.wallet_destruct_rewards == _addrMultisig)
    //     {
    //        ConfirmInput.get(tvm.functionId(CancelContract), "Cancel?");
    //        return;
    //     }
    //     _restart();
    // }

    // function CancelContract(bool value) public {
    //     optional(uint256) pubkey;


    //     if (value)
    //     {
    //         TvmCell body = tvm.encodeBody(IDirectSell.Cancel);
    //         IMultisig(_addrMultisig).submitTransaction{
    //         abiVer: 2,
    //         extMsg: true,
    //         sign: true,
    //         pubkey: pubkey,
    //         time: uint64(now),
    //         expire: 0,
    //         callbackId: 0, //tvm.functionId(onlendOwnerAddrSuccess),
    //         onErrorId: tvm.functionId(onDlendOwnerAddrError)
    //         }(_s_lendOwnerDetails.lend_owner_addr, 1 ton, true, false, body);


    //         Terminal.print(0, "message sended");
    //     }
    //     _restart();

    // }

    function getPrice() public {
        AmountInput.get(tvm.functionId(setAmount), "Enter price.", 9, 5000000000, 500000000000000);
    }

    function setAmount(uint128 value) public {
        _price = value;
        showDurationMenu();
    }

    function showDurationMenu() public {
        MenuItem[] items;

        items.push( MenuItem("Minutes", "", tvm.functionId(askDurationInMinutes)) );
        items.push( MenuItem("Hours", "", tvm.functionId(askDurationInHours)) );
        items.push( MenuItem("Days", "", tvm.functionId(askDurationInDays)) );
        items.push( MenuItem("Back to start", "", tvm.functionId(askDurationBack)) );

        Menu.select("Set deal duration:", "", items);
    }

    function askDurationInMinutes(uint32 index) public {
        index = index;
        string str = format("Min {} minutes, max {} minutes (1day)",
            _min_duration_minutes,
            _max_duration_minutes
            );
        AmountInput.get(tvm.functionId(setDurationInMinutes), str, 0, _min_duration_minutes, _max_duration_minutes);
    }

    function setDurationInMinutes(uint128 value) public {
        _durationInSec = value*60;
        SellItem();
    }

    function askDurationInHours(uint32 index) public {
            index = index;

            string str = format("Min {} hour, max {} hours (7 days)",
            _min_durations_hours,
            _max_durations_hours
            );
        AmountInput.get(tvm.functionId(setDurationInHours), str, 0, _min_durations_hours, _max_durations_hours);

    }

    function askDurationBack(uint32 index) public {
            index = index;
            _restart();
    }

    function setDurationInHours(uint128 value) public {
        _durationInSec = value*60*60;
        SellItem();
    }

    function askDurationInDays(uint32 index) public {
        index = index;
        string str = format("Min {} day, max {} days",
            _min_durations_days,
            _max_durations_days
            );
        AmountInput.get(tvm.functionId(setDurationInDays), str, 0, _min_durations_days, _max_durations_days);

    }

    function setDurationInDays(uint128 value) public {
        _durationInSec = value*60*60*24;
        SellItem();
    }

    function SellItem() public
    {
        uint128 marketRewards = 1;
        ConfirmInput.get(tvm.functionId(createDirectSell), format("Details.\nNFT address: {}\nOwner: {}\nRarity: {}\nMedia link: {}\nMarket reward: {}\nYour reward: {}\n\nPay 2 tokens for create deal.\nConfirm?",
        _nftParams.addrData,
        _nftParams.addrOwner,
        _nftParams.rarityName,
        _nftParams.url,
        tokensToStr(marketRewards),
        tokensToStr(_price - marketRewards)
        ));
    }

    function createDirectSell(bool value) public {
        optional(uint256) pubkey;

        if (!value) {
            printNftInfo();
            return;
        }

        TvmCell payload = tvm.encodeBody(
            IDirectSellRoot.deployDirectSell, 
            _addrMultisig, 
            uint64(_durationInSec), 
            _addrNFT, 
            _price
        );
        IMultisig(_addrMultisig).sendTransaction {
            abiVer: 2,
            extMsg: true,
            sign: true,
            pubkey: pubkey,
            time: uint64(now),
            expire: 0,
            callbackId: tvm.functionId(onDeploySuccess),
            onErrorId: tvm.functionId(onDeployError),
            signBoxHandle: _keyHandle
        }(_directSellRootAddr, 2 ton, true, 3, payload);
    }

    function onDeploySuccess(uint64 transId) public {
        transId = transId;
        string str = format("Created transaction id {}",
            transId);
        Terminal.print(0, str);
        getDirectSellAddress(tvm.functionId(setDirectSellAddress));
    }

    function onDeployError(uint32 sdkError, uint32 exitCode) public {
        Terminal.print(0, format("Deploy failed: error {}, code {} ", sdkError, exitCode));
        _restart();
    }

    function getDirectSellAddress(uint32 answerId) private  view {
        optional(uint256) none;

        IDirectSellRoot(_directSellRootAddr).getDirectSellAddress{
            abiVer: 2,
            extMsg: true,
            callbackId: answerId,
            onErrorId: tvm.functionId(onError),
            time: uint64(now),
            expire: 0,
            sign: false
        }(_addrMultisig, _addrNFT);
    }


    function setDirectSellAddress(address addr) public {
        _directSellAddr = addr;
        Terminal.print(tvm.functionId(CheckThatDirectSellDeployed), format("Direct sell address: {}", _directSellAddr));
    }

    function CheckThatDirectSellDeployed() public
    {   
        if (_directSellAddr.value == 0)
        {
            ConfirmInput.get(tvm.functionId(_CheckThatDirectSellDeployed), "Wait several seconds and continue");
            return;
        }

        CheckDirectSellAddress(_directSellAddr);
    }

    function _CheckThatDirectSellDeployed(bool value) public
    {
        if (value)
        {
            getDirectSellAddress(tvm.functionId(setDirectSellAddress));
        }
        else
        {
            ConfirmInput.get(tvm.functionId(StopWhaitThatDirectSellDeployed), "Warning: You loss this deal. Confirm?");
        }
    }

    function StopWhaitThatDirectSellDeployed(bool value) public
    {
        if (value)
        {
            _restart();
        }
        else
        {
            getDirectSellAddress(tvm.functionId(setDirectSellAddress));
        }
    }
    
    function CheckDirectSellAddress(address value) public {
        Sdk.getAccountType(tvm.functionId(checkDirectSellAccountStatus), value);
	}

    function checkDirectSellAccountStatus(int8 acc_type) public {
        if (!_checkAccountStatus(acc_type, "Direct Sell Contract")) 
        {
            ConfirmInput.get(tvm.functionId(CheckThatDirectSellAccountStatusIsActive), "Wait several seconds and continue");
            return;
        }

        Terminal.print(0, format("Direct Sell Contract {} active", _directSellAddr));

        getDirectSellContractData(tvm.functionId(setDirectSellContractData));
    }

    function CheckThatDirectSellAccountStatusIsActive(bool value) public
    {
        if (value)
        {
            CheckThatDirectSellDeployed();
        }
        else
        {
            ConfirmInput.get(tvm.functionId(StopWhaitThatDirectSellAccountStatusIsActive), "Warning: You loss this deal. Confirm?");
        }
    }

    function StopWhaitThatDirectSellAccountStatusIsActive(bool value) public
    {
        if (value)
        {
            _restart();
        }
        else
        {
            CheckThatDirectSellDeployed();
        }
    }
    

    function getDirectSellContractData(uint32 answerId) private view  {
        optional(uint256) none;
        
        IDirectSell(_directSellAddr).getInfo{
            abiVer: 2,
            extMsg: true,
            callbackId: answerId,
            onErrorId: tvm.functionId(onError),
            time: uint64(now),
            expire: 0,
            sign: false
        }();
    } 

    function setDirectSellContractData(
        address addrRoot,
        address addrOwner,
        address addrNFT,
        bool alreadyBought,
        bool withdrawn,
        bool isNftTradable,
        uint128 price,
        uint64 endUnixtime
    ) public
    {
        _directSellDetails.addrOwner = addrOwner;
        _directSellDetails.addrNFT = addrNFT;
        _directSellDetails.price = price;
        _directSellDetails.endUnixtime = endUnixtime;
    }

    function tokens(uint128 nanotokens) private pure returns (uint64, uint64) {
        uint64 decimal = uint64(nanotokens / 1e9);
        uint64 float = uint64(nanotokens - (decimal * 1e9));
        return (decimal, float);
    }

    function tokensToStr(uint128 nanotokens) private pure returns (string) {
        if (nanotokens == 0) return "0";
        (uint64 dec, uint64 float) = tokens(nanotokens);
        string floatStr = format("{}", float);
        while (floatStr.byteLength() < 9) {
            floatStr = "0" + floatStr;
        }
        string result = format("{}.{}", dec, floatStr);
        return result;
    }

}
