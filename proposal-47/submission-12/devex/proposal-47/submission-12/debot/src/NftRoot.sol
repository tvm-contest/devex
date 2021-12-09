pragma ton-solidity >=0.43.0;

pragma AbiHeader expire;
pragma AbiHeader time;

import './resolvers/IndexResolver.sol';
import './resolvers/DataResolver.sol';
import './IndexBasis.sol';
import './interfaces/IData.sol';
import './interfaces/IIndexBasis.sol';
import "./libraries/Common.sol";

contract NftRoot is DataResolver, IndexResolver {

    //ERRORS
    uint8 constant NOT_OWNER_ERROR = 110;
    uint8 constant RARITY_AMOUNT_MISMATCH = 111;
    uint8 constant NON_EXISTENT_RARITY = 112;
    uint8 constant RARITY_OVERFLOW = 113;
    
    uint _totalMinted;
    address _addrBasis;

    // Variable to deploy the IndexBasis 
    TvmCell _codeIndexBasis;

    // To limit the tokens amount
    uint _tokensLimit;
    mapping (bytes => uint) _rarityTypes;
    // To count when tokens are created
    mapping (bytes => uint) _rarityMintedCounter;

    bytes _rootIcon;
    string _rootName;

    modifier onlyOwner() {
        require(msg.pubkey() == tvm.pubkey(), NOT_OWNER_ERROR, "Only owner can do this operation");
        tvm.accept();
        _;
    }

    function setName(string rootName) public onlyOwner{
        _rootName = rootName;
    }

    function setIcon(bytes icon) public onlyOwner{
        _rootIcon = icon;
    }

    constructor(
        string rootName,
        bytes rootIcon,
        TvmCell codeIndex, 
        TvmCell codeData,
        uint tokensLimit,
        Rarity[] raritiesList
    ) public {
        require(
            checkRaritiesCorrectness(raritiesList, tokensLimit), 
            RARITY_AMOUNT_MISMATCH,
            "The number of tokens does not correspond to the total number of their types"
        );
        tvm.accept();

        createRarityTypes(raritiesList);
        setName(rootName);
        setIcon(rootIcon);

        _codeIndex = codeIndex;
        _codeData = codeData;
        _tokensLimit = tokensLimit;

    }

    function createRarityTypes(Rarity[] listOfRarities) private{
        for (uint256 i = 0; i < listOfRarities.length; i++) {
            _rarityTypes[listOfRarities[i].rarityName] = listOfRarities[i].amount;
        }
    }

    function checkRaritiesCorrectness(Rarity[] listOfRarities, uint tokensLimit) private pure returns (bool) {
        // Checks if the sum of the entered rarity is equal to the total number of tokens
        uint raritySumm = 0;
        for (uint256 i = 0; i < listOfRarities.length; i++) {
            raritySumm += listOfRarities[i].amount;
        }

        return raritySumm == tokensLimit;
    }

    function mintNft(string rarityName) public {
        require(
            _rarityTypes.exists(rarityName), 
            NON_EXISTENT_RARITY, 
            "Such tokens there isn't in this collection"
        );
        require(
            _rarityMintedCounter[rarityName] < _rarityTypes[rarityName],
            RARITY_OVERFLOW,
            "Tokens of this type can no longer be created"
        );

        TvmCell codeData = _buildDataCode(address(this));
        TvmCell stateData = _buildDataState(codeData, _totalMinted);

        new Data{
            stateInit: stateData, 
            value: 1.1 ton, 
            bounce: false
        }(msg.sender, _codeIndex, rarityName);

        _totalMinted++;
        _rarityMintedCounter[rarityName]++;
    }

    function getTokenData() public returns(TvmCell code, uint totalMinted) {
        tvm.accept();
        _totalMinted = totalMinted;
        _codeData = code;
    }


    function deployBasis(TvmCell codeIndexBasis) public onlyOwner {
        uint256 codeHashData = resolveCodeHashData();
        TvmCell state = tvm.buildStateInit({
            contr: IndexBasis,
            varInit: {
                _codeHashData: codeHashData,
                _addrRoot: address(this)
            },
            code: codeIndexBasis
        });
        
        _addrBasis = new IndexBasis{
            stateInit: state,
             value: 0.4 ton
        }();
    }

    function destructBasis() public view {
        IIndexBasis(_addrBasis).destruct();
    }

}
