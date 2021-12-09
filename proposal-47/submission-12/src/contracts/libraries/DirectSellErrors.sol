pragma ton-solidity >=0.43.0;

library DirectSellErr {
    uint8 constant ONLY_ROOT = 101;
    uint8 constant ONLY_OWNER = 102;
    uint8 constant ALREADY_BOUGHT = 103;
    uint8 constant WRONG_NUMBER_IS_GIVEN = 104;
    uint8 constant TOKEN_IS_WITHDRAWN = 105;
    uint8 constant DEAL_EXPIRED = 106;
    uint8 constant NOT_ENOUGH_FEE = 107;
    uint8 constant OWNER_PUBLIC_KEY_IS_EMPTY = 108;
    uint8 constant LOW_MESSAGE_VALUE = 109;
    uint8 constant LOW_CONTRACT_BALANCE = 110;
    uint8 constant OVERFLOW_PERC = 111;
    uint8 constant NOT_TRADABLE_NFT = 112;
}
