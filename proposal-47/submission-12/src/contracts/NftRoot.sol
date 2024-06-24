pragma ton-solidity >=0.43.0;

pragma AbiHeader expire;
pragma AbiHeader time;

import './resolvers/IndexResolver.sol';
import './resolvers/DataResolver.sol';
import './IndexBasis.sol';
import './interfaces/IData.sol';
import './interfaces/IIndexBasis.sol';
import "./libraries/Common.sol";
import "./libraries/Constants.sol";

contract NftRoot is DataResolver, IndexResolver {

    //ERRORS
    uint8 constant NOT_OWNER_ERROR = 110;
    uint8 constant RARITY_AMOUNT_MISMATCH = 111;
    uint8 constant NON_EXISTENT_RARITY = 112;
    uint8 constant RARITY_OVERFLOW = 113;
    uint8 constant ONLY_ADMIN = 114;
    uint8 constant MESSAGE_WITHOUT_MONEY = 115;

    uint _totalMinted;
    address _addrBasis;

    mapping (address => bool) m_admins;
    uint128 _mintingFee = 0.2 ton;

    // To limit the tokens amount
    uint _tokensLimit;

    mapping (string => uint) _rarityTypes;
    // To count when tokens are created
    mapping (string => uint) _rarityMintedCounter;

    string _rootIcon;
    string _rootName;

    struct Rarity {
        string rarityName;
        uint amount;
    }

      function getRootInfo() public view returns (string rootName, string rootIcon, TvmCell codeIndex, TvmCell codeData, uint tokensLimit) {
        rootName = _rootName;
        rootIcon = _rootIcon;
        codeIndex = _codeIndex;
        codeData = _codeData;
        tokensLimit = _tokensLimit;
    }

    constructor(
        string rootName,
        string rootIcon,
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

        _rootName = rootName;
        _rootIcon = rootIcon;
        _codeIndex = codeIndex;
        _codeData = codeData;
        _tokensLimit = tokensLimit;
    }

    function mintNft(string rarityName, string url/*PARAM_MINT_FUNCTION*/) public {
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

        //require(msg.value >= Constants.MIN_FOR_MINTING_TOKEN, MESSAGE_WITHOUT_MONEY);

        TvmCell codeData = _buildDataCode(address(this));
        TvmCell stateData = _buildDataState(codeData, _totalMinted);

        uint8 flag = 0; 
        uint128 value = Constants.MIN_FOR_DATA_DEPLOY;
        if (isAdmin(msg.sender)) { 
            flag = 1;
            value -= _mintingFee;
        }

        new Data{
            stateInit: stateData, 
            value: value,
            bounce: true,
            flag: flag
        }(msg.sender, _codeIndex, rarityName, url/*PARAM_MINT*/);
        

        _totalMinted++;
        _rarityMintedCounter[rarityName]++;
    }

    function deployBasis(TvmCell codeIndexBasis) public {
        require(msg.value > Constants.MIN_FOR_INDEX_BASIS_DEPLOY, MESSAGE_WITHOUT_MONEY);
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
             value: Constants.MIN_FOR_INDEX_BASIS_DEPLOY
        }();
    }

    function destructBasis() public view {
        IIndexBasis(_addrBasis).destruct();
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

        return raritySumm <= tokensLimit;
    }

    function isAdmin(address addrAdmin) private view returns (bool) {
        if (m_admins.exists(addrAdmin)) {
            return true;
        } 
    }

    function addAdmin(address newAddrAdmin) public onlyOwner {
        m_admins[newAddrAdmin] = true;
    }

    function removeAdmin(address addrAdmin) public onlyAdmin {
        if (m_admins.exists(addrAdmin)) {
            delete m_admins[addrAdmin];
        }
    }

    function getTokenData() public returns(TvmCell code, uint totalMinted) {
        tvm.accept();
        totalMinted = _totalMinted;
        code = _codeData;
    }

    function getRaritiesList() public returns(string[] raritiesArray) {
        tvm.accept();
        for((string name, uint amount) : _rarityTypes){
            raritiesArray.push(name);
        }
        return raritiesArray;
    }

    function getAddrBasis() public view returns (address addrBasis) {
       addrBasis = _addrBasis;
    }

    function addRarity(string rarityName, uint amount) public onlyOwner {
        require(amount <= _tokensLimit, RARITY_OVERFLOW, "Tokens of this type can no longer be created");
        _rarityTypes[rarityName] = amount;
    } 

    function setMintingFee(uint128 newMintingFee) public onlyOwner{
        _mintingFee = newMintingFee;
    }

    modifier onlyOwner() {
        require(msg.pubkey() == tvm.pubkey(), NOT_OWNER_ERROR, "Only owner can do this operation");
        tvm.accept();
        _;
    }

    modifier onlyAdmin {
        require(isAdmin(msg.sender), ONLY_ADMIN, "Only administrator allowed");
        tvm.accept();
        _;
    }



}