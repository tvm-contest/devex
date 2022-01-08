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

    bool _alreadyBought = false;
    bool _canceled = false;
    bool _isNftTradable;

    uint128 _price;
    uint64 _endUnixtime;

    constructor(
        uint128 price,
        uint64 endUnixtime
    ) public {
        require(msg.sender == _addrRoot, DirectSellErr.ONLY_ROOT, "Only root allowed");
        require(price > 0, DirectSellErr.WRONG_NUMBER_IS_GIVEN, "Price must be greater than zero");
        tvm.accept();

        _price = price;
        if (endUnixtime == 0) {
            _endUnixtime = 9999999999999;
        }
        else {
            require(endUnixtime > 0, DirectSellErr.WRONG_NUMBER_IS_GIVEN, "Duration must be greater than zero");
            _endUnixtime = endUnixtime;
        }
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

    function buy() 
        public
        nftTransferSolvency
    {
        require(_canceled == false, DirectSellErr.TOKEN_IS_WITHDRAWN, "Token is withdrawn");
        require (now < _endUnixtime, DirectSellErr.DEAL_EXPIRED, "Deal expired");
        require(_alreadyBought == false, DirectSellErr.ALREADY_BOUGHT, "Token is already bought");
        require(msg.value >= _price + Constants.MESSAGE_FEE, DirectSellErr.LOW_MESSAGE_VALUE, "Check account balance");

        tvm.accept();

        tvm.rawReserve(address(this).balance - msg.value, 0);

        IData(_addrNFT).transferOwnership{value: _price - Constants.MARKET_REWARD}(msg.sender);
        _alreadyBought = true;

        IData(_addrNFT).returnRightsBack();
        _isNftTradable = false;

        msg.sender.transfer({value: 0, flag: 128});
    }

    function cancel() 
        public
        onlyOwner
        enoughValueForMessage
    {
        require(_alreadyBought == false, DirectSellErr.ALREADY_BOUGHT, "Token is already bought");
        tvm.accept();

        IData(_addrNFT).returnRightsBack();
        _canceled = true;
        _isNftTradable = false;
    }

    function destroy() public onlyOwner{
        require(_canceled || _alreadyBought, DirectSellErr.NEED_TO_CANCEL_OR_BUY);
        tvm.accept();
        selfdestruct(_addrOwner);
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
        withdrawn = _canceled;
        isNftTradable = _isNftTradable;
        price = _price;
        endUnixtime = _endUnixtime;
    }

    function getIsCanceled() public view returns(
        bool isCanceled)
    {
        isCanceled = _canceled;
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
