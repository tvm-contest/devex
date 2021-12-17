pragma ton-solidity >= 0.44.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

interface INFTCollection {

    function removeQuery() external internalMsg;
    function undoMint(address owner, uint8[] imgIds) external internalMsg;
    function doMint(address owner, uint8[] imgIds, uint128 price) external internalMsg;
    //function getCertCode() external returns(TvmCell certCode, TvmCell imageCode);
    //function mint(uint8[] imgIds) external;
    function getInfo() external returns (
        address owner,
        uint32 supply,
        uint32 minted,
        uint8 levelCount,
        uint32 firstLvlImgCount,
        bool complete
    );

    function getCodes() external returns(TvmCell certCode, TvmCell imageCode) ;
    function mint(uint8[] imgIds) external;
    function getTokenAddress(uint8[] imgIds) external returns (address addr);
}
