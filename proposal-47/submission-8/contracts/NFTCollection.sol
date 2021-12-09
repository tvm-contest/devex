pragma ton-solidity >= 0.44.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

import "Token.sol";
import "Image.sol";
import "Constants.sol";

struct SenderInfo {
    //TvmCell stateInit;
    uint8[] imgIds;
    address owner;
    uint128 value;
}

contract NFTCollection is INFTCollection {

    address _owner;
    uint8 _levelCount;
    uint32 _firstLvlImgCount;
    uint32 _supply;
    uint32 _minted;
    bool _complete;

    TvmCell _imageCode;
    TvmCell _tokenCode;
    TvmCell _certCode;

    mapping (address => SenderInfo) _queries;

    modifier onlyOwner() {
        require(msg.sender == _owner, 101);
        _;
    }

    modifier onlyThis() {
        require(msg.sender == address(this), 104);
        _;
    }

    modifier notComplete() {
        require(_complete == false, 106);
        _;
    }

    modifier isComplete() {
        require(_complete, 107);
        _;
    }

    modifier validImgsLen(uint8[] imgs) {
        require(imgs.length==_levelCount, 108);
        _;
    }

    constructor(address owner, uint32 supply, TvmCell imageCode, TvmCell tokenCode, TvmCell certCode) public {
        require(tvm.pubkey() == msg.pubkey(), 101);
        tvm.accept();
        _owner = owner;
        _supply = supply;
        _imageCode = imageCode;
        TvmBuilder salt;
        salt.store(address(this));
        _tokenCode = tvm.setCodeSalt(tokenCode, salt.toCell());
        _certCode = certCode;
    }

    function deployToken(address owner, uint8[] imgIds) private inline {
        new Token{
            code: _tokenCode,
            value: Constants.TOKEN_DEPLOY_VALUE,
            pubkey: tvm.pubkey(),
            varInit: {
                _images: imgIds
            }
        }(owner,_certCode);
    }

    function mint(uint8[] imgIds) public override isComplete {
        require(Constants.MIN_MINT_VALUE <= msg.value, 102);
        require(imgIds.length==_levelCount, 108);
        require(_minted<_supply, 109);
        require(imgIds[0]<_firstLvlImgCount,110);


        TvmCell stateInit = tvm.buildStateInit({
            code: _tokenCode,
            contr: Token,
            pubkey: tvm.pubkey(),
            varInit: {
                 _images: imgIds
            }
        });
        address addr = address(tvm.hash(stateInit));
        require (!_queries.exists(addr),104);

        _queries[addr] = SenderInfo(imgIds,msg.sender,msg.value);
        _minted++;
        TvmCell body = tvm.encodeBody(Token.isExist, onExist);
        addr.transfer({value: Constants.CHECK_TOKEN_VALUE, flag: 0, bounce:true, body: body});
    }

    function onExist(bool value0) public internalMsg {
        require(_queries.exists(msg.sender),104);
        SenderInfo sender = _queries[msg.sender];
        delete _queries[msg.sender];
        _minted--;
        sender.owner.transfer({value:sender.value - Constants.CHECK_TOKEN_FEE, flag:0 });
    }

    onBounce(TvmSlice slice) external {
        if (_queries.exists(msg.sender)) {
            SenderInfo sender = _queries[msg.sender];
            if (sender.owner == _owner){
                deployToken(sender.owner,sender.imgIds);
            } else {
                Image(getImageAddress(0,sender.imgIds[0])).processMint{value: Constants.GAS_PER_LEVEL*_levelCount, flag: 1}(msg.sender,sender.imgIds,0);
            }
        }
    }

    function removeQuery() public override internalMsg{
        require(_queries.exists(msg.sender),104);
        delete _queries[msg.sender];
    }

    //minting
    function undoMint(address futureAddress, uint8[] imgIds) public override internalMsg {
        if (getImageAddress(0,imgIds[0])==msg.sender) {
            SenderInfo sender = _queries[futureAddress];
            delete _queries[msg.sender];
            _minted--;
            if (sender.value> Constants.CHECK_TOKEN_FEE + Constants.GAS_PER_LEVEL*_levelCount)
                sender.owner.transfer({value:sender.value - Constants.CHECK_TOKEN_FEE - Constants.GAS_PER_LEVEL*_levelCount, flag:1 });
        }
    }

    function doMint(address futureAddress, uint8[] imgIds, uint128 price) public override internalMsg {
        if (getImageAddress(_levelCount-1,imgIds[_levelCount-1])==msg.sender) {
            SenderInfo sender = _queries[futureAddress];
            if (price < sender.value){
                deployToken(sender.owner,sender.imgIds);
            } else {
                _minted--;
                sender.owner.transfer({value:sender.value - Constants.CHECK_TOKEN_FEE - Constants.GAS_PER_LEVEL*_levelCount, flag:1 });
            }
        }
    }

    //images
    function addLevel(uint8 imgCount) public onlyOwner notComplete {
        //todo check msg.value
        require(imgCount>0,103);
        if (_levelCount==0) _firstLvlImgCount = imgCount;
        this.levelDeploy(0,imgCount,_levelCount);
        _levelCount+=1;
    }

    function levelDeploy(uint8 id, uint8 count, uint8 levelId) public view onlyThis {
        tvm.accept();
        uint8 to = math.min(count,id+Constants.DEPLOY_IMAGE_PER_BLOCK);
        for(uint8 i=id; i<to; i++) {
            new Image{
                code: _imageCode,
                value: Constants.IMAGE_DEPLOY_VALUE,
                pubkey: tvm.pubkey(),
                varInit: {
                    _root: address(this),
                    _level: levelId,
                    _id: i
                }
            }(_owner, count);
        }
        if (to<count) {
            this.levelDeploy(to,count,levelId);
        }
    }

    function getImageAddress(uint8 levelId, uint8 id) public view returns (address addr) {
        TvmCell stateInit = tvm.buildStateInit({
            code: _imageCode,
            contr: Image,
            pubkey: tvm.pubkey(),
            varInit: {
                _root: address(this),
                _level: levelId,
                _id: id
            }
        });
        addr = address(tvm.hash(stateInit));
    }

    function setComplete() public onlyOwner notComplete {
        require(_levelCount>0,103);
        _complete = true;
    }

    //geters
    function getInfo() public override returns (
        address owner,
        uint32 supply,
        uint32 minted,
        uint8 levelCount,
        uint32 firstLvlImgCount,
        bool complete
    ) {
        owner = _owner;
        supply = _supply;
        minted = _minted;
        levelCount = _levelCount;
        firstLvlImgCount = _firstLvlImgCount;
        complete = _complete;
    }

    function getTokenAddress(uint8[] imgIds) public override returns (address addr) {
        TvmCell stateInit = tvm.buildStateInit({
            code: _tokenCode,
            contr: Token,
            pubkey: tvm.pubkey(),
            varInit: {
                 _images: imgIds
            }
        });
        addr = address(tvm.hash(stateInit));
    }

    function withdraw(address addr, uint128 value, bool bounce) public view {
        require(msg.sender == _owner,101);
        tvm.accept();
        addr.transfer(value, bounce);
    }

    function getCodes() public override returns(TvmCell certCode, TvmCell imageCode) {
        certCode = _certCode;
        imageCode = _imageCode;
    }
}
