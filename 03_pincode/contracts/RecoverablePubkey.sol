pragma ton-solidity >= 0.40;

pragma AbiHeader expire;
pragma AbiHeader pubkey;
pragma AbiHeader time;

abstract contract RecoverablePubkey {

    uint256 constant PUBKEYRECOVERY_CODEHASH = 0x362d0ed75463bc704053f7e845735cd86c337bf1a315837b238461b94bfd2c35;
    // code of PubkeyRecovery smart contract
    TvmCell m_PubkeyRecovery_code ;


    function SetPubkeyRecoveryCode( TvmCell code ) public
    {
      require( tvm.hash( code ) == PUBKEYRECOVERY_CODEHASH );
      m_PubkeyRecovery_code = code ;
    }

    function RecoverPubkey ( uint256 oldkey, uint256 newkey) public
    {
      TvmCell stateInit = tvm.buildStateInit({
            pubkey: newkey,
            code: m_PubkeyRecovery_code
            });
      address addr = address(tvm.hash(stateInit));
      require( addr == msg.sender );

      recover_pubkey( oldkey, newkey );
    }

    function recover_pubkey ( uint256 oldkey, uint256 newkey) internal virtual ;
}
