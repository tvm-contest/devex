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

import "../contracts/NftRoot.sol";
import "../contracts/Data.sol";

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
    string url;
}

struct NftResp {
    address addrData;
    address owner;
}

contract NftDebot is Debot, Upgradable {

    address _addrNFT;
    address _addrNFTRoot;
    address _addrMultisig;

    uint32 _keyHandle;

    string _rarityName;
    uint _rarityAmount;

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
            _items.push(MenuItem("Get all available rarities", "", tvm.functionId(printRaritiesList)));
            _items.push(MenuItem("Add rarity", "", tvm.functionId(addRarityParam)));
            _items.push(MenuItem("Mint NFT", "", tvm.functionId(deployNft)));
        }
        Menu.select("---------Choose what you want to do---------", "", _items);
    }

    function deployNft(uint32 index) public {
        tvm.accept();
        _nftParams.creationDate = uint64(now);
        MenuItem[] items;
        items.push(MenuItem("Mint NFT", "", tvm.functionId(nftParamsInputRarity)));
        items.push(MenuItem("Return to main menu", "", tvm.functionId(mainMenu)));
        Menu.select("---------Choose what you want to do---------", "", items);
    }

    function addRarityParam(uint32 index) public {
        tvm.accept();
        Terminal.input(tvm.functionId(addRarityName), "Enter NFT rarity:", false);
    }

    function addRarityName(string value) public {
        tvm.accept();
        _rarityName = value;
        AmountInput.get(tvm.functionId(setRarityAmount), "Enter NFT rarity amount:", 0, 0, 1000);
    }

    function setRarityAmount(uint256 value) public {
        tvm.accept();
        _rarityAmount = value;
        resolveRarityAddition();
    }

    function nftParamsInputRarity(uint32 index) public {
        tvm.accept();
        Terminal.input(tvm.functionId(nftParamsSetRarity), "Enter NFT rarity:", false);
    }

    function nftParamsSetRarity(string value) public {
        tvm.accept();
        _nftParams.rarityName = value;
        Terminal.input(tvm.functionId(nftParamsSetMedia), "Enter link to media file:", false);
    }

    function nftParamsSetMedia(string value) public {
        tvm.accept();
        _nftParams.url = value;
        this.deployNftStep1();
    }

    function deployNftStep1() public {
        Terminal.print(0, 'NFT data');
        Terminal.print(0, format("NFT owner: {}\n", _addrMultisig));
        Terminal.print(0, format("Date of NFT creation: {}\n", _nftParams.creationDate));
        Terminal.print(0, format("NFT rarity: {}\n", _nftParams.rarityName));
        Terminal.print(0, format("Media link: {}\n", _nftParams.url));
        resolveNftDataAddr();
        ConfirmInput.get(tvm.functionId(deployNftStep2), "Sign and mint NFT?");
    }

    function deployNftStep2(bool value) public {
        if(value) {
            Terminal.print(0, format('Your token will be deployed at address: {}', _addrNFT));
            this.deployNftStep3();
        } else {
            this.deployNft(0);
        }
    }

    function deployNftStep3() public {
        optional(uint256) pubkey;

        TvmCell payload = tvm.encodeBody(
            NftRoot.mintNft,
            _nftParams.rarityName,
            _nftParams.url
        );
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
        address addrTrusted,
        string rarityName,
        string url
    ) public {
        Terminal.print(0, 'Data of deployed NFT: ');
        Terminal.print(0, format("NFT address: {}", addrData));
        Terminal.print(0, format("Rarity: {}\n", rarityName));
        Terminal.print(0, format("Link: {}\n", url));
        restart();
    }

    function resolveRarityAddition() public {
        tvm.accept();
         TvmCell payload = tvm.encodeBody(
            NftRoot.addRarity,
            _rarityName, 
            _rarityAmount
        );
        optional(uint256) pubkey;
        IMultisig(_addrMultisig).sendTransaction {
            abiVer: 2,
            extMsg: true,
            sign: true,
            pubkey: pubkey,
            time: 0,
            expire: 0,
            callbackId: tvm.functionId(onAddRaritySuccess),
            onErrorId: tvm.functionId(onError),
            signBoxHandle: _keyHandle
        }(_addrNFTRoot, 2 ton, true, 3, payload);
    }

    function onAddRaritySuccess() public {
        Terminal.print(0, "Rarity added!");
        restart();
    }

    function onError(uint32 sdkError, uint32 exitCode) public {
        Terminal.print(0, format("Sdk error {}. Exit code {}.", sdkError, exitCode));
        restart();
    }

    function printRaritiesList() public {
        Terminal.print(0, "List of rarities: UltraRare, Rare, Common, Junk");
        restart();
    }

    function resolveNftDataAddr() public {
        tvm.accept();
        NftRoot(_addrNFTRoot).getTokenData{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(setNftAddr),
            onErrorId: 0,
            time: uint64(now),
            expire: 0,
            sign: false
        }();
    }

    function setNftAddr(TvmCell code, uint totalMinted) public {
        tvm.accept();
        TvmBuilder salt;
        salt.store(_addrNFTRoot);
        TvmCell newCodeData = tvm.setCodeSalt(code, salt.toCell());
        TvmCell stateNftData = tvm.buildStateInit({
            contr: Data,
            varInit: {_id: totalMinted},
            code: newCodeData
        });
        uint256 hashStateNftData = tvm.hash(stateNftData);
        _addrNFT = address.makeAddrStd(0, hashStateNftData);
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