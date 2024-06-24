pragma ton-solidity >= 0.43.0;

interface IDataCore {
    function transferOwnership(address addrTo) external;

    function lendOwnership(address _addr) external;

    function returnOwnership() external;

    function getOwner() external view returns (address addrOwner);

    function getOwnerResponsible() external view responsible returns (address addrOwner); 

    function verifyTradability(address addrPossibleOwner, address addrPossibleTrusted) external view responsible returns (address addrOwner, address addrTrusted);
}
