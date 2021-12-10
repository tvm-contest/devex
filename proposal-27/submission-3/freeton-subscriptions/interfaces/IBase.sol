pragma ton-solidity >= 0.47.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

//================================================================================
//
abstract contract IBase
{
    //========================================
    // Constants
    address constant addressZero = address.makeAddrStd(0, 0);
    
    //========================================
    // Variables
    uint128 _gasReserve = 10000;

    //========================================
    // Modifiers
    function _reserve() internal inline view {    tvm.rawReserve(gasToValue(_gasReserve, address(this).wid), 0);    }
    modifier  reserve     {    _reserve();    _;                                       }
    modifier  returnChange{                   _; msg.sender.transfer(0, true, 128);    }
}

//================================================================================
//
