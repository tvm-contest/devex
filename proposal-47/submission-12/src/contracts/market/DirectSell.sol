pragma ton-solidity >=0.43.0;

pragma AbiHeader time;
pragma AbiHeader expire;
pragma AbiHeader pubkey;

import '../interfaces/IData.sol';
import '../libraries/DirectSellErrors.sol';
import '../libraries/Constants.sol';

contract DirectSell {

    address static _addrRoot;
    address static _addrOwner;
    address static _addrNFT;

    bool _alreadyBought;
    bool _withdrawn;
    bool _isNftTradable;

    uint128 _price;
    uint64 _endUnixtime;

    constructor(
        uint128 price
    ) 
        public
    {
        require(msg.sender == _addrRoot, DirectSellErr.ONLY_ROOT, "Only root allowed");
        tvm.accept();
        _price = price;
    }

    function verifyNftTradability()
        public view
        onlyOwner
        enoughValueForMessage
    {
        IData(_addrNFT).getTradabilityInfo{
            value: Constants.MIN_MESSAGE_VALUE,
            callback: setTradabilityStatus
        }();
    }

    function putUpForSale(
        uint128 price, 
        uint64 duration
    ) 
        public
        onlyOwner
    {
        require(price > 0, DirectSellErr.WRONG_NUMBER_IS_GIVEN, "Price must be greater than zero");

        tvm.accept();
        price = _price;
        if (duration == 0) {
            _endUnixtime = 9999999999999;
        }
        else {
            require(duration > 0, DirectSellErr.WRONG_NUMBER_IS_GIVEN, "Duration must be greater than zero");
            _endUnixtime = now + duration;
        }

        msg.sender.transfer({value: 0, flag: 128});

    }

    function buyNftToken() 
        public 
        onlyOwner
        nftTransferSolvency
    {
        require(_withdrawn == false, DirectSellErr.TOKEN_IS_WITHDRAWN, "Token is withdrawn");
        require (now < _endUnixtime, DirectSellErr.DEAL_EXPIRED, "Deal expired");
        require(_alreadyBought == false, DirectSellErr.ALREADY_BOUGHT, "Token is already bought");

        tvm.accept();

        tvm.rawReserve(address(this).balance - msg.value, 0);

        IData(_addrNFT).transferOwnership{value: Constants.MIN_FOR_DEPLOY}(msg.sender);
        _alreadyBought = true;

        IData(_addrNFT).returnRightsBack();
        _isNftTradable = false;

        _addrOwner.transfer({value: 0, flag: 128});

    }

    function withdrawnNftToken() 
        public
        onlyOwner
        enoughValueForMessage
    {
        require(_alreadyBought == false, DirectSellErr.ALREADY_BOUGHT, "Token is already bought");

        tvm.accept();

        _withdrawn = true;

        tvm.rawReserve(address(this).balance - msg.value, 0);

        IData(_addrNFT).returnRightsBack();
        _isNftTradable = false;

        _addrOwner.transfer({value: 0, flag: 128});

    }

    function getInfo() public view returns(
        address addrRoot,
        address addrOwner,
        address addrNFT,
        bool alreadyBought,
        bool withdrawn,
        bool isNftTradable,
        uint128 price,
        uint64 endUnixtime)
    {
        addrRoot = _addrRoot;
        addrOwner = _addrOwner;
        addrNFT = _addrNFT;
        alreadyBought = _alreadyBought;
        withdrawn = _withdrawn;
        isNftTradable = _isNftTradable;
        price = _price;
        endUnixtime = _endUnixtime;
    }

    function getIsCanceled() public view returns(
        bool isCanceled)
    {
        isCanceled = _withdrawn;
    }

    function getIsAlreadBought() public view returns(
        bool isAlreadBought)
    {
        isAlreadBought = _alreadyBought;
    }

    function setTradabilityStatus(address addrNftOwner, address addrTrusted) public onlyNFT {
        tvm.accept();
        if (addrNftOwner == _addrOwner && addrTrusted == address(this)) {
            _isNftTradable = true;
        }
    }

    modifier onlyOwner {
        require(msg.sender == _addrOwner, DirectSellErr.ONLY_OWNER);
        _;
    }

    modifier enoughValueForMessage {
        require(msg.value >= Constants.MIN_MESSAGE_VALUE, DirectSellErr.LOW_MESSAGE_VALUE);       
        _;
    }

    modifier onlyNFT {
        require(msg.sender == _addrNFT, DirectSellErr.NOT_TRADABLE_NFT);
        _;
    }

    modifier nftTransferSolvency {
        require(msg.value >= Constants.MIN_FOR_DEPLOY + 2 * Constants.MIN_MESSAGE_VALUE,
                DirectSellErr.LOW_MESSAGE_VALUE);       
        _;
    }

}