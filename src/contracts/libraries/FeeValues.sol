pragma ton-solidity >=0.43.0;

library Fees {
    uint128 constant MIN_FOR_MESSAGE = 0.1 ton;
    uint128 constant MIN_FOR_INDEX_DEPLOY = 0.5 ton;
    uint128 constant MIN_FOR_INDEX_BASIS_DEPLOY = 0.5 ton;
    uint128 constant MIN_FOR_DATA_DEPLOY = 1.5 ton;
    uint128 constant MIN_FOR_SALE_DEPLOY = 1.5 ton;
    uint128 constant MIN_FOR_SALE_CREATE = 1.5 ton;
    uint128 constant MIN_FOR_RETURN_RIGHTS = 0.5 ton;
    uint128 constant MIN_FOR_AUCTION_DEPLOY = 1.5 ton;
    uint128 constant MIN_FOR_TRANSFER_OWNERSHIP = 1.1 ton;   
    uint128 constant CREATOR_MINTING_FEE = 0 ton /*%CREATOR_FEE%*/;
}
