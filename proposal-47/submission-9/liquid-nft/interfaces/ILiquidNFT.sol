pragma ton-solidity >=0.52.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

//================================================================================
//
// Metadata JSON format:
// name                - Human readable name of the asset.
// symbol              - Human readable symbol of the asset (if any).
// description         - Human readable description of the asset.
// image               - URL to the image of the asset. PNG, GIF and JPG file formats are supported. 
//                       You may use the ?ext={file_extension} query to provide information on the file type.
// animation_url       - URL to a multi-media attachment of the asset. The supported file formats are MP4 and MOV for video, 
//                       MP3, FLAC and WAV for audio, GLB for AR/3D assets, and HTML for HTML pages. 
//                       You may use the ?ext={file_extension} query to provide information on the file type.
// external_url        - URL to an external application or website where users can also view the asset.
// properties.category - Categories that should be supported by marketplaces:
//     "image"         - PNG, GIF, JPG;
//     "video"         - MP4, MOV;
//     "audio"         - MP3, FLAC, WAV;
//     "vr"            - 3D models; GLB, GLTF;
//     "html"          - HTML pages; scripts and relative paths within the HTML page are also supported;
// properties.files    - Object array, where an object should contain the uri and type of the file that is part of the asset. 
//                       The type should match the file extension. The array will also include files specified in image and animation_url fields, 
//                       and any other that are associated with the asset. You may use the ?ext={file_extension} query to provide information on the file type.
// attributes          - Object array, where an object should contain trait_type and value fields. value can be a string or a number.
//
// EXAMPLE:
//{
//    "name": "Everscale NFT",
//    "symbol": "",
//    "description": "Never gonna give you up!",
//    "image": "https://gateway.pinata.cloud/ipfs/QmYoiSjZUotKiYhMfzUSRWYTZUDq6MCCkXAbDPdC2TbdpU?ext=png",
//    "animation_url": "https://gateway.pinata.cloud/ipfs/QmRsAMWEmpRHT1K1dj2q4L6ccAHpgrvzHiuCVwSWxmvV7S?ext=mp4",
//    "external_url": "https://freeton.org",
//    "attributes": [
//        {
//            "trait_type": "Background",
//            "value": "Green"
//        },
//        {
//            "trait_type": "Foot",
//            "value": "Right"
//        },
//        {
//            "trait_type": "Rick",
//            "value": "Roll"
//        }
//    ],
//    "collection": {
//        "name": "Everscale NFT",
//        "family": "Everscale NFTs from SA"
//    },
//    "properties": {
//        "files": [
//            {
//                "uri": "https://gateway.pinata.cloud/ipfs/QmYoiSjZUotKiYhMfzUSRWYTZUDq6MCCkXAbDPdC2TbdpU",
//                "type": "image/png"
//            }
//        ],
//        "category": "image"
//    }
//}

//================================================================================
// Structure representing NFT creator share, in a perfect world creators get their
// part of every sale and this one defines the amount each creator gets.
//
struct CreatorShare
{
    address creatorAddress; // 
    uint8   creatorShare;   // 1 = 1% share
}

//================================================================================
//
interface ILiquidNFT
{
    //========================================
    /// @notice Returns NFT information;
    ///
    /// @param includeMetadata - If metadata should be included;
    ///
    /// Return values:
    ///     collectionAddress        - Token collection address;
    ///     tokenID                  - Token ID;
    ///     ownerAddress             - NFT owner;
    ///     creatorAddress           - NFT creator;
    ///     primarySaleHappened      - If 100% of the first sale should be distributed between the creators list;
    ///     metadataContents         - Token metadata in JSON format;
    ///     metadataIsMutable        - Boolean if metadata is mutable and can be changed;
    ///     metadataAuthorityAddress - Address of an authority who can update metadata (if it is mutable);
    ///     masterEditionSupply      - Current amount of copies if the token can be printed;
    ///     masterEditionMaxSupply   - Maximum amount of copies if the token can be printed;
    ///     masterEditionPrintLocked - If print is available or locked;
    ///     editionNumber            - Master edition (original token) always has `editionNumber` = 0, printed versions have 1+;
    ///     creatorsPercent          - Defines how many percent creators get when NFT is sold on a secondary market;
    ///     creatorsShares           - Defines a list of creators with their shares;
    //
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

    //========================================
    /// @notice Changes NFT owner;
    ///
    /// @param ownerAddress - New owner address;
    //
    function changeOwner(address ownerAddress) external;
    
    //========================================
    /// @notice Changes NFT owner and flips `primarySaleHappened` flag to `true`;
    ///
    /// @param ownerAddress - New owner address;
    //
    function changeOwnerWithPrimarySale(address ownerAddress) external;
    
    //========================================
    /// @notice Changes NFT metadata if `metadataIsMutable` is `true`;
    ///
    /// @param metadataContents - New metadata in JSON format;
    //
    function updateMetadata(string metadataContents) external;
    
    //========================================
    /// @notice Locks NFT metadata;
    //
    function lockMetadata() external;
    
    //========================================
    /// @notice Prints a copy of the NFT;
    ///         Sometimes when you need multiple copies of the same NFT you can.. well..
    ///         create multiple copies of the same NFT (like coins or medals etc.) 
    ///         and they will technically different NFTs but at the same time logically 
    ///         they will be the same. Printing allows you to have multiple copies of the 
    ///         same NFT (with the same `tokenID`) distributed to any number of people. Every
    ///         one of them will be able to sell or transfer their own copy.
    //
    function printCopy(address targetOwnerAddress) external;
    
    //========================================
    /// @notice Locks NFT printing;
    //
    function lockPrint() external;
}

//================================================================================
//
