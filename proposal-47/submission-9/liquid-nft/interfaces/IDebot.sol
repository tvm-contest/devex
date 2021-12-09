pragma ton-solidity >=0.52.0;
pragma AbiHeader expire;
pragma AbiHeader time;
pragma AbiHeader pubkey;

//================================================================================
//
import "../interfaces/IOwnable.sol";
import "../interfaces/debot/address.sol";
import "../interfaces/debot/amount.sol";
import "../interfaces/debot/datetime.sol";
import "../interfaces/debot/menu.sol";
import "../interfaces/debot/media.sol";
import "../interfaces/debot/network.sol";
import "../interfaces/debot/number.sol";
import "../interfaces/debot/sdk.sol";
import "../interfaces/debot/terminal.sol";
import "../interfaces/debot/userinfo.sol";

//================================================================================
//
interface IMsig 
{
    function sendTransaction(address dest,
                             uint128 value,
                             bool    bounce,
                             uint8   flags,
                             TvmCell payload) external view;
}

//================================================================================
//
abstract contract IDebot is IOwnable
{
    //========================================
    // 
    uint8 constant    DEBOT_ABI = 1;
    uint8             _options;
    optional(bytes)   _icon;
    optional(string)  _debotAbi;
    optional(uint256) _emptyPk;

    //========================================
    //
    function start() public virtual;

    //========================================
    //
    function getVersion() public virtual returns (string name, uint24 semver);

    //========================================
    //
    function getDebotOptions() public view returns (uint8 options, string debotAbi, string targetAbi, address targetAddr) 
    {
        debotAbi   = _debotAbi.hasValue() ? _debotAbi.get() : "";
        targetAbi  = "";
        targetAddr = address(0);
        options    = _options;
    }

    //========================================
    //
    function setABI(string dabi) public onlyOwner reserve
    {
        _options |= DEBOT_ABI;
        _debotAbi = dabi;
    }

    //========================================
    //
    function setIcon(bytes icon) public onlyOwner reserve
    {
        _icon = icon;
    }

    //========================================
    //
    function onError(uint32 sdkError, uint32 exitCode) public virtual;
    
    //========================================
    //
    function upgrade(TvmCell state) public onlyOwner 
    {
        TvmCell newcode = state.toSlice().loadRef();
        tvm.accept();
        tvm.commit();
        tvm.setcode(newcode);
        tvm.setCurrentCode(newcode);
        onCodeUpgrade();
    }

    function onCodeUpgrade() internal virtual;

    //========================================
    //
    function _sendTransaction(uint32 callbackID, uint32 errorID, address msigAddr, address dest, TvmCell payload, uint128 value) internal pure
    {
        IMsig(msigAddr).sendTransaction{
            abiVer: 2,
            sign: true,
            extMsg: true,
            callbackId: callbackID,
            onErrorId: errorID,
            time: uint32(now),
            expire: 0,
            pubkey: 0x00
        }(dest,
          value,
          true,
          1,
          payload);
    }

    //========================================
    //
}

//================================================================================
//
