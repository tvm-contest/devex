pragma ton-solidity >= 0.43.0;

interface IDataCore {
    function transferOwnership(address addrTo) external;

    function lendOwnership(address _addr) external;

    function returnOwnership() external;

    function getOwner() external view returns (address addrOwner);

    function getOwnerResponsible() external view responsible returns (address addrOwner); 

    function getOwnershipProviders() external view returns (
        address addrOwner,
        address addrTrusted,
        address addrRoyaltyAuthor,
        uint8 royaltyPercent
    );

    function getOwnershipProvidersResponsible() external view responsible returns (
        address addrOwner,
        address addrTrusted,
        address addrRoyaltyAuthor,
        uint8 royaltyPercent
    );
}
