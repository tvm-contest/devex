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
	int test;
	int test0;
	int test1;
	int test2;
	int test3;
	int test4;
	int test5;
	int test6;
	int test7;
	int test8;
	int test9;
	/*%PARAM_DEFENITION%*/

    constructor(TvmCell codeIndex, TvmCell codeData, int _test, int _test0, int _test1, int _test2, int _test3, int _test4, int _test5, int _test6, int _test7, int _test8, int _test9/*%PARAM_CONSTRUCTOR%*/) public {
        tvm.accept();
        _codeIndex = codeIndex;
        _codeData = codeData;
		test = _test;
		test0 = _test0;
		test1 = _test1;
		test2 = _test2;
		test3 = _test3;
		test4 = _test4;
		test5 = _test5;
		test6 = _test6;
		test7 = _test7;
		test8 = _test8;
		test9 = _test9;
		/*%PARAM_SET%*/
    }

    function mintNft() public {
        TvmCell codeData = _buildDataCode(address(this));
        TvmCell stateData = _buildDataState(codeData, _totalMinted);
        new Data{stateInit: stateData, value: 1.1 ton}(msg.sender, _codeIndex);

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