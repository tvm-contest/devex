pragma ton-solidity >=0.43.0;

pragma AbiHeader expire;
pragma AbiHeader time;

import './resolvers/IndexResolver.sol';
import './resolvers/DataResolver.sol';

import './IndexBasis.sol';
import './interfaces/IData.sol';
import './interfaces/IIndexBasis.sol';

import './libraries/NftRootErrors.sol';

contract NftRoot is DataResolver, IndexResolver {

    uint8 constant NON_EXISTENT_TYPE = 105;
    uint8 constant LIMIT_REACHED = 106;

    string static _name;

    address _addrCommissionAgent;
    uint128 _mintingCommission;
    uint256 _totalMinted;
    address _addrBasis;
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
        bytes icon
    )
        public
    {
        tvm.accept();

        _codeData = codeData;
        _codeIndex = codeIndex;
        _addrCommissionAgent = addrCommissionAgent;
        _mintingCommission = mintingCommission;
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

        string nftType/*%PARAM_TO_MINT%*/
    )
        public
    {
        require(isEnoughValueToMint(msg.value) || isCommissionAgent(msg.sender), NftRootErr.NOT_ENOUGH_VALUE_TO_MINT);
        /*%REQUIRE_TYPE%*/require(_limitByTypes.exists(nftType), NON_EXISTENT_TYPE, "The token type does not exist");
        /*%REQUIRE_TYPE_LIMIT%*/require(_mintedByTypes[nftType] < _limitByTypes[nftType], LIMIT_REACHED, "Limit reached");

        if (isEnoughValueToMint(msg.value)) {
            tvm.rawReserve(0, 4);
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
            nftType/*%PARAM_TO_DATA%*/
        );

        _mintedByTypes[nftType]++;
        _totalMinted++;

        if (isEnoughValueToMint(msg.value)) {
            msg.sender.transfer({value: 0, flag: 128});
        } else {
            msg.sender.transfer({value: msg.value, flag: 1});
        }      
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

    function changeCommissionAgent(address addrCommissionAgent) external onlyCommissionAgent {
        _addrCommissionAgent = addrCommissionAgent;
    }

    function getTokenData() public view returns (TvmCell code, uint totalMinted) {
        tvm.accept();
        totalMinted = _totalMinted;
        code = _codeData;
    }

    function getName() external view returns (string name) {
        name = _name;
    }

    function getIcon() external view returns (bytes icon) {
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
               NftRootErr.ONLY_COMMISSION_AGENT);       
        _;
    }
}