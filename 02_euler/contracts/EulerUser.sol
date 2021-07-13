/*
  Implementation of contract EulerUser
 */

pragma ton-solidity >= 0.32.0;

pragma AbiHeader expire;
pragma AbiHeader pubkey;

import "./IEulerUser.sol";

contract EulerUser is IEulerUser {

  uint64 constant EXN_AUTH_FAILED = 100 ;

  address static s_root_contract ;
  string g_name ;
  uint32[] g_solved ;

  constructor( string name ) public {
    require( msg.sender == s_root_contract, EXN_AUTH_FAILED );
    g_name = name ;
  }

  function has_solved( uint32 problem ) public
  {
    require( msg.sender == s_root_contract, EXN_AUTH_FAILED );
    g_solved.push( problem );
    s_root_contract.transfer({ value: 0, flag: 64 });
  }

  function get() public view returns (
                                      string name,
                                      uint32[] solved
                                      )
  {
    name = g_name ;
    solved = g_solved ;
  }

}

