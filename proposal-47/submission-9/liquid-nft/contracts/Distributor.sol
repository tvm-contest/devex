pragma ton-solidity >=0.52.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

//================================================================================
//
import "../interfaces/IDistributor.sol";

//================================================================================
// 
contract Distributor is IBase, IDistributor
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
    uint constant ERROR_TOKENS_NOT_LOCKED                    = 300;
    uint constant ERROR_TOKENS_LOCKED                        = 301;
    uint constant ERROR_TOKEN_INDEX_OUT_OF_RANGE             = 302;
    uint constant ERROR_NOT_ENOUGH_VALUE_ATTACHED            = 303;
    uint constant ERROR_ALL_TOKENS_MINTED                    = 304;
    uint constant ERROR_WHITELIST_LIMIT_EXCEEDED             = 305;
    uint constant ERROR_SALE_NOT_ACTIVE                      = 306;


    //========================================
    // Variables
    uint256 static _nonce;                // Random number to randomize Distributor address;
    address static _creatorAddress;       //
    address static _ownerAddress;         // Owner aka mintAuthority;
    uint256 static _ownerPubkey;          // Owner aka mintAuthority;
    address static _treasuryAddress;      // Who gets mint money, usually same as `_ownerAddress`;
    TvmCell static _collectionCode;       //
    TvmCell static _tokenCode;            //
    address        _collectionAddress;    //
    uint32         _presaleStartDate;     //
    uint32         _saleStartDate;        //
    uint128        _price;                //
    uint256        _mintedAmount;         //
    string[]       _tokens;
    bool           _tokensLocked;
    mapping(address => uint32) 
                   _whitelist;
    uint256        _whitelistCount;
    uint32         _whitelistBuyLimit;
    
    //========================================
    // Modifiers
    modifier onlyOwner {    require(_checkSenderAddress(_ownerAddress) || _checkSenderPubkey(_ownerPubkey), ERROR_MESSAGE_SENDER_IS_NOT_MY_OWNER);    _;    }

    //========================================
    // Getters
    function getInfo(bool includeTokens, bool includeWhitelist) external view override
                                                                returns(uint256   nonce,
                                                                        address   creatorAddress,
                                                                        address   ownerAddress,
                                                                        uint256   ownerPubkey,
                                                                        address   treasuryAddress,
                                                                        address   collectionAddress,
                                                                        uint32    saleStartDate,
                                                                        uint32    presaleStartDate,
                                                                        uint128   price,
                                                                        uint256   mintedAmount,
                                                                        string[]  tokens,
                                                                        uint256   tokensAmount,
                                                                        bool      tokensLocked,
                                                                        mapping(address => uint32) 
                                                                                  whitelist,
                                                                        uint256   whitelistCount,
                                                                        uint32    whitelistBuyLimit)
    {
        string[]                   emptyS;
        mapping(address => uint32) emptyM;

        nonce             = _nonce;
        creatorAddress    = _creatorAddress;
        ownerAddress      = _ownerAddress;
        ownerPubkey       = _ownerPubkey;
        treasuryAddress   = _treasuryAddress;
        collectionAddress = _collectionAddress;
        saleStartDate     = _saleStartDate;
        presaleStartDate  = _presaleStartDate;
        price             = _price;
        mintedAmount      = _mintedAmount;
        tokens            = (includeTokens ? _tokens : emptyS);
        tokensAmount      = tokens.length;
        tokensLocked      = _tokensLocked;
        whitelist         = (includeWhitelist ? _whitelist : emptyM);
        whitelistCount    = _whitelistCount;
        whitelistBuyLimit = _whitelistBuyLimit;
    }

    //========================================
    //
    function calculateFutureCollectionAddress(uint256 nonce) private inline view returns (address, TvmCell)
    {
        TvmCell stateInit = tvm.buildStateInit({
            contr: LiquidNFTCollection,
            varInit: {
                _nonce:     nonce,
                _tokenCode: _tokenCode
            },
            code: _collectionCode
        });

        return (address(tvm.hash(stateInit)), stateInit);
    }

    //========================================
    //
    constructor(uint32         presaleStartDate,
                uint32         saleStartDate,
                uint128        price,
                string         collectionMetadataContents, 
                bool           tokenPrimarySaleHappened,
                bool           tokenMetadataIsMutable,
                uint256        tokenMasterEditionMaxSupply,
                bool           tokenMasterEditionPrintLocked,
                uint16         tokenCreatorsPercent,
                CreatorShare[] tokenCreatorsShares) public
    {
        tvm.accept();
        require(_checkSenderAddress(_ownerAddress) || _checkSenderPubkey(_ownerPubkey), ERROR_MESSAGE_SENDER_IS_NOT_MY_OWNER);
        _reserve();
        
        require(tokenCreatorsShares.length <= 5, ERROR_MESSAGE_TOO_MANY_CREATORS);

        uint8 shareSum = 0;
        for(CreatorShare shareInfo : tokenCreatorsShares)
        {
            shareSum += shareInfo.creatorShare;
        }
        require(shareSum == 100, ERROR_MESSAGE_SHARE_NOT_EQUAL_100);
        
        _presaleStartDate = presaleStartDate;
        _saleStartDate    = saleStartDate;
        _price            = price;
        _tokensLocked     = false;
        _mintedAmount     = 0;

        (address collectionAddress, TvmCell stateInit) = calculateFutureCollectionAddress(_nonce);
        _collectionAddress = collectionAddress;
        new LiquidNFTCollection{value: 0, flag: 128, stateInit: stateInit}(address(this),
                                                                           _ownerAddress,
                                                                           collectionMetadataContents, 
                                                                           tokenPrimarySaleHappened,
                                                                           tokenMetadataIsMutable,
                                                                           tokenMasterEditionMaxSupply,
                                                                           tokenMasterEditionPrintLocked,
                                                                           tokenCreatorsPercent,
                                                                           tokenCreatorsShares);

    }

    //========================================
    //
    function change(uint32 saleStartDate, uint32 presaleStartDate, uint128 price) external override onlyOwner reserve returnChange
    {
        _price            = price;
        _saleStartDate    = saleStartDate;
        _presaleStartDate = presaleStartDate;
    }

    //========================================
    //
    function _mint(address targetOwnerAddress, bool collectMoney) internal
    {
        if(collectMoney)
        {
            _treasuryAddress.transfer(_price, false, 1);
        }

        ILiquidNFTCollection(_collectionAddress).createNFT{value: 0, flag: 128}(targetOwnerAddress, _creatorAddress, _tokens[_mintedAmount], _ownerAddress);
        _mintedAmount += 1;
    }

    //========================================
    // CHECK DATE and VALUE
    function mint() external override reserve
    {
        require(_tokensLocked,                  ERROR_TOKENS_NOT_LOCKED        );
        require(msg.value >= _price,            ERROR_NOT_ENOUGH_VALUE_ATTACHED);
        require(_mintedAmount < _tokens.length, ERROR_ALL_TOKENS_MINTED        );

        if(_saleStartDate > now)
        {
            if(_presaleStartDate > now)
            {
                revert(ERROR_SALE_NOT_ACTIVE);
            }
            else
            {
                require((_whitelist.exists(msg.sender) && _whitelistBuyLimit == 0) || 
                        (_whitelist.exists(msg.sender) && _whitelistBuyLimit > _whitelist[msg.sender]), ERROR_WHITELIST_LIMIT_EXCEEDED);
                _mint(msg.sender, true);
                _whitelist[msg.sender] += 1;
            }
        }
        else
        {
            _mint(msg.sender, true);
        }
    }
    
    //========================================
    // 
    function mintInternal(address targetOwnerAddress) external override onlyOwner reserve
    {
        require(_tokensLocked,                  ERROR_TOKENS_NOT_LOCKED);
        require(_mintedAmount < _tokens.length, ERROR_ALL_TOKENS_MINTED);

        // No date checks, master can mint whenever
        _mint(targetOwnerAddress, false);
    }
    
    //========================================
    //
    function deleteWhitelist() external override onlyOwner reserve returnChange
    {
        delete _whitelist;
        _whitelistCount = 0;
    }
    
    //========================================
    //
    function deleteFromWhitelist(address[] targetAddresses) external override onlyOwner reserve returnChange
    {
        for(address addr : targetAddresses)
        {
            if(_whitelist.exists(addr))
            {
                delete _whitelist[addr];
                _whitelistCount -= 1;
            }
        }
    }
    
    //========================================
    //
    function addToWhitelist(address[] targetAddresses) external override onlyOwner reserve returnChange
    {
        for(address addr : targetAddresses)
        {
            if(!_whitelist.exists(addr))
            {
                _whitelist[addr] = 0;
                _whitelistCount += 1;
            }
        }
    }
    
    //========================================
    //
    function deleteTokens() external override onlyOwner reserve returnChange
    {
        require(!_tokensLocked, ERROR_TOKENS_LOCKED);
        
        delete _tokens;
    }
    
    //========================================
    //
    function setToken(uint256 index, string metadata) external override onlyOwner reserve returnChange
    {
        require(!_tokensLocked,          ERROR_TOKENS_LOCKED           );        
        require(_tokens.length >= index, ERROR_TOKEN_INDEX_OUT_OF_RANGE);

        _tokens[index] = metadata;
    }
    
    //========================================
    // 
    function addTokens(string[] metadatas) external override onlyOwner reserve returnChange
    {
        require(!_tokensLocked, ERROR_TOKENS_LOCKED);

        for(string metadata : metadatas)
        {
            _tokens.push(metadata);
        }        
    }
    
    //========================================
    //
    function lockTokens() external override onlyOwner reserve returnChange
    {
        _tokensLocked = true;
    }
    
}

//================================================================================
//
