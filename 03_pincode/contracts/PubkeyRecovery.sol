pragma ton-solidity >= 0.40;

pragma AbiHeader expire;
pragma AbiHeader pubkey;
pragma AbiHeader time;

import "Blueprint.sol";
import "RecoverableMultisigWallet.sol";

contract PubkeyRecovery is Blueprint {

  uint32 constant PI_SIZE = 4;

  // The verification key of ZkSnarks
  bytes m_verifkey ;
  // The new key, used to update multisig wallets
  uint256 m_newkey ;
  // The backup key, can be set up initially
  uint256 m_backup_key ;
  // The circuit itself (compressed with gz, please)
  bytes m_circuit ;

  
  constructor( bytes verifkey, uint256 backup_key ) public
    {
      require( msg.pubkey() == tvm.pubkey() );
      tvm.accept() ;
      m_verifkey = verifkey ;
      m_backup_key = backup_key ;
    }

  function SetCircuit( bytes circuit ) public
  {
    require( msg.sender.value == 0 );
    // pubkey must be either oldkey or newkey
    require( msg.pubkey() == tvm.pubkey() ) ;
    tvm.accept() ;
    m_circuit = circuit ;
  }

  function UpdateBackupKey( uint256 backup_key ) public
  {
    // cannot be called from another contract, so not carrying tokens
    require( msg.sender.value == 0 );
    // pubkey must be either oldkey or newkey
    require( msg.pubkey() == tvm.pubkey() || msg.pubkey() == m_newkey ) ;
    tvm.accept() ;
    m_backup_key = backup_key ;
  }

  function SetNewPubkeyFromBackup() public
  {
    // cannot be called from another contract, so not carrying tokens
    require( msg.sender.value == 0 );
    // only backup owner can activate the backup key
    require( msg.pubkey() == m_backup_key );
    tvm.accept() ;
    m_newkey = m_backup_key ;
  }

  function RecoverPubkey( MultisigWallet c ) public view
  {
    if( m_newkey != 0 ){
      c.RecoverPubkey{ flag: 64 }( tvm.pubkey(), m_newkey ) ;
    }
  }

  function SetNewPubkey( bytes proof, uint256 newkey) public
  {
    (bool verified, ) = _check( proof, newkey );
    if( verified ){
      m_newkey = newkey ;
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
                                      bytes verifkey ,
                                      uint256 newkey ,
                                      uint256 backup_key ,
                                      bytes circuit
                                      )
  {
    verifkey = m_verifkey ;
    newkey = m_newkey ;
    backup_key = m_backup_key ;
    circuit = m_circuit ;
  }


  function _check( bytes proof, uint256 newkey) internal view
    returns (bool verified, string blob_str) {

    bytes primary_input = _pi_of_pubkey( newkey );

    verified = false ;

    blob_str = proof;
    blob_str.append( primary_input );
    blob_str.append( m_verifkey );
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
