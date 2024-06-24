pragma ton-solidity >=0.43.0;

library SaleErr {
    uint16 constant NOT_ENOUGH_VALUE_TO_DEPLOY_DATA = 500;
    uint16 constant NOT_SALE_OWNER = 501;
    uint16 constant CANNOT_BE_SALE_OWNER = 502;
    uint16 constant SENDER_SHOULD_BE_NFT = 503;
    uint16 constant SALE_OWNER_IS_NOT_NFT_OWNER = 504;
    uint16 constant SALE_IS_NOT_TRUSTED = 505;
    uint16 constant INVALID_DURATION = 506;
    uint16 constant UNLIMITED_DURATION = 507;
    uint16 constant SALE_NOT_STARTED = 508;
    uint16 constant SALE_STARTED = 509;
    uint16 constant SALE_TIME_PASSED = 510;
    uint16 constant NOT_ENOUGH_VALUE_FOR_MESSAGE = 511;
    uint16 constant NOT_ENOUGH_VALUE_TO_BUY_NFT = 512;
    uint16 constant NOT_ENOUGH_VALUE_TO_RETURN_RIGHTS = 512;
    uint16 constant NOT_ENOUGH_VALUE_TO_CREATE_SALE = 512;
    uint16 constant ZERO_DURATION = 513;
    uint16 constant NO_RIGHTS_TO_TRADE = 514;
    uint16 constant NOT_ENOUGH_VALUE_TO_START_SALE = 515;
    uint16 constant ZERO_PRICE = 516;
    uint16 constant NOT_SALE_ROOT_OWNER = 517;
    uint16 constant INVALID_ROYALTY = 518;
}