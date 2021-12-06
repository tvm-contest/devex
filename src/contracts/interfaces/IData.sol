pragma ton-solidity >= 0.43.0;

import 'IDataCore.sol';

interface IData is IDataCore {
    enum ColorEnum{white, red, blue, green, lastEnum}

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

        //ColorEnum color,
        string additionalStrParameter,
        uint256 additionalIntParameter,
        bool additionalBoolParameter
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
        uint8 amount,

        //ColorEnum color,
        string additionalStrParameter,
        uint256 additionalIntParameter,
        bool additionalBoolParameter
    );
}
