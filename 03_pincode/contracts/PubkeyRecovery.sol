pragma ton-solidity >= 0.40;

pragma AbiHeader expire;
pragma AbiHeader pubkey;
pragma AbiHeader time;

import "Blueprint.sol";
import "IRecoverablePubkey.sol";


/* 
   This is the main contract: it contains the blueprint and can check
   that the user knows the passphrase (pincode) before setting a new
   public key. Once a new public key has been set, it can be
   propagated to other contracts.

   Initialization:
   1) the user calls the pincode-client C++ program to create his passphrase.
    It generates a provkey.bin and verifkey.bin. The provkey.bin should
    be compressed before the deployment (zip, gzip, etc.)
   2) the user deploys the contract

   Later, when the user has lost his secret key:
   1) the user creates a new secret key
   2) the user downloads the provkey.bin (compressed) and verifkey.bin from
    the smart contract (using the 'get' method)
   3) the user calls the pincode-client program to enter his passphrase and
    the new public key. It generates a 'proof.bin' file.
   4) the user calls the Check get-method to verify the proof he received
   5) the user calls the SetFromPincode function to set the new key as
     a replacement for the old key
   
   Now, for every contract that inherits from RecoverablePubkey, the 
   user can call 'RecoverPubkey' with the contract address.

 */
contract PubkeyRecovery is Blueprint {

  uint8 constant EXN_AUTH_FAILED = 100 ;
  uint8 constant EXN_NEWKEY_NOT_SET = 101 ;
  uint8 constant EXN_WRONG_PROOF = 102 ;
  
  // The size of primary input in this contract
  uint32 constant PRIMARY_INPUT_SIZE = 4;

  // The verification key of ZkSnarks
  bytes m_verifkey ;
  // The new key, used to update multisig wallets
  uint256 m_newkey ;
  // The backup key, can be set up initially
  uint256 m_backup_key ;
  // The circuit itself (compressed with zip, please)
  bytes m_zip_provkey ;

  /// @dev Constructor of the contract
  /// @param verifkey : the verification key, from the 'verifkey.bin' file
  /// @param zip_provkey : the proving key, from the 'provkey.bin' file
  /// @param backup_key : a backup key can also be used to set the new key
  ///   instead of using the passphrase
  constructor( bytes verifkey,
               bytes zip_provkey,
               uint256 backup_key ) public
    {
      require( msg.pubkey() == tvm.pubkey(), EXN_AUTH_FAILED );
      tvm.accept() ;
      m_verifkey = verifkey ;
      m_backup_key = backup_key ;
      m_zip_provkey = zip_provkey ;
    }

  function UpdatePincode( bytes verifkey, bytes zip_provkey ) public
  {
    require( msg.sender.value == 0, EXN_AUTH_FAILED );
    require( msg.pubkey() == tvm.pubkey() || msg.pubkey() == m_newkey,
             EXN_AUTH_FAILED ) ;
    tvm.accept() ;
    m_verifkey = verifkey ;
    m_zip_provkey = zip_provkey ;
  }

  function UpdateBackupKey( uint256 backup_key ) public
  {
    // cannot be called from another contract, so not carrying tokens
    require( msg.sender.value == 0, EXN_AUTH_FAILED );
    // pubkey must be either oldkey or newkey
    require( msg.pubkey() == tvm.pubkey() || msg.pubkey() == m_newkey,
             EXN_AUTH_FAILED ) ;
    tvm.accept() ;
    m_backup_key = backup_key ;
  }

  function SetFromBackupKey() public
  {
    // cannot be called from another contract, so not carrying tokens
    require( msg.sender.value == 0, EXN_AUTH_FAILED );
    // only backup owner can activate the backup key
    require( msg.pubkey() == m_backup_key, EXN_AUTH_FAILED );
    tvm.accept() ;
    m_newkey = m_backup_key ;
  }

  function SetFromPincode( bytes proof, uint256 newkey) public
  {
    (bool verified, ) = Check( proof, newkey );
    require ( verified, EXN_WRONG_PROOF ) ;
    m_newkey = newkey ;
  }

  function RecoverPubkey( IRecoverablePubkey addr ) public view
  {
    require( m_newkey != 0, EXN_NEWKEY_NOT_SET );
    addr.RecoverPubkey{ flag: 64 }( tvm.pubkey(), m_newkey ) ;
  }

  /// @dev checks a proof and pubkey with the verification key
  /// provided for the problem
  function Check( bytes proof, uint256 newkey) public view
    returns (bool verified, string blob_str) {

    bytes primary_input = PrimaryInputOfPubkey( newkey );

    verified = false ;

    blob_str = proof;
    blob_str.append( primary_input );
    blob_str.append( m_verifkey );
    verified = tvm.vergrth16( blob_str ) ;
  }

  /// @dev translates a pubkey into primary_input. In this version, we
  /// use only 124 bits from the pubkey, stored in 4 input variables
  /// of 31 bits.
  function PrimaryInputOfPubkey( uint256 pubkey )
    public pure returns ( string primary_input )
  {
    uint32[] temp;
    uint256 x = pubkey ;
    for( uint i = 0 ; i < 8 ; i ++ ){
      temp.push ( uint32( x & 0xffffff7f ) ) ;
      x = x >> 32 ;
    }

    primary_input = encode_little_endian(PRIMARY_INPUT_SIZE,4);
    for(uint i=0;i<PRIMARY_INPUT_SIZE;i++){
      primary_input.append(
                           uint256_to_bytes(
                                            uint256( temp[7-i]) << 224
                                            ));
    }
  }


  function verify(bytes value) public view returns (bool is_correct){
    require( msg.pubkey() == tvm.pubkey(), EXN_AUTH_FAILED );
    tvm.accept();
    return tvm.vergrth16(value);
  }

  function vergrth16(bytes value) public pure returns (bool is_correct){
    return tvm.vergrth16(value);
  }

  function get() public view returns (
                                      bytes verifkey ,
                                      bytes zip_provkey,
                                      uint256 backup_key ,
                                      uint256 oldkey ,
                                      uint256 newkey 
                                      )
  {
    verifkey = m_verifkey ;
    newkey = m_newkey ;
    backup_key = m_backup_key ;
    zip_provkey = m_zip_provkey ;
    oldkey = tvm.pubkey() ;
  }

  
}
