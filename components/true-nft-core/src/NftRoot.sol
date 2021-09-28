pragma ton-solidity >=0.43.0;

pragma AbiHeader expire;
pragma AbiHeader time;

import './resolvers/IndexResolver.sol';
import './resolvers/DataResolver.sol';

import './IndexBasis.sol';

import './interfaces/IData.sol';
import './interfaces/IIndexBasis.sol';

contract NftRoot is DataResolver, IndexResolver {

    address static _addrOwner;
    bytes static public _name;
    uint256 public _totalMinted;
    address _addrBasis;

    constructor(TvmCell codeIndex, TvmCell codeData) public {
        tvm.accept();
        _codeIndex = codeIndex;
        _codeData = codeData;
    }

    function mintNft(bytes metadata) public {
        require(msg.sender == _addrOwner, 100);
        tvm.rawReserve(0 ton, 4);
        TvmCell codeData = _buildDataCode(address(this));
        TvmCell stateData = _buildDataState(codeData, _totalMinted,_name);
        new Data{stateInit: stateData, value: 1.3 ton}(msg.sender, _codeIndex,metadata);

        _totalMinted++;
    }

    function deployBasis(TvmCell codeIndexBasis) public {
        tvm.rawReserve(0 ton, 4);
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