---
tip: 7
title: TRC-7 NFT Standard
author: Anton Platonov <anton@platonov.us>
type: Standards Track
category: TRC
status: Pending
created: 2021-07-16
---

# Simple Summary

A standard interface for non-fungible tokens.

Standard covers a `Token`, single contract with internal or external media and a `Collection`, a `Token` creator (but not owner) and a logical pattern/specification to group `Tokens`.

Standart also includes a way to create generative art distibutor aka `Distributor`.

NOTE: `Collection` is not a wallet, `Collection` aims only to group similar kinds of `Tokens`. Think of it as artist's collection.

# Abstract

The following standard allows for the implementation of a standard API for non-fungible tokens within smart contracts.
This standard provides basic functionality to transfer and manage tokens.

# Motivation

A standard interface allows any tokens on Free TON blockchain to be re-used by other applications: from wallets to decentralized exchanges.
Comparing to TIP-3 NFT TRC-7:
 * Respects asynchronous nature of Free TON blockchain (includes callbacks and callback getters);
 * Covers only one type of Token instead of 4;
 * Follows `one Token = one Contract` paradigm;
 * Can have only internal owners (addresses);
 * Doesn't require the owner to worry about Token balances (with one exception);

# Specification

# Token
## Methods

### getInfo
### callInfo

Returns `Token` information.

`includeMetadata` - If metadata should be included.

Return values:

`collectionAddress` - Token collection address;

`tokenID` - Token ID;

`ownerAddress` - NFT owner;

`creatorAddress` - NFT creator;

`primarySaleHappened` - If 100% of the first sale should be distributed between the creators list;

`metadataContents` - Token metadata in JSON format;

`metadataIsMutable` - Boolean if metadata is mutable and can be changed;

`metadataAuthorityAddress` - Address of an authority who can update metadata (if it is mutable);

`masterEditionSupply` - Current amount of copies if the token can be printed;

`masterEditionMaxSupply` - Maximum amount of copies if the token can be printed;

`masterEditionPrintLocked` - If print is available or locked;

`editionNumber` - Master edition (original token) always has `editionNumber` = 0, printed versions have 1+;

`creatorsPercent` - Defines how many percent creators get when NFT is sold on a secondary market;

`creatorsShares` - Defines a list of creators with their shares;

``` js
struct CreatorShare
{
    address creatorAddress; // 
    uint8   creatorShare;   // 1 = 1% share
}

function getInfo(bool includeMetadata) external view returns (address        collectionAddress,
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
                                                              CreatorShare[] creatorsShares);

function callInfo(bool includeMetadata) external responsible view returns (address        collectionAddress,
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
                                                                           CreatorShare[] creatorsShares);
```

### changeOwner

Changes NFT owner.

`ownerAddress` - New owner address.

``` js
function changeOwner(address ownerAddress) external;
```

### changeOwnerWithPrimarySale

Changes NFT owner and flips `primarySaleHappened` flag to `true`.

`ownerAddress` - New owner address.

``` js
function changeOwnerWithPrimarySale(address ownerAddress) external;
```

### updateMetadata

Changes NFT metadata if `metadataIsMutable` is `true`.

`metadataContents` - New metadata in JSON format.

``` js
function updateMetadata(string metadataContents) external;
```

### lockMetadata

Locks NFT metadata.

``` js
function lockMetadata() external;
```

### printCopy

Prints a copy of the NFT.
Sometimes when you need multiple copies of the same NFT you can.. well..
create multiple copies of the same NFT (like coins or medals etc.) 
and they will technically different NFTs but at the same time logically 
they will be the same. Printing allows you to have multiple copies of the 
same NFT (with the same `tokenID`) distributed to any number of people. Every
one of them will be able to sell or transfer their own copy.

``` js
function printCopy(address targetOwnerAddress) external;
```

### lockPrint

Locks NFT printing.

``` js
function lockPrint() external;
```

## Events

### ownerChanged

Emitted when NFT owner is changed.

`oldOwnerAddress` - Old owner address;

`newOwnerAddress` - New owner address;

``` js
event ownerChanged(address oldOwnerAddress, address newOwnerAddress);
```

### metadataUpdated

Emitted when NFT metadata is changed.

``` js
event metadataUpdated();
```

### copyPrinted

Emitted when NFT copy is printed.

`copyID` - ID of the copy;

`copyAddress` - Address of the copy;

``` js
event copyPrinted(uint256 copyID, address copyAddress);
```

# Collection
## Methods

### getInfo
### callInfo

Returns collection information

