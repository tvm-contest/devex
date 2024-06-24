pragma ton-solidity >=0.43.0;

pragma AbiHeader expire;
pragma AbiHeader time;

import './libraries/FeeValues.sol';
import './libraries/AuctionErrors.sol';

import 'ARoyaltyPayer.sol';
import './interfaces/IData.sol';

contract Auction is ARoyaltyPayer {

    address static _addrRoot;      // адрес родительского AuctionRoot
    address static _addrOwner;     // адрес кошелька создателя аукциона
    address static _addrNft;       // адрес токена

    uint128 _initialPrice;         // начальная цена за выставленный токен
    uint128 _minBidStep;           // минимальная сумма для шага ставки
    uint128 _highestBidValue;      // размер максимальной ставки
    address _addrHighestBidder;    // адрес предложившего максимальную ставку

    uint64 _auctionStartTime;      // дата окончания аукциона в Unix-time формате
    uint64 _auctionDuration;       // продолжительность аукциона в секундах

    constructor (
        address addrRoyaltyAgent,
        uint8 royaltyPercent
    )
        public
    {
        _addrRoyaltyAgent = addrRoyaltyAgent;
        _royaltyPercent = royaltyPercent;
    }

    function start(
        uint128 initialPrice,
        uint128 minBidStep,
        uint64 auctionDuration
    )
        public
        onlyOwner
        auctionNotStarted
        validPrice(initialPrice)
        validDuration(auctionDuration)
        enoughValueToStartAuction
    {
        _initialPrice = initialPrice;
        _minBidStep = minBidStep;
        _auctionDuration = auctionDuration;
        _auctionStartTime = now;

    }

    function placeBid(uint128 bidValue)
        public
        notOwner
        auctionStarted
        auctionTimeNotPassed
        enoughValueToMakeBid(bidValue)
    {    
        tvm.rawReserve(address(this).balance - _highestBidValue - (msg.value - bidValue), 0);

        if (isAnyBid()) {
            _addrHighestBidder.transfer({value: _highestBidValue, flag: 1});
        }

        _highestBidValue = bidValue;
        _addrHighestBidder = msg.sender;

        msg.sender.transfer({value: 0, flag: 128});
    }

    function finish()
        public
        onlyOwnerOrWinner
        anyBidMade
        auctionTimePassed
        enoughValueToFinishAuction
    {
        _highestBidValue = payRoyalty(_highestBidValue);

        IData(_addrNft).transferOwnership{ value: Fees.MIN_FOR_INDEX_DEPLOY + Fees.MIN_FOR_MESSAGE }(_addrHighestBidder);
        IData(_addrNft).returnOwnership{ value: Fees.MIN_FOR_MESSAGE }();

        selfdestruct(_addrOwner);
    }

    function cancel()
        external
        onlyOwner
        noBidsMade
        auctionStarted
        enoughValueToCancelAuction
    {
        IData(_addrNft).returnOwnership{ value: Fees.MIN_FOR_MESSAGE }();

        selfdestruct(_addrOwner);
    }

    function getHighestBid() external anyBidMade view returns (uint128 highestBidValue) {
        highestBidValue = _highestBidValue;
    }

    function getInfo() external view returns (
        address addrRoot,
        address addrOwner,
        address addrNft,
        uint128 initialPrice,
        uint128 minBidStep,
        uint64 auctionStartTime,
        uint64 auctionDuration,
        address addrHighestBidder,
        uint128 highestBidValue
    ) {
        addrRoot = _addrRoot;
        addrOwner = _addrOwner;
        addrNft = _addrNft;
        initialPrice = _initialPrice;
        minBidStep = _minBidStep;
        auctionStartTime = _auctionStartTime;
        auctionDuration = _auctionDuration;
        addrHighestBidder = _addrHighestBidder;
        highestBidValue = _highestBidValue;
    }

    function isAuctionStarted() inline private view returns (bool) {
        return _auctionStartTime != 0;
    }

    function isAnyBid() inline private view returns (bool) {
        return _addrHighestBidder != address(0);
    }

    // MODIFIERS

    modifier onlyOwner {
        require(msg.sender == _addrOwner, AuctionErr.NOT_OWNER);
        _;
    }

    modifier notOwner {
        require(msg.sender != _addrOwner, AuctionErr.CANNOT_BE_OWNER);
        _;
    }

    modifier onlyOwnerOrWinner {
        require(msg.sender == _addrOwner || msg.sender == _addrHighestBidder, AuctionErr.NOT_OWNER_NOR_WINNER);
        _;
    }

    modifier validPrice(uint128 price) {
        require(price > 0, AuctionErr.ZERO_INITIAL_PRICE);
        _;
    }

    modifier validDuration(uint64 duration) {
        require(duration > 0, AuctionErr.ZERO_DURATION);
        _;
    }

    modifier auctionTimeNotPassed {
        require(_auctionStartTime + _auctionDuration > now, AuctionErr.AUCTION_TIME_PASSED);
        _;
    }

    modifier auctionTimePassed {
        require(_auctionStartTime + _auctionDuration < now, AuctionErr.AUCTION_TIME_NOT_PASSED);
        _;
    }

    modifier auctionStarted {
        require(isAuctionStarted(), AuctionErr.AUCTION_NOT_STARTED);
        _;
    }

    modifier auctionNotStarted {
        require(!isAuctionStarted(), AuctionErr.AUCTION_STARTED);
        _;
    }

    modifier noBidsMade {
        require(!isAnyBid(), AuctionErr.BIDS_EXIST);
        _;
    }

    modifier anyBidMade {
        require(isAnyBid(), AuctionErr.BIDS_NOT_EXIST);
        _;
    }

    modifier enoughValueToMakeBid(uint128 bidValue) {
        require(msg.value > _initialPrice, AuctionErr.BID_LESS_THAN_INITIAL_PRICE);
        require(msg.value > _highestBidValue + _minBidStep, AuctionErr.BID_LESS_THAN_HIGHEST);
        require(msg.value >= bidValue + Fees.MIN_FOR_MESSAGE, AuctionErr.NOT_ENOUGH_VALUE_TO_SEND_BID);
        _;
    }

    modifier enoughValueToStartAuction {
        require(msg.value >= 3 * Fees.MIN_FOR_MESSAGE,
                AuctionErr.NOT_ENOUGH_VALUE_TO_START_AUCTION);
        _;
    }

    modifier enoughValueToFinishAuction {
        require(msg.value >= Fees.MIN_FOR_INDEX_DEPLOY + 4 * Fees.MIN_FOR_MESSAGE,
                AuctionErr.NOT_ENOUGH_VALUE_TO_FINISH_AUCTION);
        _;
    }

    modifier enoughValueToCancelAuction {
        require(msg.value >= 2 * Fees.MIN_FOR_MESSAGE,
                AuctionErr.NOT_ENOUGH_VALUE_TO_CANCEL_AUCTION);
        _;
    }
}
