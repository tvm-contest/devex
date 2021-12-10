pragma ton-solidity >=0.52.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

//================================================================================
//
import "../contracts/LiquidNFTCollection.sol";

//================================================================================
//
interface IDistributor
{
    //========================================
    /// @notice Getter;
    ///
    /// @param includeTokens    - If token metadata list should be included;
    /// @param includeWhitelist - If token whitelist     should be included;
    // 
    function getInfo(bool includeTokens, bool includeWhitelist) external view 
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
                                                                        uint32    whitelistBuyLimit);
    
    //========================================
    /// @notice Changes Distributor parameters;
    ///
    /// @param saleStartDate    - Sale start date;
    /// @param presaleStartDate - Presale start date;
    /// @param price            - New price in nanoevers;
    //
    function change(uint32 saleStartDate, uint32 presaleStartDate, uint128 price) external;
    
    //========================================
    /// @notice External function to mint an NFT for the given price (presale/sale start dates are respected);
    //
    function mint() external;
    
    //========================================
    /// @notice Internal function (owner only) to mint an NFT;
    ///
    /// @param targetOwnerAddress - Desired owner of the minted NFT;
    //
    function mintInternal(address targetOwnerAddress) external;
    
    //========================================
    /// @notice Completely deletes current whitelist;
    //
    function deleteWhitelist() external;
    
    //========================================
    /// @notice Deletes specified entries from whitelist;
    ///
    /// @param targetAddresses - List of addresses to delete;
    //
    function deleteFromWhitelist(address[] targetAddresses) external;
    
    //========================================
    /// @notice Adds specified entries to whitelist;
    ///
    /// @param targetAddresses - List of addresses to add;
    //
    function addToWhitelist(address[] targetAddresses) external;
    
    //========================================
    /// @notice Completely deletes current tokens metadata list;
    //
    function deleteTokens() external;
    
    //========================================
    /// @notice Sets specified token metadata (token should already be added to the list);
    ///
    /// @param index    - Token index to change;
    /// @param metadata - New token metadata;
    //
    function setToken(uint256 index, string metadata) external;
    
    //========================================
    /// @notice Adds specified entries to token metadata list;
    ///
    /// @param metadatas - List of metadatas to add;
    //
    function addTokens(string[] metadatas) external;
    
    //========================================
    /// @notice Locks token list, it won't be able to be changed anymore. 
    ///         Mint is available only after locking;
    //
    function lockTokens() external;
}

//================================================================================
//
