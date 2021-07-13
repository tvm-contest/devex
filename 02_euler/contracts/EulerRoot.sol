/*
  Implementation of contract EulerRoot
 */

pragma ton-solidity >= 0.32.0;

pragma AbiHeader expire;
pragma AbiHeader pubkey;

import "./IEulerRoot.sol";

contract EulerRoot is IEulerRoot {

  // 100 - message sender is not a custodian;
  uint64 constant EXN_AUTH_FAILED = 100 ;

  uint8 g_nvals ;                      // required number of ...
  mapping(uint256 => uint8) g_vals ;   // pubkey -> value_index

  constructor( ) public {
    require( msg.pubkey() == tvm.pubkey(), EXN_AUTH_FAILED );
    tvm.accept();
    // TODO
    g_vals[ 0 ] = 1;
  }

  function has_solved( uint32 problem, uint256 pubkey ) public override
  {
    // TODO
  }
  
}

