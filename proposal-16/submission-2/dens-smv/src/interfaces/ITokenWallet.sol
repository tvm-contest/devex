pragma ton-solidity >= 0.36.0;

struct LendOwnership{
   address owner;
   uint128 lend_balance;
   uint32 lend_finish_time;
}
struct Allowance{
    address spender;
    uint128 remainingTokens;
}

interface ITokenWallet {
    function getBalance_InternalOwner(uint32 _answer_id) external returns(uint128 value0);
    function transfer(address dest, uint128 tokens, bool returnOwnership, address answerAddr) external;
    // function getBalance_InternalOwner(uint32 _answer_id) external; // functionID(0xD);
    // function transfer(address dest, uint128 tokens, uint128 grams) external; // functionID(0xC);
    // function getBalance() external /* functionID(0x14) */ returns (uint128 value0);
    // function getDecimals() external /* functionID(0x13) */ returns (uint8 value0);
    function getDetails() external returns (
        bytes name,
        bytes symbol,
        uint8 decimals,
        uint128 balance,
        uint256 root_public_key,
        uint256 wallet_public_key,
        address root_address,
        address owner_address,
        LendOwnership lend_ownership,
        TvmCell code,
        Allowance allowance,
        int8 workchain_id);
}
