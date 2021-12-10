pragma ton-solidity >= 0.43.0;

import '../libraries/Enums.sol';

import 'IDataCore.sol';

interface IData is IDataCore {

    function getInfo() external view returns (
        address addrRoot,
        address addrOwner,
        address addrAuthor,
        address addrData,
        uint256 id,
        bytes name,
        bytes url,
        uint8 number,
        uint8 amount,
        string nftType/*%PARAM_DATA_INFO%*/
    );

    function getInfoResponsible() external view responsible returns (
        address addrRoot,
        address addrOwner,
        address addrAuthor,
        address addrData,
        uint256 id,
        bytes name,
        bytes url,
        uint8 number,
        uint8 amount
    );
}
