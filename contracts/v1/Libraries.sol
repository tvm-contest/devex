pragma ton-solidity ^0.38.0;

library PlatformTypes {
    uint8 constant Platform = 0;
    uint8 constant Certificate = 1;
    uint8 constant Auction = 2;
    uint8 constant Root = 255;
}

library MsgFlag {
    uint8 constant AddTranFees  = 1;
    uint8 constant IgnoreErrors = 2;
    uint8 constant DestroyZero  = 32;
    uint8 constant MsgBalance   = 64;
    uint8 constant AllBalance   = 128;
    uint8 constant SelfDestruct = 128 + 32;
}

library Errors {
    uint8 constant NOT_PENDING_OWNER = 98;
    uint8 constant NOT_ROOT          = 99;
    uint8 constant NOT_MY_OWNER      = 100;
    uint8 constant NO_OWNER_SET      = 101;
    uint8 constant VALUE_TOO_LOW     = 102;
    uint8 constant INVALID_ADDRESS   = 103;
    uint8 constant AUCTION_NOT_INIT  = 104;
    uint8 constant VALUE_ERROR       = 105;
    uint8 constant INCORRECT_TIME    = 106;
    uint8 constant INCORRECT_HASH    = 107;
    uint8 constant ALREADY_REVEALED  = 108;
    uint8 constant NOT_PARENT        = 109;
    uint8 constant RESERVED_NAME     = 110;
    uint8 constant EXPIRED           = 111;
    // ------------------------------------
    uint8 constant TOO_LOW_DURATION  = 201;
    uint8 constant TOO_HIGH_DURATION = 202;
    uint8 constant FORBIDDEN_CHARS   = 203;
    uint8 constant INVALID_STRLEN    = 204;
}

library RegNameResult {
    uint8 constant StartedAuction = 0;      // Auction was started, returning it's address
    uint8 constant CertificateAddress = 1;  // Name is already registered, returning address
    uint8 constant AuctionAddress = 2;      // There is ongoing auction with this address
}

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