pragma ton-solidity >=0.43.0;

pragma AbiHeader expire;
pragma AbiHeader time;
pragma AbiHeader pubkey;

import "./vendoring/Debot.sol";
import "./vendoring/Terminal.sol";
import "./vendoring/SigningBoxInput.sol";
import "./vendoring/Menu.sol";
import "./vendoring/AmountInput.sol";
import "./vendoring/AddressInput.sol";
import "./vendoring/ConfirmInput.sol";
import "./vendoring/Upgradable.sol";
import "./vendoring/Sdk.sol";

import "../NftRoot.sol";
import "../Data.sol";

interface IMultisig {

    function sendTransaction(
        address dest,
        uint128 value,
        bool bounce,
        uint8 flags,
        TvmCell payload
    ) external;
}

struct NftParams {
    uint64 creationDate;
    string rarityName;
}

struct NftResp {
    address addrData;
    address owner;
}

contract NftDebot is Debot, Upgradable {

    TvmCell _codeData;

    address _addrNFT;
    address _addrNFTRoot;
    uint256 _totalMinted;

    address _addrMultisig;

    uint32 _keyHandle;

    NftParams _nftParams;
    NftResp[] _owners;

    /// @notice Returns Metadata about DeBot.
    function getDebotInfo() public functionID(0xDEB) override view returns(
        string name, string version, string publisher, string key, string author,
        address support, string hello, string language, string dabi, bytes icon
    ) {
        name = "NFT Debot";
        version = "1.4.2";
        publisher = "";
        key = "";
        author = "Riezowe Kawatashi";
        support = address(0);
        hello = "Hello, I am NFT Debot.";
        language = "en";
        dabi = m_debotAbi.get();
        icon = "";
    }

    function getRequiredInterfaces() public view override returns (uint256[] interfaces) {
        return [ Terminal.ID, Menu.ID, AddressInput.ID, SigningBoxInput.ID, ConfirmInput.ID, AmountInput.ID ];
    }

    function start() public override {
        mainMenu(0);
    }

    function mainMenu(uint32 index) public {
        if(_addrMultisig == address(0)) {
            Terminal.print(0, 'Looks like you do not have attached Multi-Signature Wallet.');
            attachMultisig();
        } else {
            restart();
        }
    }

    function attachMultisig() public {
        AddressInput.get(tvm.functionId(saveMultisig), "Enter Multi-Signature Wallet address: ");
    }

    function menu() public {
        uint[] none;
        SigningBoxInput.get(tvm.functionId(setKeyHandle), "Enter keys to sign all operations.", none);
        
    }

    function restart() public {
        if (_addrNFTRoot == address(0)) {
            attachNftRoot();
        } else {
            getCrystalWalletAddr(_addrNFTRoot);
        }
    }


    function getCrystalWalletAddr(address addr) public {
        Sdk.getAccountType(tvm.functionId(checkRootContract), addr);
	}


    function checkAccountStatus(int8 acc_type) public returns (bool) {
        if (acc_type == -1)  {
            return false;
        }
        if (acc_type == 0) {
            return false;
        }
        if (acc_type == 2) {
            return false;
        }
        return true;
    }

    function checkRootContract(int8 acc_type) public {
        MenuItem[] _items;
        if (!checkAccountStatus(acc_type)) {
            Terminal.print(0, format("NFT Root is not deployed!"));
        } else {
            _items.push(MenuItem("Mint NFT", "", tvm.functionId(deployNft)));
            _items.push(MenuItem("Get all minted NFTs", "", tvm.functionId(getAllNftData)));
        }
        Menu.select("---------Choose what you want to do---------", "", _items);
    }

    function deployNft(uint32 index) public {
        tvm.accept();
        _nftParams.creationDate = uint64(now);
        MenuItem[] items;
        items.push(MenuItem("Click to mint NFT", "", tvm.functionId(nftParamsInputRarity)));
        items.push(MenuItem("Return to main menu", "", tvm.functionId(mainMenu)));
        Menu.select("---------Choose what you want to do---------", "", items);
    }

    function nftParamsInputRarity(uint32 index) public {
        tvm.accept();
        Terminal.input(tvm.functionId(nftParamsSetRarity), "Enter NFT rarity:", false);
    }
    function nftParamsSetRarity(string value) public {
        tvm.accept();
        _nftParams.rarityName = value;
        this.deployNftStep1();
    }

    function deployNftStep1() public {
        Terminal.print(0, 'NFT data');
        Terminal.print(0, format("NFT owner: {}\n", _addrMultisig));
        Terminal.print(0, format("Date of NFT creation: {}\n", _nftParams.creationDate));
        Terminal.print(0, format("NFT rarity: {}\n", _nftParams.rarityName));
        resolveNftDataAddr();
        ConfirmInput.get(tvm.functionId(deployNftStep2), "Sign and mint NFT?");
    }

    function deployNftStep2(bool value) public {
        if(value) {
            this.deployNftStep3();
        } else {
            this.deployNft(0);
        }
    }

    function deployNftStep3() public {
        optional(uint256) pubkey;

        TvmCell payload = tvm.encodeBody(
            NftRoot.mintNft,
            _nftParams.rarityName
        );
        optional(uint256) none;
        IMultisig(_addrMultisig).sendTransaction {
            abiVer: 2,
            extMsg: true,
            sign: true,
            pubkey: pubkey,
            time: uint64(now),
            expire: 0,
            callbackId: tvm.functionId(onNftDeploySuccess),
            onErrorId: tvm.functionId(onNftDeployError),
            signBoxHandle: _keyHandle
        }(_addrNFTRoot, 2 ton, true, 3, payload);

    }
    
    function onNftDeploySuccess() public {
        tvm.accept();
        _totalMinted++;
        Terminal.print(0, format('Your token is deployed at address: {}', _addrNFT));
        Data(_addrNFT).getInfo{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(checkResult),
            onErrorId: 0,
            time: 0,
            expire: 0,
            sign: false
        }();
    }

    function onNftDeployError(uint32 sdkError, uint32 exitCode) public {
        Terminal.print(0, format("Deploy failed: error {}, code {} ", sdkError, exitCode));
        restart();
    }

    function checkResult(
        address addrData,
        address addrRoot,
        address addrOwner,
        address addrTrusted
    ) public {
        Terminal.print(0, 'Data of deployed NFT: ');
        Terminal.print(0, format("NFT address: {}", addrData));
        Terminal.print(0, format("Root: {}", addrRoot));
        Terminal.print(0, format("Owner: {}", addrOwner));
        Terminal.print(0, format("Rarity: {}\n", _nftParams.rarityName));
        restart();
    }

    function resolveNftDataAddr() public {
        tvm.accept();
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

    function setNftAddr() public {
        tvm.accept();
        TvmBuilder salt;
        salt.store(_addrNFTRoot);
        TvmCell newCodeData = tvm.setCodeSalt(_codeData, salt.toCell());
        TvmCell stateNftData = tvm.buildStateInit({
            contr: Data,
            varInit: {_id: _totalMinted},
            code: newCodeData
        });
        uint256 hashStateNftData = tvm.hash(stateNftData);
        _addrNFT = address.makeAddrStd(0, hashStateNftData);
    }

    function getAllNftData(uint32 index) public {
        delete _owners;
        TvmBuilder salt;
        salt.store(_addrNFTRoot);
        TvmCell code = tvm.setCodeSalt(_codeData, salt.toCell());
        uint256 codeHashNftData = tvm.hash(code);
        Sdk.getAccountsDataByHash(tvm.functionId(getNftDataByHash), codeHashNftData, address(0x0));
    }

    function getNftDataByHash(ISdk.AccData[] accounts) public {
        for (uint i = 0; i < accounts.length; i++)
        {
            getNftData(accounts[i].id);
        }
        this.printNftData();
    }

    function getNftData(address addrData) public {
        Data(addrData).getOwner{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(setNftData),
            onErrorId: 0,
            time: 0,
            expire: 0,
            sign: false
        }();
    }

    function setDataCode(TvmCell codeData) public {
        tvm.accept();
        _codeData = codeData;
    }

    function setNftData(address addrOwner, address addrData) public {
        tvm.accept();
        _owners.push(NftResp(addrData, addrOwner));
    }

    function printNftData() public {
        for (uint i = 0; i < _owners.length; i++) {
            string str = _buildNftDataPrint(i, _owners[i].addrData, _owners[i].owner);
            Terminal.print(0, str);
        }
        MenuItem[] items;
        items.push(MenuItem("Return to main menu", "", tvm.functionId(mainMenu)));
        Menu.select("", "", items);
    }

    function _buildNftDataPrint(uint id, address nftData, address ownerAddress) public returns (string str) {
        str = format("Index: {}\nNFT: {}\nOwner: {}\n", id, nftData, ownerAddress);
    }

     function attachNftRoot() public {
        AddressInput.get(tvm.functionId(saveRootAddr), "Attach NFTRoot.\nEnter address:");
    }

    function saveMultisig(address value) public {
        tvm.accept();
        _addrMultisig = value;
        restart();
    }
    function saveRootAddr(address value) public {
        tvm.accept();
        if (_addrMultisig == value) {
            Terminal.print(tvm.functionId(attachNftRoot), "Address of NFTRoot must be vary from your wallet address!\nTry again.");
        } else {
            _addrNFTRoot = value;
            menu();
        }
    }

    function setKeyHandle(uint32 handle) public {
        tvm.accept();
        _keyHandle = handle;
        restart();
    }

    function onCodeUpgrade() internal override {
        tvm.resetStorage();
    }
    
}