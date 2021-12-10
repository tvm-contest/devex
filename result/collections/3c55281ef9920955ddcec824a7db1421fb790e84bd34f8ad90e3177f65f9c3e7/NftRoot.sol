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
    uint8 constant NOT_ENOUGH_VALUE_TO_MINT = 107;
    uint8 constant ONLY_COMMISSION_AGENT = 108;

    address _addrCommissionAgent;
    uint128 _mintingCommission;
    uint256 _totalMinted;
    address _addrBasis;
    string _name;
    bytes _icon;


    mapping(string=>uint) _limitByTypes; 
    mapping(string=>uint) _mintedByTypes; 

    constructor(
        TvmCell codeIndex,
        TvmCell codeData,
        address addrCommissionAgent,
        uint128 mintingCommission,
        string[] nftTypes,
        uint[] limit,
        string name,
        bytes icon
    )
        public
    {
        tvm.accept();

        _codeData = codeData;
        _codeIndex = codeIndex;
        _addrCommissionAgent = addrCommissionAgent;
        _mintingCommission = mintingCommission;
        _name = name;
        _icon = icon;

        for(uint i = 0; i < nftTypes.length; i++) {
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

        string nftType, 
		uint heroPower, 
		string arm/*%PARAM_TO_MINT%*/
    )
        public
        enoughValueToDeployData
    {
        require(isEnoughValueToMint(msg.value) || isCommissionAgent(msg.sender), NOT_ENOUGH_VALUE_TO_MINT);
        /*%REQUIRE_TYPE%*/require(_limitByTypes.exists(nftType), NON_EXISTENT_TYPE, "The token type does not exist");
        /*%REQUIRE_TYPE_LIMIT%*/require(_mintedByTypes[nftType] < _limitByTypes[nftType], LIMIT_REACHED, "Limit reached");

        if (isEnoughValueToMint(msg.value)) {
            tvm.rawReserve(address(this).balance - msg.value, 0);
        }

        if (!isCommissionAgent(msg.sender)) {
            _addrCommissionAgent.transfer({value: _mintingCommission, flag: 1});
        }

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
            nftType, 
			heroPower, 
			arm/*%PARAM_TO_DATA%*/
        );

        _mintedByTypes[nftType]++;
        _totalMinted++;

        if (isEnoughValueToMint(msg.value)) {
            msg.sender.transfer({value: 0, flag: 128});
        } else {
            msg.sender.transfer({value: msg.value, flag: 0});
        }      

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

    function changeAdmin(address addrNewAdmin) external onlyCommissionAgent {
        _addrCommissionAgent = addrNewAdmin;
    }


    function getName() public view returns(string name) {
        name = _name;
    }

    function getIcon() public view returns(bytes icon) {
        icon = _icon;
    }

    function isEnoughValueToMint(uint128 value) inline private view returns (bool) {
        return value >= _mintingCommission + Fees.MIN_FOR_DATA_DEPLOY;
    }

    function isCommissionAgent(address addrCommissionAgent) inline private view returns (bool) {
        return addrCommissionAgent == _addrCommissionAgent;
    }


    // MODIFIERS

    modifier onlyCommissionAgent {
        require(isCommissionAgent(msg.sender),
               ONLY_COMMISSION_AGENT);       
        _;
    }

    modifier enoughValueToDeployData {
        require(msg.value >= Fees.MIN_FOR_DATA_DEPLOY + Fees.MIN_FOR_MESSAGE,
               DataErr.NOT_ENOUGH_VALUE_TO_DEPLOY_DATA,
               "Message balance is not enough for Data deployment");       
        _;
    }

}