`includeMetadata` - If metadata should be included;

`includeTokenCode` - If token code should be included;

Return values:

`nonce` - Random nonce to have random collection address;

`tokenCode` - TvmCell of the token code;

`tokensIssued` - Number of tokens this collection created;

`ownerAddress` - Owner address;

`creatorAddress` - Creator address;

`metadataContents` - Collection metadata; it has the same format as NFT metadata but keeps collection cover and information;

`tokenPrimarySaleHappened` - Default value for `tokenPrimarySaleHappened` param when minting NFT (see `ILiquidNFT.sol` for details);

`tokenMetadataIsMutable` - Default value for `tokenMetadataIsMutable` param when minting NFT (see `ILiquidNFT.sol` for details);

`tokenMasterEditionMaxSupply` - Default value for `tokenMasterEditionMaxSupply` param when minting NFT (see `ILiquidNFT.sol` for details);

`tokenMasterEditionPrintLocked` - Default value for `tokenMasterEditionPrintLocked` param when minting NFT (see `ILiquidNFT.sol` for details);

`tokenCreatorsPercent` - Default value for `tokenCreatorsPercent` param when minting NFT (see `ILiquidNFT.sol` for details);

`tokenCreatorsShares` - Default value for `tokenCreatorsShares` param when minting NFT (see `ILiquidNFT.sol` for details);

``` js
struct CreatorShare
{
    address creatorAddress; // 
    uint8   creatorShare;   // 1 = 1% share
}

function getInfo(bool includeMetadata, bool includeTokenCode) external view 
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
                                                                        CreatorShare[] tokenCreatorsShares);

function callInfo(bool includeMetadata, bool includeTokenCode) external view responsible 
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
                                                                        CreatorShare[] tokenCreatorsShares);
```

### changeOwner

Changes Collection owner.

`ownerAddress` - New owner address.

``` js
function changeOwner(address ownerAddress) external;
```

### createNFT

Creates new NFT.

`ownerAddress` - New owner address;

`creatorAddress` - Creator address;

`metadataContents` - Metadata in JSON format (see `ILiquidNFT.sol`);

`metadataAuthorityAddress` - Metadata authority that can update metadata if needed;

``` js
function createNFT(address ownerAddress,
                    address creatorAddress,
                    string  metadataContents,
                    address metadataAuthorityAddress) external returns (address tokenAddress);
```


## Events

### nftMinted

Minted new NFT.

`id` - ID of the new NFT;

`nftAddress` - address of a new NFT;

``` js
event nftMinted(uint256 id, address nftAddress);
```

# Distributor 
## Methods

### getInfo

Gets Distributor information.

`includeTokens` - If token metadata list should be included;

`includeWhitelist` - If token whitelist should be included;

``` js
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
```

### change

Changes Distributor parameters.

`saleStartDate` - Sale start date;

`presaleStartDate` - Presale start date;

`price` - New price in nanoevers;

``` js
function change(uint32 saleStartDate, uint32 presaleStartDate, uint128 price) external;
```

### mint

External function to mint an NFT for the given price (presale/sale start dates are respected).

``` js
function mint() external;
```

### mintInternal

Internal function (owner only) to mint an NFT.

`targetOwnerAddress` - Desired owner of the minted NFT;

``` js
function mintInternal(address targetOwnerAddress) external;
```

### deleteWhitelist

Completely deletes current whitelist.

``` js
function deleteWhitelist() external;
```

### deleteFromWhitelist

Deletes specified entries from whitelist.

`targetAddresses` - List of addresses to delete;

``` js
function deleteFromWhitelist(address[] targetAddresses) external;
```

### addToWhitelist

Adds specified entries to whitelist.

`targetAddresses` - List of addresses to add;

``` js
function addToWhitelist(address[] targetAddresses) external;
```

### deleteTokens

Completely deletes current tokens metadata list.

``` js
function deleteTokens() external;
```

### setToken

Sets specified token metadata (token should already be added to the list).

`index` - Token index to change;

`metadata` - New token metadata;

``` js
function setToken(uint256 index, string metadata) external;
```

### addTokens

Adds specified entries to token metadata list.

`metadatas` - List of metadatas to add;

``` js
function addTokens(string[] metadatas) external;
```

### lockTokens

Locks token list, it won't be able to be changed anymore. 
Mint is available only after locking.

``` js
function lockTokens() external;
```

## Implementation

Interfaces are in `interfaces` folder.

`Liquid contracts` `Collection`, `Token` and `Distributor` implementations are in `contracts` folder.

## History

TODO

## Copyright
Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).