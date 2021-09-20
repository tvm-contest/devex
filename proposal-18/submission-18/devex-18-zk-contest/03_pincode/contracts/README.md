# Solidity contracts of Use case: Recoverable Pubkeys with Pincodes

The Solidity smart contracts are located in the `contracts/`
directory. They can be built with `make` if `ft` (freeton-wallet) is
installed.

The following smart contracts are defined:

* PubkeyRecovery: this contract is the central part. There is only one
  such contract address per pubkey. The owner of the pubkey should
  create it and initialize it with a verification key before being
  able -- later -- to use to it to change his pubkey in other
  contracts. This contract allows the owner to change the pincode with
  `UpdatePincode()`, to set his new pubkey using `SetFromPincode()`
  and to propagate the new pubkey to another contract using the
  `RecoverPubkey()` function. The owner can also change his pubkey in
  another contract without setting the new pubkey definitively using
  the `RecoverFromPincode()` function. The `RecoverPubkey()` function
  calls the `RecoverPubkey()` function of the target contract,
  providing the old pubkey and the new pubkey. The target contract
  authentifies by PubkeyRecovery contract by its address à la TIP-3,
  and can do the business logic to replace the old key by the new key.
  The PubkeyRecovery contract also defines a mechanism with a backup
  key, but this mechanism requires to create the backup key before
  losing the secret key, with the risk of losing both secret keys.

* RecoverablePubkey: this abstract contract should be inherited by any
  contract wanting to benefit from the PubkeyRecovery. It defines a
  function `SetPubkeyRecoveryCode()` that should be called first to
  define the code of the PubkeyRecovery contract. This function can be
  called by anobody as long as provided code has the expected code
  hash.  Then, the function `RecoverablePubkey()` can be called by any
  `PubkeyRecovery` contract to replace an old pubkey by a new
  pubkey. The inheriting contract should override the internal
  `recover_pubkey()` function that is called to execute the business
  logic specific to the contract (i.e. changing a custodian key for a
  multisig, changing the owner for an owned contract, etc.)

* SetcodeMultisigWallet2: this contract is just an update of the Surf
  wallet to be able to compile it with recent versions of the Solidity
  compiler. It contains no other modification.

* RecoverableMultisigWallet: this contract is a modified version of
  SetcodeMultisigWallet2 multisig wallet, inheriting from
  `RecoverablePubkey`. The `recover_pubkey()` internal function will
  (1) check that the old key is an existing custodian of the multisig,
  (2) check that the new key is not already an existing custodian of
  the multisig, and (3) replace the old custodian by the new custodian
  for the same index.
