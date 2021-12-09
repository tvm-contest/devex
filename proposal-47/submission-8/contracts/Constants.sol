pragma ton-solidity >= 0.44.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

library Constants {


    uint128 constant TOKEN_DEPLOY_MIN = 0.9 ton;

    uint128 constant MIN_MINT_VALUE = 3 ton; //minimal msg.value for token mint
    uint128 constant CHECK_TOKEN_VALUE = 0.4 ton;//value for check that token exist
    uint128 constant CHECK_TOKEN_FEE = 1 ton;//value that will substruct from sent value if token already exist
    uint128 constant TOKEN_DEPLOY_VALUE = 1 ton;//value for token deply
    uint128 constant REMOVE_QUERY_VALUE = 0.05 ton;//value for token deply
    uint128 constant CHANGE_OWNER_VALUE = 0.2 ton;
    uint128 constant CERT_DEPLOY_VALUE = 0.1 ton;
    uint128 constant CERT_REMOVE_VALUE = 0.1 ton;
    uint8 constant DEPLOY_IMAGE_PER_BLOCK = 10;
    uint128 constant IMAGE_DEPLOY_VALUE = 0.1 ton;
    uint128 constant GAS_PER_LEVEL = 0.2 ton;
}
