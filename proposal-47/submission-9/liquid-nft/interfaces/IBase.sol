pragma ton-solidity >=0.52.0;
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
    function _checkSenderAddress(address addr) internal pure inline returns (bool) {    return (msg.isInternal && addr == msg.sender   && addr != addressZero);    }
    function _checkSenderPubkey (uint256 pkey) internal pure inline returns (bool) {    return (msg.isExternal && pkey == msg.pubkey() && pkey != 0);              }

    function _reserve() internal inline view {    tvm.rawReserve(gasToValue(_gasReserve, address(this).wid), 0);    }
    modifier  reserve     {    if(msg.isInternal){ _reserve(); }    _;                                       }
    modifier  returnChange{                   _;  if(msg.isInternal){ msg.sender.transfer(0, true, 128); }   }
}

//================================================================================
//
