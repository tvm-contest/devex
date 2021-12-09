pragma ton-solidity >=0.47.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

//================================================================================
//
import "../interfaces/IDebot.sol";
import "../interfaces/IDistributor.sol";
import "../interfaces/ILiquidNFT.sol";
import "../interfaces/ILiquidNFTCollection.sol";

//================================================================================
//
contract AuctionDebot is IDebot
{
    address _distributorAddress;
    address _msigAddress;
    uint128 _price;

	//========================================
    //
    constructor(address ownerAddress, address distributorAddress) public 
    {
        tvm.accept();
        _ownerAddress       = ownerAddress;
        _distributorAddress = distributorAddress;
    }
    
    //========================================
    //
    function setDistributorAddress(address distributorAddress) public onlyOwner reserve returnChange
    {
        _distributorAddress = distributorAddress;
    }
    
	//========================================
    //
	function getRequiredInterfaces() public pure returns (uint256[] interfaces) 
    {
        return [Terminal.ID, AddressInput.ID, NumberInput.ID, AmountInput.ID, Menu.ID, Media.ID, UserInfo.ID];
	}

    //========================================
    //
    function getDebotInfo() public functionID(0xDEB) view returns(string name,     string version, string publisher, string key,  string author,
                                                                  address support, string hello,   string language,  string dabi, bytes icon)
    {
        name      = "Distributor Test";
        version   = "0.1.0";
        publisher = "SuperArmor";
        key       = "Gen the DeGen";
        author    = "SuperArmor";
        support   = address.makeAddrStd(0, 0);
        hello     = "Welcome to Distributor Test by SuperArmor!";
        language  = "en";
        dabi      = _debotAbi.hasValue() ? _debotAbi.get() : "";
        icon      = _icon.hasValue()     ? _icon.get()     : "";
    }

    //========================================
    /// @notice Define DeBot version and title here.
    function getVersion() public override returns (string name, uint24 semver) 
    {
        (name, semver) = ("Distributor Test", _version(0, 1, 0));
    }

    function _version(uint24 major, uint24 minor, uint24 fix) private pure inline returns (uint24) 
    {
        return (major << 16) | (minor << 8) | (fix);
    }

    //========================================
    // Implementation of Upgradable
    function onCodeUpgrade() internal override 
    {
        address owner = _ownerAddress;
        tvm.resetStorage();

        _ownerAddress = owner;
        _gasReserve   = 10000;
    }

    //========================================
    //
    function onError(uint32 sdkError, uint32 exitCode) public override
    {
        Terminal.print(0, format("Failed! SDK Error: {}. Exit Code: {}", sdkError, exitCode));
        mainMenu(0); 
    }

    //========================================
    /// @notice Entry point function for DeBot.    
    function start() public override 
    {
        mainEnterDialog(0);
    }

    //========================================
    //
    function mainEnterDialog(uint32 index) public
    {
        index; // shut a warning

        if(_distributorAddress == addressZero)
        {
            Terminal.print(0, "DeBot is being upgraded.\nPlease come back in a minute.\nSorry for inconvenience.");
            return;
        }

        UserInfo.getAccount(tvm.functionId(onMsigEnter));
    }

    //========================================
    //
    function onMsigEnter(address value) public
    {  
        _msigAddress = value;
        mainMenu(0);
    }

    //========================================
    //
    /*function getDistributorInfo(uint32 index) public
    {
        index; // shut a warning
        mainMenu(0);
        IDistributor(_distributorAddress).getInfo{
                        abiVer: 2,
                        extMsg: true,
                        sign: false,
                        time: uint64(now),
                        expire: 0,
                        pubkey: _emptyPk,
                        callbackId: tvm.functionId(onGetDistributorInfo),
                        onErrorId: 0
                        }(true, false);
    }

    function onGetDistributorInfo(uint256   nonce,
                                   address   creatorAddress,
                                   address   ownerAddress,
                                   uint256   ownerPubkey,
                                   address   treasuryAddress,
                                   address   collectionAddress,
                                   uint32    saleStartDate,
                                   uint32    presaleStartDate,
                                   uint128   price,
                                   uint256   mintedAmount,
                                   string[]  tokens,
                                   uint256   tokensAmount,
                                   bool      tokensLocked,
                                   mapping(address => uint32) 
                                             whitelist,
                                   uint256   whitelistCount,
                                   uint32    whitelistBuyLimit) public
    {
        _price = price;
        
        if(tokens.length >= mintedAmount)
        {
            Terminal.print(0, "Sorry mate, all tokens were minted already...");
        }
        else
        {
            mainMenu(0);
        }
    }*/

    //========================================
    //
    function mainMenu(uint32 index) public
    {
        index; // shut a warning

        MenuItem[] mi;
        mi.push(MenuItem("Mint",       "", tvm.functionId(_mint_1)         ));
        mi.push(MenuItem("<- Restart", "", tvm.functionId(mainEnterDialog) ));
        Menu.select("Enter your choice: ", "", mi);
    }

    //========================================
    //========================================
    //========================================
    //========================================
    //========================================
    //
    function _mint_1(uint32 index) public
    {
        index; // shut a warning

        TvmCell body = tvm.encodeBody(IDistributor.mint);
        _sendTransaction(0, 0, _msigAddress, _distributorAddress, body, 10 ton + 0.5 ton);
        
        Terminal.print(0, "You can find your minted NFT on https://distributor.platonov.io website.");
        mainEnterDialog(0);
    }
}

//================================================================================
//