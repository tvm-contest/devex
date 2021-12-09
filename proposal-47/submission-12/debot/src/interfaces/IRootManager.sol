pragma ton-solidity >= 0.43.0;

import "../libraries/Common.sol";

interface IRootManager {

    function deployRoot(
        string rootName,
        bytes rootIcon,
        TvmCell codeIndex, 
        TvmCell codeData,
        uint tokensLimit,
        Rarity[] raritiesList
    ) external;
    
}