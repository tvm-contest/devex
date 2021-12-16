pragma ton-solidity >= 0.43.0;

library Constants {
    uint128 constant MIN_MESSAGE_VALUE = 0.5 ton;
    uint128 constant MIN_FOR_INDEX_BASIS_DEPLOY = 0.5 ton;
    uint128 constant MIN_FOR_DATA_DEPLOY = 1.5 ton;
    uint128 constant MIN_FOR_INDEX_DEPLOY = 0.5 ton;
    uint128 constant MIN_FOR_DIRECT_SELL_DEPLOY = 1.5 ton;
    uint128 constant MIN_FOR_DEPLOY = 1.5 ton;
    uint128 constant CONTRACT_MIN_BALANCE = 0.5 ton;
    uint128 constant MIN_FOR_MINTING_TOKEN = 2 ton;
}