pragma ton-solidity >= 0.44.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

import "INFTCollcetion.sol";


contract Image {

    address static _root;
    uint8 static _level;
    uint8 static _id;

    uint8 _chunks;
    mapping(uint8 => bytes) _content;
    bool public _complete;

    uint64 _price;

    uint8 _levelImageCount;
    uint8 _nextLevelImageCount;

    address _owner;
    string _name;

    modifier onlyRoot() {
        require(msg.sender == _root, 101);
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == _owner, 102);
        _;
    }

    modifier notComplete() {
        require(_complete == false, 103);
        _;
    }

    modifier isComplete() {
        require(_complete == true, 104);
        _;
    }

    constructor(address owner, uint8 levelImageCount) public onlyRoot
    {
        require(levelImageCount>0,111);
        _owner = owner;
        _levelImageCount = levelImageCount;
    }

    function setImageProps(uint8 chunks, uint64 price, uint8 nextLevelImageCount, string name) public onlyOwner {
        require(chunks>0,111);
        _chunks = chunks;
        _price = price;
        _nextLevelImageCount = nextLevelImageCount;
        _name = name;
    }

    function getImageAddress(uint8 levelId, uint8 id) public view returns (address addr) {
        TvmCell stateInit = tvm.buildStateInit({
            code: tvm.code(),
            contr: Image,
            pubkey: tvm.pubkey(),
            varInit: {
                _root: _root,
                _level: levelId,
                _id: id
            }
        });
        addr = address(tvm.hash(stateInit));
    }

    function getInfo() public view returns(address root, address owner, uint8 chunks, uint64 price, uint8 levelImageCount, uint8 nextLevelImageCount, bool complete, string name) {
        root = _root;
        owner = _owner;
        chunks = _chunks;
        price = _price;
        levelImageCount = _levelImageCount;
        nextLevelImageCount =_nextLevelImageCount;
        complete = _complete;
        name = _name;
    }

    function getContent() public view returns(mapping(uint8 => bytes) content) {
        content =_content;
    }

    function fillContent(uint8 chunkNumber, bytes part) public notComplete onlyOwner {
        _content[chunkNumber] = part;
        uint8 acc;
        optional(uint8, bytes) chunk = _content.min();
        while (chunk.hasValue()) {
            (uint8 currentNumber, ) = chunk.get();
            acc++;
            chunk = _content.next(currentNumber);
        }
        if (acc == _chunks) {
            _complete = true;
        } else {
          msg.sender.transfer(0, true, 64);
        }
    }

    function processMint(address futureAddress, uint8[] imgIds, uint128 price) public view internalMsg {
        if (_level==0){
            require(msg.sender==_root,101);
        }else{
            require(msg.sender==getImageAddress(_level-1,imgIds[_level-1]),102);
        }

        price += _price;
        if (_complete && ((_nextLevelImageCount==0) || (imgIds[_level+1]<_nextLevelImageCount))) {
            if(_nextLevelImageCount>0)
                Image(getImageAddress(_level+1,imgIds[_level+1])).processMint{value: 0, flag: 64}(futureAddress,imgIds,price);
            else
                INFTCollection(_root).doMint{value: 0, flag: 64}(futureAddress,imgIds,price);
        } else {
            this.undoMint{value: 0, flag: 64}(futureAddress,imgIds);
        }

    }

    function undoMint(address futureAddress, uint8[] imgIds) public view internalMsg {
        require(msg.sender == address(this) || msg.sender==getImageAddress(_level+1,imgIds[_level+1]),102);

        if (_level == 0) {
           INFTCollection(_root).undoMint{value: 0, flag: 64}(futureAddress, imgIds);
        }else {
           Image(getImageAddress(_level-1,imgIds[_level-1])).undoMint{value: 0, flag: 64}(futureAddress,imgIds);
        }
    }


}
