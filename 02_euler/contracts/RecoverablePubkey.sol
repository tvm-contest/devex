pragma ton-solidity >= 0.40;

pragma AbiHeader expire;
pragma AbiHeader pubkey;
pragma AbiHeader time;

abstract contract RecoverablePubkey {

  uint8 constant EXN_NOT_INITIALIZED = 180 ;
  
  uint256 constant PUBKEYRECOVERY_CODEHASH =
    0x362d0ed75463bc704053f7e845735cd86c337bf1a315837b238461b94bfd2c35;
  
  // code of PubkeyRecovery smart contract
  TvmCell m_PubkeyRecovery_code ;
  // whether the code of PubkeyRecovery smart contract has been initialized
  bool m_PubkeyRecovery_initialized = false ;
  
  function SetPubkeyRecoveryCode( TvmCell code ) public
  {
    require( tvm.hash( code ) == PUBKEYRECOVERY_CODEHASH );
    m_PubkeyRecovery_code = code ;
    m_PubkeyRecovery_initialized = true ;
  }
  
  /// @dev This function is called by the PubkeyRecovery contract
  /// when the user asks to update this contract. It calls the
  /// 'recover_pubkey' internal function only if the new key is
  /// accepted.
  /// @param oldkey The pubkey to be replaced
  /// @param newkey The pubkey that should replace the old one
  function RecoverPubkey ( uint256 oldkey, uint256 newkey) public
  {
    require( m_PubkeyRecovery_initialized, EXN_NOT_INITIALIZED );
    TvmCell stateInit = tvm.buildStateInit({
      pubkey: newkey,
          code: m_PubkeyRecovery_code
          });
    address addr = address(tvm.hash(stateInit));
    require( addr == msg.sender );
    
    recover_pubkey( oldkey, newkey );
  }
  
  /// @dev This function is called only after verification that the
  /// pincode was correctly entered. It should be defined by the
  /// inheriting contract to enter the business logic of pubkey
  /// replacement
  function recover_pubkey ( uint256 oldkey, uint256 newkey) internal virtual ;
}
