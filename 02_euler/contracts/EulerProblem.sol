/*
  Implementation of contract EulerProblem
 */

pragma ton-solidity >= 0.32.0;

pragma AbiHeader expire;
pragma AbiHeader pubkey;

import "./IEulerRoot.sol";
import "./IEulerProblem.sol";
import "Blueprint.sol";

contract EulerProblem is IEulerProblem, Blueprint {

  uint64 constant EXN_AUTH_FAILED = 100 ;

  uint32 constant PI_SIZE = 4;

  uint32 static s_problem ;
  address static s_root_contract ;
  mapping( uint256 => uint8 ) g_top10 ;
  uint8 g_ntop ;
  
  // The verification key of ZkSnarks
  bytes g_verifkey ;
  // The circuit itself (compressed with gz, please)
  bytes g_zip_provkey ;

  constructor( bytes verifkey, bytes zip_provkey ) public
  {
    require( msg.sender == s_root_contract );
    g_verifkey = verifkey ;
    g_zip_provkey = zip_provkey ;
  }

  function submit( uint32 problem, bytes proof, uint256 pubkey) public 
  {
    require( s_problem == problem );
    require( msg.value > 0.5 ton );
    (bool verified, ) = _check( proof, pubkey );
    if( verified ){
      if( g_ntop < 10 ){
        optional( uint8 ) opt = g_top10.fetch( pubkey );
        if( ! opt.hasValue() ){
          g_ntop ++;
          g_top10 [ pubkey ] = g_ntop ;
        }
      }
      IEulerRoot( s_root_contract ).
        has_solved{ flag:64 }( s_problem, pubkey );
    }
  }

  function verify(bytes value) public view returns (bool is_correct){
    require( msg.pubkey() == tvm.pubkey() );
    tvm.accept();
    return tvm.vergrth16(value);
  }

  function vergrth16(bytes value) public pure returns (bool is_correct){
    return tvm.vergrth16(value);
  }

  function get() public view returns (
                                      address root_contract ,
                                      uint32 problem ,
                                      bytes verifkey ,
                                      bytes zip_provkey ,
                                      uint256[] top10
                                      )
  {
    root_contract = s_root_contract ;
    problem = s_problem ;
    verifkey = g_verifkey ;
    zip_provkey = g_zip_provkey ;
    top10 = new uint256[]( g_ntop );
    optional( uint256, uint8 ) opt = g_top10.min() ;
    for(uint i = 0; i<g_ntop; i++){
      ( uint256 pubkey, uint8 index ) = opt.get() ;
      top10 [ index-1 ] = pubkey ;
      opt = g_top10.next( pubkey ) ;
    }
  }


  function _check( bytes proof, uint256 newkey) internal view
    returns (bool verified, string blob_str) {

    bytes primary_input = _pi_of_pubkey( newkey );

    verified = false ;

    blob_str = proof;
    blob_str.append( primary_input );
    blob_str.append( g_verifkey );
    verified = tvm.vergrth16( blob_str ) ;
  }

  
  function _pi_of_pubkey( uint256 pubkey )
    internal pure returns ( string primary_input )
  {
    uint32[] temp;
    uint256 x = pubkey ;
    for( uint i = 0 ; i < 8 ; i ++ ){
      temp.push ( uint32( x & 0xffffff7f ) ) ;
      x = x >> 32 ;
    }

    primary_input = encode_little_endian(PI_SIZE,4);
    for(uint i=0;i<PI_SIZE;i++){
      //      primary_input.append(serialize_primary_input(temp[7-i]));
      primary_input.append(
                           uint256_to_bytes(
                                            uint256( temp[7-i]) << 224
                                            ));
    }
  }

  function pi_of_pubkey( uint256 pubkey ) public pure
    returns ( bytes primary_input )
  {
    primary_input = _pi_of_pubkey( pubkey );
  }

  function check( bytes proof, uint256 newkey) public pure
    returns (bool verified, string blob_str) {
    ( verified, blob_str ) = check ( proof, newkey );
  }

}

