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
  uint64 constant EXN_NOT_ENOUGH_VALUE = 101 ;
  
  event ProblemSolved( uint32 problem, uint256 pubkey );

  uint256 g_owner ;
  TvmCell g_problem_code ;
  TvmCell g_user_code ;

  constructor( TvmCell problem_code, TvmCell user_code ) public {
    require( msg.pubkey() == tvm.pubkey(), EXN_AUTH_FAILED );
    require( msg.value >= 2 ton, EXN_NOT_ENOUGH_VALUE );
    tvm.accept();
    g_owner = msg.pubkey() ;
    g_problem_code = problem_code ;
    g_user_code = user_code ;
  }

  function new_problem( uint32 problem,
                        bytes verifkey,
                        bytes zip_provkey,
                        string nonce,
                        string title,
                        string description,
                        string url)
    public view returns ( address addr )
  {
    require( g_owner == msg.pubkey(), EXN_AUTH_FAILED );
    require( address(this).balance > 1 ton, EXN_NOT_ENOUGH_VALUE );
    tvm.accept() ;

    addr = new EulerProblem {
      value: 1 ton,
      pubkey: tvm.pubkey() ,
      code: g_problem_code ,
      varInit: {
        s_problem: problem ,
        s_root_contract: this
      }
    }( verifkey, zip_provkey, nonce, title, description, url );
    
  }

  function new_user( uint256 pubkey ) public view returns ( address addr )
  {
    require( msg.value >= 1 ton, EXN_AUTH_FAILED );
    addr = new EulerUser {
      value: 0.5 ton,
      pubkey: pubkey ,
      code: g_user_code ,
      varInit: {
        s_root_contract: this
      }
    }() ;

  }

  function problem_address( uint32 problem ) public view
    returns ( address addr )
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
    addr = address(tvm.hash(stateInit));
  }

  function user_address( uint256 pubkey ) public view
    returns ( address addr )
  {
    TvmCell stateInit = tvm.buildStateInit({
      contr: EulerUser ,
      pubkey: pubkey ,
      code: g_user_code ,
      varInit: {
        s_root_contract: this
      }
    });
    addr = address(tvm.hash(stateInit));    
  }

  function submit( uint32 problem,
                   bytes proof,
                   uint256 pubkey) public view 
  {
    address addr = problem_address( problem );
    EulerProblem( addr ).submit
      { value:0, flag: 64} ( problem, proof, pubkey );
  }

  
  function update_circuit( uint32 problem,
                           bytes verifkey,
                           bytes zip_provkey,
                           string nonce ) public view
  {
    require( g_owner == msg.pubkey(), EXN_AUTH_FAILED );
    address addr = problem_address( problem );
    EulerProblem( addr ).update_circuit
      { value:0, flag: 64} ( verifkey, zip_provkey, nonce );
  }

  function update_problem( uint32 problem,
                           string title,
                           string description,
                           string url ) public view
  {
    require( g_owner == msg.pubkey(), EXN_AUTH_FAILED );
    address addr = problem_address( problem );
    EulerProblem( addr ).update_problem
      { value:0, flag: 64} ( title, description, url );
  }

  function has_solved( uint32 problem,
                       uint256 pubkey ) public override
  {
    address addr = problem_address( problem ) ;
    require( addr == msg.sender, EXN_AUTH_FAILED );

    emit ProblemSolved( problem, pubkey );
    addr = user_address( pubkey );
    EulerUser( addr ).has_solved{ value:0, flag: 64 }( problem );
  }

  function recover_pubkey ( uint256 oldkey,
                            uint256 newkey) internal override
  {
    if( oldkey == g_owner ){
      g_owner = newkey;
    }
  }

  function get() public view returns
    ( uint256 owner, uint256 problem_code_hash, uint256 user_code_hash )
  {
    owner = g_owner ;
    problem_code_hash = tvm.hash ( g_problem_code );
    user_code_hash = tvm.hash ( g_user_code );
  }

}

