pragma ton-solidity >= 0.40;

pragma ignoreIntOverflow;
pragma AbiHeader expire;
pragma AbiHeader pubkey;
pragma AbiHeader time;

import "RecoverablePubkey.sol.gen";
import "SetcodeMultisigWallet2.sol";


contract RecoverableMultisigWallet is
  MultisigWallet, RecoverablePubkey {

    uint8 constant EXN_WRONG_NEWKEY = 123 ;

    constructor(uint256[] owners, uint8 reqConfirms)
      MultisigWallet( owners, reqConfirms) public {
    }


    /// @dev This function is used by RecoverablePubkey for the business
    /// logic when a pubkey replacement has been triggered and verified.
    /// Here, it verifies that the oldkey is an existing custodian, that
    /// the newkey is not an existing custodian, and replace the oldkey
    /// by the newkey for the same index.
    function recover_pubkey ( uint256 oldkey, uint256 newkey) internal override
    {
      uint8 index = _findCustodian( oldkey );
      optional(uint8) opt = m_custodians.fetch( newkey );
      require( ! opt.hasValue() , EXN_WRONG_NEWKEY );

      delete m_custodians[ oldkey ];
      m_custodians[ newkey ] = index ;
    }
}
