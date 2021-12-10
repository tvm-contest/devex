pragma ton-solidity >=0.52.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

//================================================================================
//
import "../interfaces/IBase.sol";
import "../interfaces/ILiquidNFT.sol";

//================================================================================
//
contract LiquidNFT is ILiquidNFT, IBase
{
    //========================================
    // Error codes
    uint constant ERROR_MESSAGE_SENDER_IS_NOT_MY_OWNER       = 100;
    uint constant ERROR_MESSAGE_SENDER_IS_NOT_MY_AUTHORITY   = 101;
    uint constant ERROR_MESSAGE_SENDER_IS_NOT_MY_COLLECTION  = 102;
    uint constant ERROR_MESSAGE_SENDER_IS_NOT_MY_MASTER      = 103;
    uint constant ERROR_MESSAGE_OWNER_CAN_NOT_BE_ZERO        = 104;
    uint constant ERROR_MESSAGE_METADATA_IS_LOCKED           = 200;
    uint constant ERROR_MESSAGE_PRINT_IS_LOCKED              = 201;
    uint constant ERROR_MESSAGE_PRINT_SUPPLY_EXCEEDED        = 202;
    uint constant ERROR_MESSAGE_CAN_NOT_REPRINT              = 203;
    uint constant ERROR_MESSAGE_PRIMARY_SALE_HAPPENED        = 204;
    uint constant ERROR_MESSAGE_TOO_MANY_CREATORS            = 205;
    uint constant ERROR_MESSAGE_SHARE_NOT_EQUAL_100          = 206;

    //========================================
    // Events
    event ownerChanged(address oldOwnerAddress, address newOwnerAddress);
    event metadataUpdated();
    event copyPrinted(uint256 copyID, address copyAddress);

    //========================================
    // Variables
    address static _collectionAddress;        //
    uint256 static _tokenID;                  //
    // Addresses
    address        _ownerAddress;             //
    address        _creatorAddress;           // Creation initiator address (buyer in case of Distributor usage)
    // Metadata
    bool           _primarySaleHappened;      //
    string         _metadataContents;         //
    bool           _metadataIsMutable;        //
    address        _metadataAuthorityAddress; //
    // Edition
    uint256        _masterEditionSupply;      //
    uint256        _masterEditionMaxSupply;   // Unlimited when 0;
    bool           _masterEditionPrintLocked; //
    uint256 static _editionNumber;            // Always 0 for regular NFTs, >0 for printed editions;
    // Money
    uint16         _creatorsPercent;          // 1% = 100, 100% = 10000;
    CreatorShare[] _creatorsShares;           //         

    //========================================
    // Events

    //========================================
    // Modifiers
    function senderIsCollection() internal view inline returns (bool) {    return _checkSenderAddress(_collectionAddress);    }
    function senderIsMaster()     internal view inline returns (bool) {    (address master, ) = calculateFutureNFTAddress(_tokenID, 0);    return _checkSenderAddress(master);    }

    modifier onlyMaster     {    require(senderIsMaster(),                                ERROR_MESSAGE_SENDER_IS_NOT_MY_MASTER);        _;    }
    modifier onlyCollection {    require(_checkSenderAddress(_collectionAddress),         ERROR_MESSAGE_SENDER_IS_NOT_MY_COLLECTION);    _;    }
    modifier onlyOwner      {    require(_checkSenderAddress(_ownerAddress),              ERROR_MESSAGE_SENDER_IS_NOT_MY_OWNER);         _;    }
    modifier onlyCreator    {    require(_checkSenderAddress(_creatorAddress),            ERROR_MESSAGE_SENDER_IS_NOT_MY_COLLECTION);    _;    }
    modifier onlyAuthority  {    require(_checkSenderAddress(_metadataAuthorityAddress),  ERROR_MESSAGE_SENDER_IS_NOT_MY_AUTHORITY);     _;    }

    //========================================
    // Getters
    function getInfo(bool includeMetadata) external view override returns (address        collectionAddress,
                                                                           uint256        tokenID,
                                                                           address        ownerAddress,
                                                                           address        creatorAddress,
                                                                           bool           primarySaleHappened,
                                                                           string         metadataContents,
                                                                           bool           metadataIsMutable,
                                                                           address        metadataAuthorityAddress,
                                                                           uint256        masterEditionSupply,
                                                                           uint256        masterEditionMaxSupply,
                                                                           bool           masterEditionPrintLocked,
                                                                           uint256        editionNumber,
                                                                           uint16         creatorsPercent,
                                                                           CreatorShare[] creatorsShares)
    {
        collectionAddress        = _collectionAddress;
        tokenID                  = _tokenID;
        ownerAddress             = _ownerAddress;
        creatorAddress           = _creatorAddress;
        primarySaleHappened      = _primarySaleHappened;
        metadataContents         = (includeMetadata ? _metadataContents : "");
        metadataIsMutable        = _metadataIsMutable;
        metadataAuthorityAddress = _metadataAuthorityAddress;
        masterEditionSupply      = _masterEditionSupply;
        masterEditionMaxSupply   = _masterEditionMaxSupply;
        masterEditionPrintLocked  = _masterEditionPrintLocked;
        editionNumber            = _editionNumber;
        creatorsPercent          = _creatorsPercent;
        creatorsShares           = _creatorsShares;
    }

    function callInfo(bool includeMetadata) external responsible view override reserve returns (address        collectionAddress,
                                                                                                uint256        tokenID,
                                                                                                address        ownerAddress,
                                                                                                address        creatorAddress,
                                                                                                bool           primarySaleHappened,
                                                                                                string         metadataContents,
                                                                                                bool           metadataIsMutable,
                                                                                                address        metadataAuthorityAddress,
                                                                                                uint256        masterEditionSupply,
                                                                                                uint256        masterEditionMaxSupply,
                                                                                                bool           masterEditionPrintLocked,
                                                                                                uint256        editionNumber,
                                                                                                uint16         creatorsPercent,
                                                                                                CreatorShare[] creatorsShares)
    {
        return {value: 0, flag: 128}(_collectionAddress,
                                     _tokenID,
                                     _ownerAddress,
                                     _creatorAddress,
                                     _primarySaleHappened,
                                     (includeMetadata ? _metadataContents : ""),
                                     _metadataIsMutable,
                                     _metadataAuthorityAddress,
                                     _masterEditionSupply,
                                     _masterEditionMaxSupply,
                                     _masterEditionPrintLocked,
                                     _editionNumber,
                                     _creatorsPercent,
                                     _creatorsShares);
    }

    //========================================
    //
    function calculateFutureNFTAddress(uint256 tokenID, uint256 editionNumber) private inline view returns (address, TvmCell)
    {
        TvmCell stateInit = tvm.buildStateInit({
            contr: LiquidNFT,
            varInit: {
                _collectionAddress: _collectionAddress,
                _tokenID:           tokenID,
                _editionNumber:     editionNumber
            },
            code: tvm.code()
        });

        return (address(tvm.hash(stateInit)), stateInit);
    }

    //========================================
    //
    constructor(address        ownerAddress,
                address        creatorAddress,
                bool           primarySaleHappened,
                string         metadataContents,
                bool           metadataIsMutable,
                address        metadataAuthorityAddress,
                uint256        masterEditionMaxSupply,
                bool           masterEditionPrintLocked,
                uint16         creatorsPercent,
                CreatorShare[] creatorsShares) public reserve
    {
        // Checking who is printing or creating, it should be collection or master copy
        if(_editionNumber == 0)
        {
            require(senderIsCollection(), ERROR_MESSAGE_SENDER_IS_NOT_MY_COLLECTION);

            _masterEditionSupply      = 0;
            _masterEditionMaxSupply   = masterEditionMaxSupply;
            _masterEditionPrintLocked = masterEditionPrintLocked;
        }
        else
        {
            require(senderIsMaster(), ERROR_MESSAGE_SENDER_IS_NOT_MY_MASTER);
        
            // Printed versions can't reprint
            _masterEditionSupply      = 0;
            _masterEditionMaxSupply   = 0;
            _masterEditionPrintLocked = true;
        }

        require(creatorsShares.length <= 5, ERROR_MESSAGE_TOO_MANY_CREATORS);

        uint8 shareSum = 0;
        for(CreatorShare shareInfo : creatorsShares)
        {
            shareSum += shareInfo.creatorShare;
        }
        require(shareSum == 100, ERROR_MESSAGE_SHARE_NOT_EQUAL_100);

        //_reserve();

        _ownerAddress             = ownerAddress;
        _creatorAddress           = creatorAddress;
        _primarySaleHappened      = primarySaleHappened;
        _metadataContents         = metadataContents;
        _metadataIsMutable        = metadataIsMutable;
        _metadataAuthorityAddress = metadataAuthorityAddress;
        _creatorsPercent          = creatorsPercent;
        _creatorsShares           = creatorsShares;

        // Return the change
        _creatorAddress.transfer(0, true, 128);
    }
    
    //========================================
    //    
    function changeOwner(address ownerAddress) external override onlyOwner reserve returnChange
    {
        emit ownerChanged(_ownerAddress, ownerAddress);
        _ownerAddress = ownerAddress;
    }
    
    //========================================
    //    
    function changeOwnerWithPrimarySale(address ownerAddress) external override onlyOwner reserve returnChange
    {
        emit ownerChanged(_ownerAddress, ownerAddress);
        _ownerAddress = ownerAddress;
        _primarySaleHappened = true;
    }

    //========================================
    //    
    function updateMetadata(string metadataContents) external override onlyAuthority reserve returnChange
    {
        require(_metadataIsMutable, ERROR_MESSAGE_METADATA_IS_LOCKED);
        _metadataContents = metadataContents;
        emit metadataUpdated();
    }

    //========================================
    //    
    function lockMetadata() external override onlyAuthority reserve returnChange
    {
        require(_metadataIsMutable, ERROR_MESSAGE_METADATA_IS_LOCKED);
        _metadataIsMutable = false;
    }

    //========================================
    //    
    function printCopy(address targetOwnerAddress) external override onlyOwner reserve
    {
        require(_editionNumber == 0,                            ERROR_MESSAGE_CAN_NOT_REPRINT      );
        require(!_masterEditionPrintLocked,                     ERROR_MESSAGE_PRINT_IS_LOCKED      );
        require(_masterEditionMaxSupply > 0 && 
                _masterEditionMaxSupply > _masterEditionSupply, ERROR_MESSAGE_PRINT_SUPPLY_EXCEEDED);
        
        _masterEditionSupply += 1;
        (address addr, TvmCell stateInit) = calculateFutureNFTAddress(_tokenID, _masterEditionSupply);
        emit copyPrinted(_masterEditionSupply, addr);

        new LiquidNFT{value: 0, flag: 128, stateInit: stateInit}(targetOwnerAddress,
                                                                 _creatorAddress,
                                                                 _primarySaleHappened,
                                                                 _metadataContents,
                                                                 _metadataIsMutable,
                                                                 _metadataAuthorityAddress,
                                                                 0,
                                                                 true,
                                                                 _creatorsPercent,
                                                                 _creatorsShares);
    }

    //========================================
    //
    function lockPrint() external override onlyOwner reserve returnChange
    {
        require(!_masterEditionPrintLocked, ERROR_MESSAGE_PRINT_IS_LOCKED);
        _masterEditionPrintLocked = true;
    }
}

//================================================================================
//
