pragma ton-solidity >= 0.40;

pragma AbiHeader expire;
pragma AbiHeader pubkey;
pragma AbiHeader time;

interface IRecoverablePubkey {

  function RecoverPubkey ( uint256 oldkey, uint256 newkey) external ;

}
