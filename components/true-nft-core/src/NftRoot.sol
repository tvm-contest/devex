pragma ton-solidity >=0.43.0;

pragma AbiHeader expire;
pragma AbiHeader time;

import './resolvers/IndexResolver.sol';
import './resolvers/DataResolver.sol';

import './IndexBasis.sol';

import './interfaces/IData.sol';
import './interfaces/IIndexBasis.sol';

library ArrayHelper {
    // Delete value from the `array` at `index` position
    function del(bytes[] array, uint index) internal pure {
        for (uint i = index; i + 1 < array.length; ++i){
            array[i] = array[i + 1];
        }
        array.pop();
    }
}


contract NftRoot is DataResolver, IndexResolver {

    address static _addrOwner;
    bytes static public _name;
    uint256 public _totalMinted;
    address _addrBasis;
    using ArrayHelper for bytes[];
    bytes[] public preGenerateMetadata;
    uint128 public price;
    uint128 public koef; 
    bool public start = false;

    constructor(TvmCell codeIndex, TvmCell codeData, uint128 pay,uint128 koef) public {
        tvm.accept();
        _codeIndex = codeIndex;
        _codeData = codeData;
        price = pay;
        koef = koef;
    }


    function getMetadata() private returns (bytes metadata) {
        rnd.shuffle();
        uint n = rnd.next(preGenerateMetadata.length);
        metadata = preGenerateMetadata[n];
        preGenerateMetadata.del(n);
    }

    function addMetadata(bytes metadata) public {
        require(msg.sender == _addrOwner, 100);
        preGenerateMetadata.push(metadata);
    }
    function startSelling() public {
        require(msg.sender == _addrOwner, 100);
        start = true;
    }

    function mintNft() public {
        require(preGenerateMetadata.length != 0, 101,"tokens is over");
        require(msg.value >= price,102,"not enough money");
        require(start,103,"not all tokens was upload or owner forget to start");
        
        if (msg.sender == _addrOwner) {
            tvm.accept();
        }
        else {tvm.rawReserve(0 ton, 4);}
        
        TvmCell codeData = _buildDataCode(address(this));
        TvmCell stateData = _buildDataState(codeData, _totalMinted,_name);
        price = math.divr(price * koef,100);
        new Data{stateInit: stateData, value: 1.3 ton}(msg.sender, _codeIndex,getMetadata());

        _totalMinted++;
    }

    function deployBasis(TvmCell codeIndexBasis) public {
        if (msg.sender == _addrOwner) {
            tvm.accept();
        }
        else {tvm.rawReserve(0 ton, 4);}
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