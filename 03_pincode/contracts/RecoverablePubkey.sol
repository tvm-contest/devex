pragma ton-solidity >= 0.40;

pragma AbiHeader expire;
pragma AbiHeader pubkey;
pragma AbiHeader time;

import "IRecoverablePubkey.sol";

abstract contract RecoverablePubkey is IRecoverablePubkey {

  uint8 constant EXN_NOT_INITIALIZED = 180 ;
  uint8 constant EXN_ALREADY_INITIALIZED = 181 ;
  uint8 constant EXN_WRONG_CODEHASH = 182 ;
  uint8 constant EXN_WRONG_SENDER = 183 ;

  uint256 constant PUBKEYRECOVERY_CODEHASH =
    0x%{get-code-hash:contract:tvc:PubkeyRecovery};

  // code of PubkeyRecovery smart contract
  TvmCell m_PubkeyRecovery_code ;
  // whether the code of PubkeyRecovery smart contract has been initialized
  bool m_PubkeyRecovery_initialized = false ;


  /// @dev Define the code of the PubkeyRecovery contract that will be allowed
  /// to update public keys here
  function SetPubkeyRecoveryCode( TvmCell code ) public
  {
    require( !m_PubkeyRecovery_initialized, EXN_ALREADY_INITIALIZED );
    require( tvm.hash( code ) == PUBKEYRECOVERY_CODEHASH, EXN_WRONG_CODEHASH );
    tvm.accept();
    m_PubkeyRecovery_code = code ;
    m_PubkeyRecovery_initialized = true ;
  }

  /// @dev This function is called by the PubkeyRecovery contract
  /// when the user asks to update this contract. It calls the
  /// 'recover_pubkey' internal function only if the new key is
  /// accepted.
  /// @param oldkey The pubkey to be replaced
  /// @param newkey The pubkey that should replace the old one
  function RecoverPubkey ( uint256 oldkey, uint256 newkey) public override
  {
    require( m_PubkeyRecovery_initialized, EXN_NOT_INITIALIZED );
    TvmCell stateInit = tvm.buildStateInit({
      pubkey: oldkey,
      code: m_PubkeyRecovery_code
    });
    address addr = address(tvm.hash(stateInit));
    require( addr == msg.sender, EXN_WRONG_SENDER );

    recover_pubkey( oldkey, newkey );
  }

  /// @dev This function is called only after verification that the
  /// pincode was correctly entered. It should be defined by the
  /// inheriting contract to enter the business logic of pubkey
  /// replacement
  function recover_pubkey ( uint256 oldkey, uint256 newkey) internal virtual ;
}
