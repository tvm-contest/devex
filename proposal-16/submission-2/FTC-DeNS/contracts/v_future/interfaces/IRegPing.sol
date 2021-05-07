pragma ton-solidity ^0.38.0;

interface IRegPing {
    function registrationPing(uint128 requestHash) external view responsible returns (uint128, uint32);
}