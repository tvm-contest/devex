pragma ton-solidity >= 0.40;

pragma AbiHeader expire;
pragma AbiHeader pubkey;
pragma AbiHeader time;

import "Blueprint.sol";
import "RecoverableMultisigWallet.sol";

contract PubkeyRecovery is Blueprint {

  // The verification key of ZkSnarks
  bytes m_verifkey ;
  // The new key, used to update multisig wallets
  uint256 m_newkey ;
  // The backup key, can be set up initially
  uint256 m_backup_key ;

  constructor( bytes verifkey, uint256 backup_key ) public
    {
      require( msg.pubkey() == tvm.pubkey() );
      tvm.accept() ;
      m_verifkey = verifkey ;
      m_backup_key = backup_key ;
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
    bool verified = false ;
    // TODO verify proof + newkey
    proof = proof ;

    if( verified ){
      m_newkey = newkey ;
    }
  }

  function verify(bytes value) public view returns (bool is_correct){
    require( msg.pubkey() == tvm.pubkey() );
    tvm.accept();
    return tvm.vergrth16(value);
  }

  function check(bytes value) public pure returns (bool is_correct){
    return tvm.vergrth16(value);
  }

}
