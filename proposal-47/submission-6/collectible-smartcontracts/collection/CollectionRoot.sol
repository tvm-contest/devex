pragma ton-solidity >=0.47.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

import "NotificationAddress.sol";
import "CollectionToken.sol";
import "Collection.sol";

contract CollectionRoot  {

    uint128 constant MINT_COST_MIN = 0.5 ton;

    event SRC_CT_nifi_col1_1(uint64 id);

    address _manager;
    uint128 _creationFee;
    uint128 _creationMinValue;
    string _name;
    string _symbol;
    TvmCell _colTokenCode;
    TvmCell _collectionCode;
    uint64 _totalSupply;

    modifier validCreatorFees(uint32 fees) {
        require(fees < 2401, 277);
        _;
    }

    constructor(
        address manager,
        uint128 creationMinValue,
        uint128 creationFee,
        string  name,
        string  symbol,
        TvmCell collectionCode,
        TvmCell colTokenCode
    )
        public
    {
        require(msg.pubkey() == tvm.pubkey(),101);
        tvm.accept();
        _manager = manager;
        _creationMinValue = creationMinValue;
        _creationFee = creationFee;
        _name = name;
        _symbol = symbol;
        _collectionCode = collectionCode;
        _colTokenCode = colTokenCode;
    }

    function getManager() public view returns(address){
        return _manager;
    }

    function changeManager(address newManager) public {
        require(msg.sender == _manager,102);
        tvm.accept();
        _manager = newManager;
    }

    function getInfo() public view functionID(0xa) returns(string  name, string  symbol, uint64 totalSupply){
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply;
    }

    function withdraw(address addr, uint128 value, bool bounce) public view {
        require(msg.sender == _manager,102);
        tvm.accept();
        addr.transfer(value, bounce);
    }

    function createCollection(
        address creator,
        string  name,
        string  symbol,
        uint64 limit,
        uint32 creatorFees,
        uint128 mintCost,
        string[] level1,
        string[] level2,
        string[] level3,
        string[] level4,
        string[] level5,
        string hash,
        uint32 startTime
    ) public validCreatorFees(creatorFees) internalMsg returns(address addr){
        require(msg.value >= _creationMinValue,278);
        require(mintCost >= MINT_COST_MIN, 279);
        uint128 value = msg.value - _creationFee;
        _totalSupply++;

        addr = new Collection{
            code: _collectionCode,
            value: value,
            pubkey: tvm.pubkey(),
            varInit: {
                _root: address(this),
                _id: _totalSupply
            }
        }(creator, _manager, name, symbol, limit, _colTokenCode, creatorFees, mintCost, level1, level2, level3, level4, level5, hash, startTime);
        emit SRC_CT_nifi_col1_1{dest: NotificationAddress.value()}(_totalSupply);
    }

    function getCollectionAddress(uint64 id) public view returns(address addr) {
        TvmCell stateInit = tvm.buildStateInit({
            code: _collectionCode,
            contr: Collection,
            pubkey: tvm.pubkey(),
            varInit: {
                _root: address(this),
                _id: id
        }});
        return address(tvm.hash(stateInit));
    }

    function getTokenAddress(uint64 col, uint8 id1, uint8 id2, uint8 id3, uint8 id4, uint8 id5) public view returns(address addr) {
        TvmCell stateInit = tvm.buildStateInit({
            code: _collectionCode,
            contr: Collection,
            pubkey: tvm.pubkey(),
            varInit: {
                _root: address(this),
                _id: col
        }});

        TvmCell stateInit1 = tvm.buildStateInit({
            code: _colTokenCode,
            contr: CollectionToken,
            pubkey: tvm.pubkey(),
            varInit: {
                _root: address(this),
                _collection: address(tvm.hash(stateInit)),
                _collectionId: col,
                _id1: id1,
                _id2: id2,
                _id3: id3,
                _id4: id4,
                _id5: id5
        }});

        return address(tvm.hash(stateInit1));
    }
}
