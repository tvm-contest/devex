/*
  Implementation of contract EulerRoot
 */

pragma ton-solidity >= 0.32.0;

pragma AbiHeader expire;
pragma AbiHeader pubkey;

import "./IEulerRoot.sol";
import "EulerProblem.sol";
import "EulerUser.sol";
import "RecoverablePubkey.sol";

contract EulerRoot is IEulerRoot, RecoverablePubkey {

  uint64 constant EXN_AUTH_FAILED = 100 ;

  uint256 g_owner ;
  TvmCell g_problem_code ;
  TvmCell g_user_code ;

  constructor( TvmCell problem_code, TvmCell user_code ) public {
    require( msg.pubkey() == tvm.pubkey(), EXN_AUTH_FAILED );
    tvm.accept();
    g_owner = msg.pubkey() ;
    g_problem_code = problem_code ;
    g_user_code = user_code ;
  }

  function new_problem( uint32 problem, bytes verifkey, bytes zip_provkey )
    public
  {
    require( g_owner == msg.pubkey(), EXN_AUTH_FAILED );
    // TODO
  }

  function new_user( uint256 pubkey ) public
  {
    // TODO
  }
  
  function has_solved( uint32 problem, uint256 pubkey ) public override
  {
    TvmCell stateInit = tvm.buildStateInit({
      contr: EulerProblem ,
      pubkey: tvm.pubkey() ,
      code: g_problem_code ,
      varInit: {
        s_problem: problem ,
        s_root_contract: this
      }
          });
    address addr = address(tvm.hash(stateInit));
    require( addr == msg.sender );
    
    stateInit = tvm.buildStateInit({
      contr: EulerUser ,
      pubkey: pubkey ,
      code: g_user_code ,
      varInit: {
        s_root_contract: this
      }
          });
    addr = address(tvm.hash(stateInit));    
    EulerUser( addr ).has_solved{ value:0, flag: 64 }( problem );
  }

  function recover_pubkey ( uint256 oldkey, uint256 newkey) internal override
  {
    if( oldkey == g_owner ){
      g_owner = newkey;
    }
  }

}

