pragma ton-solidity ^0.38.0;

library ER {
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