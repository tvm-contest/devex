pragma ton-solidity >=0.47.0;
pragma AbiHeader expire;
pragma AbiHeader time;
pragma AbiHeader pubkey;
// import required DeBot interfaces and basic DeBot contract.
import "https://raw.githubusercontent.com/tonlabs/debots/main/Debot.sol";
import "DeBotInterfaces.sol";
import "../contracts/Image.sol";
import "../contracts/Constants.sol";

abstract contract AMSig {
    function sendTransaction(
        address dest,
        uint128 value,
        bool bounce,
        uint8 flags,
        TvmCell payload)
    public {}
}

interface IImage {
    function getContent() external returns(mapping(uint8 => bytes) content);
    function getInfo() external returns(address root, address owner, uint8 chunks, uint64 price, uint8 levelImageCount, uint8 nextLevelImageCount, bool complete, string name) ;
}

interface IToken {
    function changeOwner(address newOwner) external;
}

contract NFTDebot is Debot, Upgradable {

    address _nftCollection;
    uint256 _nftCollectionPubkey;
    address _owner;
    address _collectionOwner;
    uint32 _signingBox;
    TvmCell _certCode;
    TvmCell _imageCode;
    uint8 _levelCount;

    TvmCell _sendMsg;



    address[] _tokens;
    uint32 _curToken;

    MenuItem[] _items;
    uint8[] _itemsIds;
    uint8[] _imgIds;
    uint64[] _imgCost;
    uint8 _curLvl;
    uint8 _curImg;
    uint128 _curCost;


    function setNFTCollection(address root, uint256 pubkey) public {
        require(msg.pubkey()==tvm.pubkey(),101);
        tvm.accept();
        _nftCollection = root;
        _nftCollectionPubkey = pubkey;
    }

    function getMethodError(uint32 sdkError, uint32 exitCode) public {
        Terminal.print(0, format("Get method error. Sdk error = {}, Error code = {}", sdkError, exitCode));
    }

    function start() public override {
        UserInfo.getAccount(tvm.functionId(getUserAddress));
    }

    function getUserAddress(address value) public {
        _owner = value;
        UserInfo.getSigningBox(tvm.functionId(getUserSb));
    }

    function getUserSb(uint32 handle) public {
        _signingBox = handle;
        optional(uint256) none;
        INFTCollection(_nftCollection).getInfo {
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(setColInfo),
            onErrorId:  tvm.functionId(getMethodError),
            time: 0,
            expire: 0,
            sign: false,
            pubkey: none
        }();
    }

    function setColInfo(
        address owner,
        uint32 supply,
        uint32 minted,
        uint8 levelCount,
        uint32 firstLvlImgCount,
        bool complete
    ) public {
        _levelCount = levelCount;
        if (!complete) Terminal.print(0,"Error: collection is not completed yet");
        else {
            //set price table
            optional(uint256) none;
            INFTCollection(_nftCollection).getCodes{
                abiVer: 2,
                extMsg: true,
                callbackId: tvm.functionId(setCodes),
                onErrorId:  tvm.functionId(getMethodError),
                time: 0,
                expire: 0,
                sign: false,
                pubkey: none
            }();
        }
    }

    function setCodes(TvmCell certCode, TvmCell imageCode) public {
        _imageCode = imageCode;
        TvmBuilder salt;
        salt.store(_owner);
        _certCode =  tvm.setCodeSalt(certCode, salt.toCell());
        getUserTokens();
    }

    function getUserTokens() public {
        _tokens = new address[](0);
        Sdk.getAccountsDataByHash(tvm.functionId(getCertByHash),tvm.hash(_certCode),address.makeAddrStd(-1, 0));
    }

    function parceCertData(AccData acc) public {
        ( , , , address token) = acc.data.toSlice().decode(
            uint256,
            uint64,
            bool,
            address
        );
        _tokens.push(token);
    }

    function getCertByHash(AccData[] accounts) public {

        for (uint i=0; i<accounts.length;i++)
        {
            parceCertData(accounts[i]);
        }

        if (accounts.length != 0) {
            Sdk.getAccountsDataByHash(
                tvm.functionId(getCertByHash),
                tvm.hash(_certCode),
                accounts[accounts.length - 1].id
            );
        } else {
            filterTokensByRoot();
        }
    }

    function filterTokensByRoot() public {
        showMenu(0);
    }

    function showMenu(uint32 index) public {
        Terminal.print(0,format("You have {} nft",_tokens.length));
        _items = new MenuItem[](0);
        MenuItem[] items;
        if (_tokens.length>0) {items.push(MenuItem("View", "", tvm.functionId(listNft)));}
        items.push( MenuItem("Mint CAT", "", tvm.functionId(mintNft)));
        Menu.select("Select action", "", items);
    }

    function getImageAddress(uint8 levelId, uint8 id) private view returns (address addr) {
        TvmCell stateInit = tvm.buildStateInit({
            code: _imageCode,
            contr: Image,
            pubkey: _nftCollectionPubkey,
            varInit: {
                _root: _nftCollection,
                _level: levelId,
                _id: id
            }
        });
        addr = address(tvm.hash(stateInit));
    }

    function mintNft(uint32 index) public {
        _curLvl = 0;
        _curImg = 0;
        _curCost = 0;
        _items = new MenuItem[](0);
        _itemsIds = new uint8[](0);
        _imgIds = new uint8[](0);
        getImagesInfo();
    }

    function getImagesInfo() public{
        address addr = getImageAddress(_curLvl,_curImg);
        optional(uint256) none;
        IImage(addr).getInfo{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(getLevelImageInfo),
            onErrorId:  tvm.functionId(getMethodError),
            time: 0,
            expire: 0,
            sign: false,
            pubkey: none
        }();

    }

    function getLevelImageInfo(address root, address owner, uint8 chunks, uint64 price, uint8 levelImageCount, uint8 nextLevelImageCount, bool complete, string name) public {
        _items.push(MenuItem(format("{} - price {} EVER", name, price/1 ton), "", tvm.functionId(selectLevelImg)));
        _itemsIds.push(_curImg);
        _imgCost.push(price);

        _curImg++;
        if (_curImg==levelImageCount) {
            showMintMenu();
        } else {
            getImagesInfo();
        }
    }

    function showMintMenu() public {
        Menu.select(format("Level {}",_curLvl+1), "", _items);
    }

    function selectLevelImg(uint32 index) public {
        _curImg = uint8(index);
        address addr = getImageAddress(_curLvl,_curImg);

        optional(uint256) none;
        IImage(addr).getContent{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(getLevelImageContent),
            onErrorId:  tvm.functionId(getMethodError),
            time: 0,
            expire: 0,
            sign: false,
            pubkey: none
        }();
    }

    function getLevelImageContent(mapping(uint8 => bytes) content) public {
        bytes png = "";
        optional(uint8 , bytes) chunk = content.min();
        while (chunk.hasValue()) {
            (uint8 u, bytes b) = chunk.get();
            png.append(b);
            chunk = content.next(u);
        }
        Base64.encode(tvm.functionId(imageBase64),png);
    }

    function imageBase64(string base64) public {
        string str = "data:image/png;base64,";
        str.append(base64);
        Media.output(tvm.functionId(setShowImageResult), "Image", str);
    }

    function setShowImageResult(MediaStatus result) public  {
        if(result == MediaStatus.Success) {
            ConfirmInput.get(tvm.functionId(confirmImage), "Select this image?");
        }else{
            Terminal.print(0,"Error: can't show image");
        }

    }

    function confirmImage(bool value) public  {
        if (value){
            _imgIds.push(_itemsIds[_curImg]);
            _curCost += _imgCost[_curImg];

            _curLvl++;
             if (_curLvl==_levelCount) {
                 mintToken();
             }else{
                 _curImg=0;
                 _items = new MenuItem[](0);
                 getImagesInfo();
             }
        }else {
           showMintMenu();
        }
    }

    function mintToken() public {
        optional(uint256) none;
        INFTCollection(_nftCollection).getTokenAddress{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(setMintTokenAddress),
            onErrorId:  tvm.functionId(getMethodError),
            time: 0,
            expire: 0,
            sign: false,
            pubkey: none
        }(_imgIds);
    }
    function setMintTokenAddress(address addr) public {
        Sdk.getAccountType(tvm.functionId(setMintTokenType),addr);
    }
    function setMintTokenType(int8 acc_type) public {
        if (acc_type == -1) {
            TvmCell payload = tvm.encodeBody(INFTCollection.mint, _imgIds);
            _curCost +=Constants.TOKEN_DEPLOY_VALUE;
            optional(uint256) none;
            _sendMsg = tvm.buildExtMsg({
                abiVer: 2,
                dest: _owner,
                callbackId: tvm.functionId(mintTokenSuccess),
                onErrorId: tvm.functionId(mintTokenError),
                time: 0,
                expire: 0,
                sign: true,
                pubkey: none,
                signBoxHandle: _signingBox,
                call: {AMSig.sendTransaction, _nftCollection, _curCost, true, 1, payload}
            });
            ConfirmInput.get(tvm.functionId(confirmMintToken), format("Do you want mint CAT for {:t} EVERS?",_curCost));
        }else {
            Terminal.print(tvm.functionId(getUserTokens), "This token already exists!");
        }
    }

    function confirmMintToken(bool value) public {
        if (value) {
            Sdk.getBalance(tvm.functionId(checkMsigBalanceAmount), _owner);
        } else {
            Terminal.print(tvm.functionId(this.start), "Terminated!");
        }
    }

    function checkMsigBalanceAmount(uint128 nanotokens) public {
        uint128 fee = 0.1 ton;
        if (nanotokens >_curCost+Constants.TOKEN_DEPLOY_VALUE+fee) {
            tvm.sendrawmsg(_sendMsg, 1);
        } else {
            Terminal.print(tvm.functionId(this.start), "Error: Your don't have enougth money on your multisig for operation! Terminated!");
        }
    }

    function mintTokenError(uint32 sdkError, uint32 exitCode) public {
        Terminal.print(0, format("Transaction failed. Sdk error = {}, Error code = {}\nDo you want to retry?", sdkError, exitCode));
    }

    function mintTokenSuccess() public {
        getUserTokens();
    }

    //Menu list NFT
    function listNft(uint32 index) public {
         _items = new MenuItem[](0);
         for(uint i = 0; i<_tokens.length; i++) {
             _items.push(MenuItem(format("{}", _tokens[i]), "", tvm.functionId(selectUserNft)));
         }
         _items.push(MenuItem("Back", "", tvm.functionId(showMenu)));

         Menu.select("Select token", "", _items);
    }

    function selectUserNft(uint32 index) public {
        _curToken = index;
        Menu.select("Select action", "", [
            MenuItem("Gift", "", tvm.functionId(giftUserNft)),
            MenuItem("Back", "", tvm.functionId(listNft))

        ]);
    }

    //change owner
    function giftUserNft(uint32 index) public {
        AddressInput.get(tvm.functionId(getNewOwner),"Please enter the address of recipient");
    }

    function getNewOwner(address value) public {
        TvmCell payload = tvm.encodeBody(IToken.changeOwner, value);
        _curCost = Constants.CHANGE_OWNER_VALUE;
        optional(uint256) none;
        _sendMsg = tvm.buildExtMsg({
            abiVer: 2,
            dest: _owner,
            callbackId: tvm.functionId(changeOwnerSuccess),
            onErrorId: tvm.functionId(changeOwnerError),
            time: 0,
            expire: 0,
            sign: true,
            pubkey: none,
            signBoxHandle: _signingBox,
            call: {AMSig.sendTransaction, _nftCollection, _curCost, true, 1, payload}
        });

        ConfirmInput.get(tvm.functionId(confirmChangeOwner), format("Do you want to change owner of this token to {}?",value));
    }

    function confirmChangeOwner(bool value) public {
        if (value) {
            Sdk.getBalance(tvm.functionId(checkMsigBalanceAmount), _owner);
        } else {
            Terminal.print(tvm.functionId(this.start), "Terminated!");
        }
    }

    function changeOwnerError(uint32 sdkError, uint32 exitCode) public {
        ConfirmInput.get(tvm.functionId(confirmChangeOwner), format("Transaction failed. Sdk error = {}, Error code = {}\nDo you want to retry?", sdkError, exitCode));
    }

    function changeOwnerSuccess(uint64 transId) public {
        transId;
        getUserTokens();
    }

    /*
    *  Implementation of DeBot
    */
    function getDebotInfo() public functionID(0xDEB) override view returns(
        string name, string version, string publisher, string caption, string author,
        address support, string hello, string language, string dabi, bytes icon
    ) {
        name = "NFT CATS";
        version = "0.1.2";
        publisher = "";
        caption = "Mint some cats token";
        author = "";
        support = address.makeAddrStd(0, 0x0);
        hello = "";
        language = "";
        dabi = m_debotAbi.get();
        icon = "";
    }

    function getRequiredInterfaces() public view override returns (uint256[] interfaces) {
        return [ Sdk.ID, Terminal.ID];
    }

    /*
    *  Implementation of Upgradable
    */
    function onCodeUpgrade() internal override {
        tvm.resetStorage();
    }

}