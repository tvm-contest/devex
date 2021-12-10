pragma ton-solidity >=0.43.0;

library Fees {
    uint128 constant MIN_FOR_MESSAGE = 0.2 ton;
    uint128 constant MIN_FOR_INDEX_DEPLOY = 0.5 ton;
    uint128 constant MIN_FOR_INDEX_BASIS_DEPLOY = 0.5 ton;
    uint128 constant MIN_FOR_DATA_DEPLOY = 1.5 ton;
    uint128 constant MIN_FOR_SALE_DEPLOY = 1.5 ton;
    uint128 constant MIN_FOR_AUCTION_DEPLOY = 1.5 ton;
}
