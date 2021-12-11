pragma ton-solidity >=0.43.0;

library AuctionErr {
    uint16 constant NOT_ENOUGH_VALUE_FOR_AUCTION_DEPLOY = 300;
    uint16 constant ZERO_INITIAL_PRICE = 301;
    uint16 constant NOT_ENOUGH_VALUE_TO_CANCEL_AUCTION = 302;
    uint16 constant NOT_OWNER = 303;
    uint16 constant CANNOT_BE_OWNER = 304;
    uint16 constant NO_RIGHTS_TO_TRADE = 305;
    uint16 constant SENDER_SHOULD_BE_NFT = 306;
    uint16 constant AUCTION_NOT_STARTED = 307;
    uint16 constant AUCTION_STARTED = 308;
    uint16 constant ZERO_DURATION = 309;
    uint16 constant AUCTION_TIME_PASSED = 310;
    uint16 constant AUCTION_TIME_NOT_PASSED = 311;
    uint16 constant BID_LESS_THAN_INITIAL_PRICE = 312;
    uint16 constant BID_LESS_THAN_HIGHEST = 313;
    uint16 constant BIDS_EXIST = 314;
    uint16 constant BIDS_NOT_EXIST = 315;
    uint16 constant NOT_ENOUGH_VALUE_TO_SEND_BID = 316;
    uint16 constant NOT_ENOUGH_VALUE_TO_FINISH_AUCTION = 317;
    uint16 constant NOT_OWNER_NOR_WINNER = 318;
    uint16 constant NOT_ENOUGH_VALUE_FOR_MESSAGE = 319;
    uint16 constant NOT_ENOUGH_VALUE_TO_START_AUCTION = 320;
    uint16 constant NOT_AUCTION_ROOT_OWNER = 321;
    uint16 constant INVALID_ROYALTY = 322;
}
