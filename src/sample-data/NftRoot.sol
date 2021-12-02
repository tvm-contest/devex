pragma ton-solidity >=0.43.0;

pragma AbiHeader expire;
pragma AbiHeader time;

import './resolvers/IndexResolver.sol';
import './resolvers/DataResolver.sol';

import './IndexBasis.sol';

import './interfaces/IData.sol';
import './interfaces/IIndexBasis.sol';

contract NftRoot is DataResolver, IndexResolver {

    uint256 _totalMinted;
    address _addrBasis;
	undefined undefined0;
	undefined undefined1;
	undefined undefined2;
	undefined undefined3;
	undefined undefined4;
	undefined undefined5;
	undefined undefined6;
	undefined undefined7;
	undefined undefined8;
	undefined undefined9;
	/*%PARAM_DEFENITION%*/

    constructor(TvmCell codeIndex, TvmCell codeData, undefined _undefined0, undefined _undefined1, undefined _undefined2, undefined _undefined3, undefined _undefined4, undefined _undefined5, undefined _undefined6, undefined _undefined7, undefined _undefined8, undefined _undefined9/*%PARAM_CONSTRUCTOR%*/) public {
        tvm.accept();
        _codeIndex = codeIndex;
        _codeData = codeData;
		undefined0 = _undefined0;
		undefined1 = _undefined1;
		undefined2 = _undefined2;
		undefined3 = _undefined3;
		undefined4 = _undefined4;
		undefined5 = _undefined5;
		undefined6 = _undefined6;
		undefined7 = _undefined7;
		undefined8 = _undefined8;
		undefined9 = _undefined9;
		/*%PARAM_SET%*/
    }

    function mintNft() public {
        TvmCell codeData = _buildDataCode(address(this));
        TvmCell stateData = _buildDataState(codeData, _totalMinted);
        new Data{stateInit: stateData, value: 1.1 ton}(msg.sender, _codeIndex, undefined0, undefined1, undefined2, undefined3, undefined4, undefined5, undefined6, undefined7, undefined8, undefined9/*%PARAM_TO_DATA%*/);

        _totalMinted++;
    }

    function deployBasis(TvmCell codeIndexBasis) public {
        require(msg.value > 0.5 ton, 104);
        uint256 codeHasData = resolveCodeHashData();
        TvmCell state = tvm.buildStateInit({
            contr: IndexBasis,
            varInit: {
                _codeHashData: codeHasData,
                _addrRoot: address(this)
            },
            code: codeIndexBasis
        });
        _addrBasis = new IndexBasis{stateInit: state, value: 0.4 ton}();
    }

    function destructBasis() public view {
        IIndexBasis(_addrBasis).destruct();
    }
}