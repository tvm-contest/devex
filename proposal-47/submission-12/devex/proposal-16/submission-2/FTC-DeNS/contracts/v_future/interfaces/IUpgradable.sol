pragma ton-solidity ^0.38.0;

interface IUpgradable {
    function upgrade(TvmCell code) external;
}