pragma ton-solidity >=0.43.0;

pragma AbiHeader expire;
pragma AbiHeader time;

import './libraries/FeeValues.sol';
import './libraries/DirectSaleErrors.sol';

import './interfaces/IData.sol';

contract DirectSale {

    address static _addrRoot;      // адрес родительского DirectSaleRoot
    address static _addrOwner;     // адрес кошелька создателя контракта
    address static _addrNft;       // адрес выставленного на продажу токена
    
    address _addrRoyaltyRoot;
    uint8 _royaltyPercentRoot;
    address _addrRoyaltyAuthor;
    uint8 _royaltyPercentAuthor;
    
    bool _isDurationLimited;       // ограничена ли продажа по времени

    uint128 _nftPrice;             // цена выставленного на продажу токена
    uint64 _saleDuration;          // продолжительность продажи в секундах
    uint64 _saleStartTime;         // дата начала продажи в Unix-time формате

    constructor (
        uint128 nftPrice,
        bool isDurationLimited,
        address addrRoyaltyRecipient,
        uint8 royaltyPercent
    )
        public
    {
        tvm.accept();

        _nftPrice = nftPrice;
        _isDurationLimited = isDurationLimited;
        _addrRoyaltyRoot = addrRoyaltyRecipient;
        _royaltyPercentRoot = royaltyPercent;
    }

    function start()
        external view
        onlySaleOwner
        saleNotStarted
        isValidDuration
        enoughValueToStartSale
    {
        IData(_addrNft).getOwnershipProvidersResponsible{
            value: Fees.MIN_FOR_MESSAGE,
            callback: approveTradability
        }();
    }

    function approveTradability (
        address addrNftOwner,
        address addrTrusted,
        address addrRoyaltyAuthor,
        uint8 royaltyPercent
    )
        public
        onlyNftAsSender
        saleNotStarted
        saleOwnerShouldBeNftOwner(addrNftOwner)
        saleShouldBeTrusted(addrTrusted) 
    {
        _addrRoyaltyAuthor = addrRoyaltyAuthor;
        _royaltyPercentAuthor = royaltyPercent;
        _saleStartTime = now;
    }

    function buy()
        external view
        notSaleOwner
        saleStarted
        saleTimeNotPassed
        enoughValueToBuyNft
    {
        uint128 royaltyValueRoot = math.muldiv(_nftPrice, _royaltyPercentRoot, 100);
        _addrRoyaltyRoot.transfer({value: royaltyValueRoot, flag: 1});

        uint128 royaltyValueAuthor = math.muldiv((_nftPrice - royaltyValueRoot), _royaltyPercentAuthor, 100);
        _addrRoyaltyAuthor.transfer({value: royaltyValueAuthor, flag: 1});
        
        IData(_addrNft).transferOwnership{ value: Fees.MIN_FOR_INDEX_DEPLOY + Fees.MIN_FOR_MESSAGE }(msg.sender);
        IData(_addrNft).returnOwnership{ value: Fees.MIN_FOR_MESSAGE }();

        _addrOwner.transfer({value: 0, flag: 160});
    }

    function cancel()
        external view
        onlySaleOwner
        enoughValueForMessage
    {
        IData(_addrNft).returnOwnership{ value: Fees.MIN_FOR_MESSAGE }();

        _addrOwner.transfer({value: 0, flag: 160});
    }

    function setDuration(uint64 saleDuration)
        external
        onlySaleOwner
        saleNotStarted
        notZeroDuration(saleDuration)
    {
        tvm.accept();
        _saleDuration = saleDuration;
        if (!_isDurationLimited) { _isDurationLimited = true; }
    }

    function makeDurationUnlimited()
        external
        onlySaleOwner
        saleNotStarted
    {
        tvm.accept();
        _isDurationLimited = false;
        if (_saleDuration > 0) { _saleDuration = 0; }
    }

    function getNftPrice() external view returns (uint128 nftPrice) {
        nftPrice = _nftPrice;
    }

    function getInfo() external view returns (
        address addrRoot,
        address addrOwner,
        address addrNft,
        uint128 nftPrice,
        bool isDurationLimited,
        uint64 saleStartTime,
        uint64 saleDuration
    ) {
        addrRoot = _addrRoot;
        addrOwner = _addrOwner;
        addrNft = _addrNft;
        nftPrice = _nftPrice;
        isDurationLimited = _isDurationLimited;
        saleStartTime = _saleStartTime;
        saleDuration = _saleDuration;
    }

    function isSaleStarted() private view returns (bool) {
        return _saleStartTime != 0;
    }

    // MODIFIERS

    modifier onlySaleOwner {
        require(msg.sender == _addrOwner, SaleErr.NOT_SALE_OWNER);
        _;
    }

    modifier notSaleOwner {
        require(msg.sender != _addrOwner, SaleErr.CANNOT_BE_SALE_OWNER);
        _;
    }

    modifier onlyNftAsSender {
        require(msg.sender == _addrNft,
                SaleErr.SENDER_SHOULD_BE_NFT,
                "Action is only available for tradable NFT as message senders");
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
 
    modifier notZeroDuration(uint64 duration) {
        require(duration > 0, SaleErr.ZERO_DURATION);
        _;
    }

    modifier isValidDuration {
        require(!_isDurationLimited || _saleDuration > 0, SaleErr.INVALID_DURATION);
        _;
    }

    modifier saleTimeNotPassed {
        require(!_isDurationLimited || _saleStartTime + _saleDuration > now, SaleErr.SALE_TIME_PASSED);
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

    modifier enoughValueForMessage {
        require(msg.value >= Fees.MIN_FOR_MESSAGE, SaleErr.NOT_ENOUGH_VALUE_FOR_MESSAGE);       
        _;
    }

    modifier enoughValueToStartSale {
        require(msg.value >= 2 * Fees.MIN_FOR_MESSAGE,
                SaleErr.NOT_ENOUGH_VALUE_TO_START_SALE,
                "Message balance is not enough to start sale");       
        _;
    }

    modifier enoughValueToBuyNft {
        require(msg.value >= _nftPrice + Fees.MIN_FOR_INDEX_DEPLOY + 4 * Fees.MIN_FOR_MESSAGE,
                SaleErr.NOT_ENOUGH_VALUE_TO_BUY_NFT,
                "Message balance is not enough to buy NFT");       
        _;
    }
}
