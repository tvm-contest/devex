pragma ton-solidity >= 0.43.0;
pragma AbiHeader expire;
pragma AbiHeader time;
pragma AbiHeader pubkey;

// Import debot libs 
import "../debotLib/Debot.sol";
import "../debotLib/Terminal.sol";
import "../debotLib/Menu.sol";
import "../debotLib/AddressInput.sol";
import "../debotLib/ConfirmInput.sol";
import "../debotLib/Upgradable.sol";
import "../debotLib/Sdk.sol";
import "../debotLib/SigningBoxInput.sol";
import "../debotLib//Msg.sol";
import "../debotLib//NumberInput.sol";
import "../debotLib//AmountInput.sol";
import "../debotLib//UserInfo.sol";

import "../NftRoot.sol";
import "../IndexBasis.sol";
import "../Data.sol";
import "../Index.sol";
import "../libraries/Enums.sol";


interface IMultisig {
    function sendTransaction(
        address dest,
        uint128 value,
        bool bounce,
        uint8 flags,
        TvmCell payload)
    external;
}

struct NftParams {
    string nftType;
    
    /*%PARAM_DEFENITION%*/
}

contract NftDebot is Debot, Upgradable {

    address _tokenFutureAddress;

    address static _addrNFTRoot;

    address _addrMultisig;

    uint32 _keyHandle;

    NftParams _nftParams;
    /*PARAM_ENUM_LENGTH*/

    modifier accept {
        tvm.accept();
        _;
    }

    /*
     *  Overrided Debot functions
     */

    /// @notice Returns Metadata about DeBot.
    function getDebotInfo() public functionID(0xDEB) override view returns(
        string name, string version, string publisher, string key, string author,
        address support, string hello, string language, string dabi, bytes icon
    ) {
        name = "NFT DeBot";
        version = "0.1.0";
        publisher = "";
        key = "Nft minter";
        author = "";
        support = address.makeAddrStd(0, 0x66e01d6df5a8d7677d9ab2daf7f258f1e2a7fe73da5320300395f99e01dc3b5f);
        hello = "Hi, i'm a Minting-Nft DeBot.";
        language = "en";
        dabi = m_debotAbi.get();
        icon = "";
    }

    function getRequiredInterfaces() public view override returns (uint256[] interfaces) {
        return [ Terminal.ID, Menu.ID, AddressInput.ID, SigningBoxInput.ID, ConfirmInput.ID, AmountInput.ID ];
    }

    // initial setup
    function start() public override {
        Terminal.print(0, 'You need to attach future owner of the token.\nIt will be used also to pay for all transactions.');
        attachMultisig();
    }

    function setup1() public {
        uint[] none;
        SigningBoxInput.get(tvm.functionId(setKeyHandle), "Enter keys to sign all operations.", none);
    }
    function setup2() public {
        Terminal.print(0, 'You need to attach NftRoot, that will mint token.');
        attachNftRoot();
    }
    function menu() public {
        MenuItem[] _items;
        _items.push(MenuItem("Mint  Nft", "", tvm.functionId(deployNft)));
        _items.push(MenuItem("Change nftRoot address", "", tvm.functionId(attachNftRoot)));
        Menu.select("==What to do?==", "", _items);
    }

    //=========================================================================
    // Nft deployment
    //=========================================================================
    function deployNft(uint32 index) public {
        index = index;
        /*%TYPE_INPUT%*/Terminal.input(tvm.functionId(nftParamsSetType), "Enter NFT type: ", false);
        /*TERMINAL_FOR_DEBOT_SET_TYPES*/
        this.deployNftStep1();
    }
    function nftParamsSetType(string value) public {
        _nftParams.nftType = value;
    }

    /*FUNCTION_FOR_DEBOT_SET_TYPES*/

    function deployNftStep1() public {
        this.deployNftStep2();
    }
    function deployNftStep2() public {
        Terminal.print(0, 'Let`s check data.');
        /*%TYPE_PRINT%*/Terminal.print(0, format("Type: {}", _nftParams.nftType));
        /*TERMINAL_TO_DEPLOY_NFT_STEP_2*/
        Terminal.print(0, format("Owner of Nft: {}\n", _addrMultisig));
        resolveNftDataAddr();
        ConfirmInput.get(tvm.functionId(deployNftStep3), "Sign and mint Token?");
    }

    function deployNftStep3(bool value) public {
        if(value) {
            Terminal.print(0, format('Your token will be deployed at address: {}', _tokenFutureAddress));
            this.deployNftStep4();
        } else {
            this.deployNft(0);
        }
    }

    function deployNftStep4() public accept {
        address[] emptyAddrs;
        TvmCell payload = tvm.encodeBody(
            NftRoot.mintNft,
            bytes(''),
            bytes(''),
            uint8(0),
            uint8(0),
            emptyAddrs,
            uint8(0),
            _nftParams.nftType/*PARAM_TO_DEBOT_MINT*/
        );
        optional(uint256) none;
        IMultisig(_addrMultisig).sendTransaction {
            abiVer: 2,
            extMsg: true,
            sign: true,
            pubkey: none,
            time: 0,
            expire: 0,
            callbackId: tvm.functionId(onNftDeploySuccess),
            onErrorId: tvm.functionId(onError),
            signBoxHandle: _keyHandle
        }(_addrNFTRoot, 2 ton, true, 3, payload);
    }

    function onNftDeploySuccess() public accept {
        Terminal.print(0, format('Your token is deployed at address: {}', _tokenFutureAddress));
            Data(_tokenFutureAddress).getInfo{
                abiVer: 2,
                extMsg: true,
                callbackId: tvm.functionId(checkResult),
                onErrorId: tvm.functionId(onError),
                time: 0,
                expire: 0,
                sign: false
            }();
    }
    function checkResult(
        address addrRoot,
        address addrOwner,
        address addrAuthor,
        address addrData,
        uint256 id,
        bytes name,
        bytes url,
        uint8 number,
        uint8 amount,
        string nftType/*%PARAM_TO_MINT%*/
    ) public {
        Terminal.print(0, 'Check actual data of deployed token: ');
        Terminal.print(0, format("Token address: {}", addrData));
        /*%TYPE_PRINT_RESULT%*/Terminal.print(0, format("Nft type: {}", nftType));
        Terminal.print(0, format("Root: {}", addrRoot));
        Terminal.print(0, format("Owner: {}", addrOwner));
        Terminal.print(0, format("Author: {}", addrAuthor));
        
        /*TERMINAL_CHECK_RESULT*/
        menu();
    }
    //=========================================================================

    /*
    * Resolvers
    */

    function resolveNftDataAddr() public accept{
        NftRoot(_addrNFTRoot).getTokenData{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(setNftAddr),
            onErrorId: 0,
            time: 0,
            expire: 0,
            sign: false
        }();
    }
    function setNftAddr(TvmCell code, uint totalMinted) public accept{
        TvmBuilder salt;
        salt.store(_addrNFTRoot);
        TvmCell codeData = tvm.setCodeSalt(code, salt.toCell());
        TvmCell stateNftData = tvm.buildStateInit({
            contr: Data,
            varInit: {_id: totalMinted},
            code: codeData
        });
        uint256 hashStateNftData = tvm.hash(stateNftData);
        _tokenFutureAddress = address.makeAddrStd(0, hashStateNftData);
    }

    /*
    * helpers
    */

    function onError(uint32 sdkError, uint32 exitCode) public {
        Terminal.print(0, format("Sdk error {}. Exit code {}.", sdkError, exitCode));
        menu();
    }

    function attachMultisig() public accept {
        AddressInput.get(tvm.functionId(saveMultisig), "Enter address:");
    }
    function saveMultisig(address value) public accept {
        _addrMultisig = value;
        setup1();
    }
    
    function setKeyHandle(uint32 handle) public accept {
        _keyHandle = handle;
        setup2();
    }
    
    function attachNftRoot() public accept {
        AddressInput.get(tvm.functionId(saveRootAddr), "Enter address:");
    }
    function saveRootAddr(address value) public accept {
        _addrNFTRoot = value;
        menu();
    }

    ///
    function onCodeUpgrade() internal override {
        tvm.resetStorage();
    }
}