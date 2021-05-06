pragma ton-solidity ^0.38.0;

library DeNS {

    uint32 constant AuctionableTail  = 28 days;

    uint32 constant BidPeriodPerYear    = 7 days;
    uint32 constant RevealPeriodPerYear = 1 days;

    uint32 constant MaxPeriodYears = 4; // 4 * 7 = 28

    uint32 constant MaxDurationValue = 100;

    uint32 constant ReAuctionGrace = 1 days;

    uint128 constant PlatformInitPrice = 1 ton;

    uint128 constant RegNameMinValue   = 5 ton;
    uint128 constant BidMinValue       = 1 ton;

    uint128 constant SingleFixedPrice  = 10 ton;

    uint128 constant KeepAtRoot        = 10 ton;
    uint128 constant KeepAtCertificate = 1 ton;

}