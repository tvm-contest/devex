pragma ton-solidity >=0.43.0;

pragma AbiHeader expire;
pragma AbiHeader time;

import './libraries/FeeValues.sol';
import './libraries/DirectSaleErrors.sol';

import 'ARoyaltyPayer.sol';
import './interfaces/IData.sol';

contract DirectSale is ARoyaltyPayer {

    address static _addrRoot;      // адрес родительского DirectSaleRoot
    address static _addrOwner;     // адрес кошелька создателя контракта
    address static _addrNft;       // адрес выставленного на продажу токена
    
    uint128 _nftPrice;             // цена выставленного на продажу токена
    uint64 _saleStartTime;         // дата начала продажи в Unix-time формате
    uint64 _saleEndTime;           // дата начала продажи в Unix-time формате

    constructor (
        address addrRoyaltyAgent,
        uint8 royaltyPercent
    )
        public
    {
        _addrRoyaltyAgent = addrRoyaltyAgent;
        _royaltyPercent = royaltyPercent;
    }

    function start (
        uint128 nftPrice,
        bool isDurationLimited,
        uint64 saleDuration // will be ignored if isDurationLimited = False 
    )
        external
        onlySaleOwner
        saleNotStarted
        validPrice(nftPrice)
        validDuration(isDurationLimited, saleDuration)
        enoughValueToStartSale
    {
        require(!isDurationLimited || saleDuration > 0, SaleErr.INVALID_DURATION);
        _nftPrice = nftPrice;
        _saleStartTime = now;
        if (isDurationLimited) {
            _saleEndTime = _saleStartTime + saleDuration;
        }
    }

    function buy()
        external
        notSaleOwner
        saleStarted
        saleTimeNotPassed
        enoughValueToBuyNft
    {
        _nftPrice = payRoyalty(_nftPrice);

        IData(_addrNft).transferOwnership{ value: _nftPrice + Fees.MIN_FOR_TRANSFER_OWNERSHIP + Fees.MIN_FOR_MESSAGE }(msg.sender);
        IData(_addrNft).returnOwnership{ value: Fees.MIN_FOR_MESSAGE }();

        selfdestruct(_addrOwner);
    }

    function cancel()
        external
        onlySaleOwner
        enoughValueToCancelSale
    {
        IData(_addrNft).returnOwnership{ value: Fees.MIN_FOR_MESSAGE }();

        selfdestruct(_addrOwner);
    }

    function getNftPrice() external view returns (uint128 nftPrice) {
        nftPrice = _nftPrice;
    }

    function getInfo() external view returns (
        address addrRoot,
        address addrOwner,
        address addrNft,
        uint128 nftPrice,
        uint64 saleStartTime,
        uint64 saleEndTime
    ) {
        addrRoot = _addrRoot;
        addrOwner = _addrOwner;
        addrNft = _addrNft;
        nftPrice = _nftPrice;
        saleStartTime = _saleStartTime;
        saleEndTime = _saleEndTime;
    }

    function isSaleStarted() inline private view returns (bool) {
        return _saleStartTime > 0;
    }

    // MODIFIERS

    modifier onlySaleOwner {
        require(msg.sender == _addrOwner,
                SaleErr.NOT_SALE_OWNER,
                "Action is only available to the owner of the sale");
        _;
    }

    modifier notSaleOwner {
        require(msg.sender != _addrOwner,
                SaleErr.CANNOT_BE_SALE_OWNER,
                "Action is not available for sale owner");
        _;
    }

    modifier validPrice(uint128 price) {
        require(price > 0, SaleErr.ZERO_PRICE);
        _;
    }

    modifier validDuration(bool isDurationLimited, uint64 saleDuration) {
        require(!isDurationLimited || saleDuration > 0, SaleErr.INVALID_DURATION);
        _;
    }

    modifier saleOwnerShouldBeNftOwner(address addrNftOwner) {
        require(addrNftOwner == _addrOwner,
                SaleErr.SALE_OWNER_IS_NOT_NFT_OWNER,
                "Only NFT owner can start the sale");
        _;
    }

    modifier saleShouldBeTrusted(address addrTrusted) {
        require(addrTrusted == address(this),
                SaleErr.SALE_IS_NOT_TRUSTED,
                "NFT can be sold only by trusted DirectSale");
        _;
    }
 
    modifier saleTimeNotPassed {
        require(isSaleStarted() && (_saleEndTime > now || _saleEndTime == 0),
                SaleErr.SALE_TIME_PASSED,
                "NFT can be sold only by trusted DirectSale");
        _;
    }

    modifier saleStarted {
        require(isSaleStarted(), SaleErr.SALE_NOT_STARTED);
        _;
    }

    modifier saleNotStarted {
        require(!isSaleStarted(), SaleErr.SALE_STARTED);
        _;
    }

    modifier enoughValueToCancelSale {
        require(msg.value >= Fees.MIN_FOR_MESSAGE,
                SaleErr.NOT_ENOUGH_VALUE_TO_BUY_NFT,
                "Message balance is not enough to cancel sale");       
        _;
    }

    modifier enoughValueToStartSale {
        require(msg.value >= 0.1 ton,
                SaleErr.NOT_ENOUGH_VALUE_TO_START_SALE,
                "Message balance is not enough to start sale");       
        _;
    }

    modifier enoughValueToBuyNft {
        require(msg.value >= _nftPrice + Fees.MIN_FOR_TRANSFER_OWNERSHIP + 3 * Fees.MIN_FOR_MESSAGE,
                SaleErr.NOT_ENOUGH_VALUE_TO_BUY_NFT,
                "Message balance is not enough to buy NFT");       
        _;
    }
}
