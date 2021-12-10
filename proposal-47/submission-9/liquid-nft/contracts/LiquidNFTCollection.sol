pragma ton-solidity >=0.52.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

//================================================================================
//
import "../interfaces/ILiquidNFTCollection.sol";

//================================================================================
// 
contract LiquidNFTCollection is IBase, ILiquidNFTCollection
{
    //========================================
    // Error codes
    uint constant ERROR_MESSAGE_SENDER_IS_NOT_MY_OWNER = 100;
    uint constant ERROR_MESSAGE_OWNER_CAN_NOT_BE_ZERO  = 104;
    uint constant ERROR_MESSAGE_TOO_MANY_CREATORS      = 205;
    uint constant ERROR_MESSAGE_SHARE_NOT_EQUAL_100    = 206;
    uint constant ERROR_VALUE_NOT_ENOUGH_TO_MINT       = 207;

    //========================================
    // Events
    event nftMinted(uint256 id, address nftAddress);

    //========================================
    // Variables
    uint256 static _nonce;                         // Random number to randomize collection address;
    TvmCell static _tokenCode;                     //
    uint256        _tokensIssued;                  //
    address        _ownerAddress;                  //
    address        _creatorAddress;                //
    // Metadata
    string         _metadataContents;              // Collection metadata, for the collection cover and info; structure is the same as token metadata;
    // Token configuration
    bool           _tokenPrimarySaleHappened;      // Default value when minting, usually true for degens;
    bool           _tokenMetadataIsMutable;        // 
    uint256        _tokenMasterEditionMaxSupply;   // Unlimited when 0;
    bool           _tokenMasterEditionPrintLocked; //
    uint16         _tokenCreatorsPercent;          // 1% = 100, 100% = 10000;
    CreatorShare[] _tokenCreatorsShares;           //

    //========================================
    // Modifiers
    modifier onlyOwner {    require(_checkSenderAddress(_ownerAddress), ERROR_MESSAGE_SENDER_IS_NOT_MY_OWNER);    _;    }

    //========================================
    // Getters
    function getInfo(bool includeMetadata, bool includeTokenCode) external view override 
                                                                  returns(uint256        nonce,
                                                                          TvmCell        tokenCode,
                                                                          uint256        tokensIssued,
                                                                          address        ownerAddress,
                                                                          address        creatorAddress,
                                                                          string         metadataContents,
                                                                          bool           tokenPrimarySaleHappened,
                                                                          bool           tokenMetadataIsMutable,
                                                                          uint256        tokenMasterEditionMaxSupply,
                                                                          bool           tokenMasterEditionPrintLocked,
                                                                          uint16         tokenCreatorsPercent,
                                                                          CreatorShare[] tokenCreatorsShares)
    {
        TvmCell empty;
        nonce                         = _nonce;
        tokenCode                     = (includeTokenCode ? _tokenCode : empty);
        tokensIssued                  = _tokensIssued;
        ownerAddress                  = _ownerAddress;
        creatorAddress                = _creatorAddress;
        metadataContents              = (includeMetadata ? _metadataContents : "");
        tokenPrimarySaleHappened      = _tokenPrimarySaleHappened;
        tokenMetadataIsMutable        = _tokenMetadataIsMutable;
        tokenMasterEditionMaxSupply   = _tokenMasterEditionMaxSupply;
        tokenMasterEditionPrintLocked = _tokenMasterEditionPrintLocked;
        tokenCreatorsPercent          = _tokenCreatorsPercent;
        tokenCreatorsShares           = _tokenCreatorsShares;
    }

    function callInfo(bool includeMetadata, bool includeTokenCode) external view override responsible reserve 
                                                                   returns(uint256        nonce,
                                                                           TvmCell        tokenCode,
                                                                           uint256        tokensIssued,
                                                                           address        ownerAddress,
                                                                           address        creatorAddress,
                                                                           string         metadataContents,
                                                                           bool           tokenPrimarySaleHappened,
                                                                           bool           tokenMetadataIsMutable,
                                                                           uint256        tokenMasterEditionMaxSupply,
                                                                           bool           tokenMasterEditionPrintLocked,
                                                                           uint16         tokenCreatorsPercent,
                                                                           CreatorShare[] tokenCreatorsShares)
    {
        TvmCell empty;        
        return {value: 0, flag: 128}(_nonce,
                                     (includeTokenCode ? _tokenCode : empty),
                                     _tokensIssued,
                                     _ownerAddress,
                                     _creatorAddress,
                                     (includeMetadata ? _metadataContents : ""),
                                     _tokenPrimarySaleHappened,
                                     _tokenMetadataIsMutable,
                                     _tokenMasterEditionMaxSupply,
                                     _tokenMasterEditionPrintLocked,
                                     _tokenCreatorsPercent,
                                     _tokenCreatorsShares);
    }

    //========================================
    //
    function calculateFutureNFTAddress(uint256 tokenID, uint256 editionNumber) private inline view returns (address, TvmCell)
    {
        TvmCell stateInit = tvm.buildStateInit({
            contr: LiquidNFT,
            varInit: {
                _collectionAddress: address(this),
                _tokenID:           tokenID,
                _editionNumber:     editionNumber
            },
            code: _tokenCode
        });

        return (address(tvm.hash(stateInit)), stateInit);
    }

    //========================================
    //
    constructor(address        ownerAddress, 
                address        creatorAddress, 
                string         metadataContents, 
                bool           tokenPrimarySaleHappened,
                bool           tokenMetadataIsMutable,
                uint256        tokenMasterEditionMaxSupply,
                bool           tokenMasterEditionPrintLocked,
                uint16         tokenCreatorsPercent,
                CreatorShare[] tokenCreatorsShares) public
    {
        require(ownerAddress != addressZero,      ERROR_MESSAGE_OWNER_CAN_NOT_BE_ZERO);
        require(tokenCreatorsShares.length <= 5,  ERROR_MESSAGE_TOO_MANY_CREATORS    );

        uint8 shareSum = 0;
        for(CreatorShare shareInfo : tokenCreatorsShares)
        {
            shareSum += shareInfo.creatorShare;
        }
        require(shareSum == 100, ERROR_MESSAGE_SHARE_NOT_EQUAL_100);

        _reserve();

        // Collection configuration
        _tokensIssued     = 0;
        _ownerAddress     = ownerAddress;
        _creatorAddress   = creatorAddress;
        _metadataContents = metadataContents;

        // Token configuration
        _tokenPrimarySaleHappened      = tokenPrimarySaleHappened;
        _tokenMetadataIsMutable        = tokenMetadataIsMutable;
        _tokenMasterEditionMaxSupply   = tokenMasterEditionMaxSupply;
        _tokenMasterEditionPrintLocked = tokenMasterEditionPrintLocked;
        _tokenCreatorsPercent          = tokenCreatorsPercent;
        _tokenCreatorsShares           = tokenCreatorsShares;
        
        // Return the change
        creatorAddress.transfer(0, false, 128);
    }

    //========================================
    //
    function createNFT(address ownerAddress,
                       address creatorAddress,
                       string  metadataContents,
                       address metadataAuthorityAddress) external override onlyOwner reserve returns (address tokenAddress)
    {
        require(msg.value >= gasToValue(400000, address(this).wid), ERROR_VALUE_NOT_ENOUGH_TO_MINT); // TODO: adjust value

        (address addr, TvmCell stateInit) = calculateFutureNFTAddress(_tokensIssued, 0); // Collection creates only masters, not prints
        emit nftMinted(_tokensIssued, addr);

        new LiquidNFT{value: 0, flag: 128, stateInit: stateInit}(ownerAddress,
                                                                 creatorAddress,
                                                                 _tokenPrimarySaleHappened,
                                                                 metadataContents,
                                                                 _tokenMetadataIsMutable,
                                                                 metadataAuthorityAddress,
                                                                 _tokenMasterEditionMaxSupply,
                                                                 _tokenMasterEditionPrintLocked,
                                                                 _tokenCreatorsPercent,
                                                                 _tokenCreatorsShares);
        _tokensIssued += 1;
        return addr;
    }
    
    //========================================
    //    
    function changeOwner(address ownerAddress) external override onlyOwner reserve returnChange
    {
        _ownerAddress = ownerAddress;
    }
    
    //========================================
    //    
}

//================================================================================
//
