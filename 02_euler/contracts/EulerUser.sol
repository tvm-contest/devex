/*
  Implementation of contract EulerUser
 */

pragma ton-solidity >= 0.32.0;

pragma AbiHeader expire;
pragma AbiHeader pubkey;

import "./IEulerUser.sol";

contract EulerUser is IEulerUser {

  uint64 constant EXN_AUTH_FAILED = 100 ;

  // the address of the associated EulerRoot contract
  address static s_root_contract ;
  // some name information for this user
  string g_name ;
  // all the problems that this user has solved, with the corresponding time
  mapping(uint32 => uint64) g_solved ;

  /// @dev constructor can be called by anybody since it contains no
  /// information
  constructor() public {
    tvm.accept() ;
  }

  /// @dev associate some naming information with this pubkey. Only
  /// the owner of the pubkey can set this information
  function set_name( string name ) public
  {
    require( tvm.pubkey() == msg.pubkey(), EXN_AUTH_FAILED );
    tvm.accept();
    g_name = name ;
  }


  /// @dev This function is called by EulerRoot contract when the user
  /// successfully submitted a solution to a problem. The problem is
  /// recorded in a mapping, with the first time it was solved by this
  /// user.
  /// @param problem: the number of the solved problem
  function has_solved( uint32 problem ) public
  {
    require( msg.sender == s_root_contract, EXN_AUTH_FAILED );
    optional(uint64) opt = g_solved.fetch( problem );
    if( ! opt.hasValue() ){
      g_solved[ problem ] = now;
    }
    s_root_contract.transfer({ value: 0, flag: 64 });
  }

  struct Problem {
    uint32 problem ;
    uint64 time ;
  }

  /// @dev get-method to return all information on this user
  function get() public view returns (
                                      string name,
                                      Problem[] solved
                                      )
  {
    name = g_name ;
    optional(uint32, uint64) opt = g_solved.min();
    while( opt.hasValue() ){
      (uint32 problem, uint64 time) = opt.get();
      solved.push( Problem(problem, time) );
      opt = g_solved.next( problem );
    }
  }

}

