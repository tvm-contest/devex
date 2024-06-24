pragma ton-solidity >= 0.43.0;

interface IData {
    function transferOwnership(address addrTo) external;

    function giveRightsTo(address addrTrusted) external;

    function returnRightsBack() external;

    function getOwner() external view returns (address addrOwner);

    function getInfo() external view returns (
        address addrData,
        address addrRoot,
        address addrOwner,
        address addrTrusted,
        string rarityName,
        string url
    );

    function rightsTransferabilityStatus() external view returns(bool status);

    function getTradabilityInfo() external view responsible returns (address addrNftOwner, address addrTrusted);
}
