pragma ton-solidity >= 0.43.0;

interface IDirectSaleRoot {

    function createSale (address addrNft) external view;

    function returnRights(address addrNft) external view;

    function getSaleAddress(address addrOwner, address addrNft) external view returns (address addrSale);
}
