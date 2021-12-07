pragma ton-solidity >=0.43.0;

pragma AbiHeader expire;
pragma AbiHeader time;

import './resolvers/IndexResolver.sol';
import './resolvers/DataResolver.sol';

import './IndexBasis.sol';

import './interfaces/IData.sol';
import './interfaces/IIndexBasis.sol';
import './libraries/Enums.sol';

contract NftRoot is DataResolver, IndexResolver {

    uint8 constant NON_EXISTENT_TYPE = 105;
    uint8 constant LIMIT_REACHED = 106;

    uint256 _totalMinted;
    address _addrBasis;
    string _name;
    bytes _icon;

    mapping(string=>uint) _limitByTypes; 
    mapping(string=>uint) _mintedByTypes; 

    constructor(
        TvmCell codeIndex,
        TvmCell codeData,
        string[] nftTypes,
        uint[] limit,
        string name,
        bytes icon
        ) public {
        tvm.accept();

        _codeData = codeData;
        _codeIndex = codeIndex;
        _name = name;
        _icon = icon;

        for(uint i = 0; i < nftTypes.length; i++)
        {
            _limitByTypes[nftTypes[i]] = limit[i];
        }
    }
    
    function mintNft(
        bytes name,
        bytes url,
        uint8 editionNumber,
        uint8 editionAmount,
        address[] managersList,
        uint8 royalty,

        string nftType/*%PARAM_TO_MINT%*/
    )
        public
        enoughValueToDeployData
    {
        require(_limitByTypes.exists(nftType), NON_EXISTENT_TYPE, "The token type does not exist");
        require(_mintedByTypes[nftType] < _limitByTypes[nftType], LIMIT_REACHED, "Limit reached");
        tvm.accept();
        TvmCell codeData = _buildDataCode(address(this));
        TvmCell stateData = _buildDataState(codeData, _totalMinted);
        new Data {
            stateInit: stateData,
            value: Fees.MIN_FOR_DATA_DEPLOY
        } (
            msg.sender,
            _codeIndex,
            name,
            url,
            editionNumber,
            editionAmount,
            managersList,
            royalty,
            nftType
            /*%PARAM_TO_DATA%*/
        );

        _mintedByTypes[nftType]++;
        _totalMinted++;
    }
    function getTokenData() public view returns(TvmCell code, uint totalMinted) {
        tvm.accept();
        totalMinted = _totalMinted;
        code = _codeData;
    }

    function deployBasis(TvmCell codeIndexBasis) public {
        require(msg.value > Fees.MIN_FOR_INDEX_BASIS_DEPLOY + Fees.MIN_FOR_MESSAGE, 104);
        uint256 codeHasData = resolveCodeHashData();
        TvmCell state = tvm.buildStateInit({
            contr: IndexBasis,
            varInit: {
                _codeHashData: codeHasData,
                _addrRoot: address(this)
            },
            code: codeIndexBasis
        });
        _addrBasis = new IndexBasis{
            stateInit: state,
            value: Fees.MIN_FOR_INDEX_BASIS_DEPLOY
        }();
    }

    function destructBasis() public view {
        IIndexBasis(_addrBasis).destruct();
    }

    function getName() public view returns(string name) {
        name = _name;
    }

    function getIcon() public view returns(bytes icon) {
        icon = _icon;
    }

    // MODIFIERS

    modifier enoughValueToDeployData {
        require(msg.value >= Fees.MIN_FOR_DATA_DEPLOY + Fees.MIN_FOR_MESSAGE,
               DataErr.NOT_ENOUGH_VALUE_TO_DEPLOY_DATA,
               "Message balance is not enough for Data deployment");       
        _;
    }
}