# Use case: Recoverable Pubkeys with Pincodes

*To see how to test the code, please go to the Testing section at the end of this README.*

The goal of this use-case is to show how zksnarks can be used to
change the pubkey of a user when he loses his secret key. For that,
the user must create a specific PubkeyRecovery contract associating a
pincode (a passphrase of any reasonable size) to his pubkey. If he
loses his secret key, he can submit a new pubkey in the contract using
a proof of knowledge of his pincode. The new pubkey can then be
propagated to other contracts: we provide such a modified version of
the Surf multisig wallet, allowing custodians to modify their pubkeys,
and the EulerRoot contract of the previous use-case allows to change
his owner's pubkey.

## C++ Client Part

The C++ client is located in the `cpp/` directory, and can be build
with `make` (it will clone a shared version of
`ton-proof-verification-contest` in the top directory for that).
It should generate an executable called `euler-client`.

The `pincode-client` program can be used in 2 ways:

* `./pincode-client prepare PASSPHRASE`, where `PASSPHRASE` is any
  string of reasonable size that the user wants to remember to change
  his pubkey, will generate a proving key (files `provkey.bin` and
  `provkey.bin.hex`) and a verification key (files `verifkey.bin` and
  `verifkey.bin.hex`) for this particular pincode. These files can be
  published online for the user to recover them and use them when he
  loses his secret key (and maybe other files...).

* `./pincode-client prove PASSPHRASE PUBKEY`, where `PUBKEY` is the
  new public key that the user wants to use instead of his old public
  key. The program expects the files `verifkey.bin` and `provkey.bin`
  to be in the same directory. It generates a proof (files `proof.bin`
  and `proof.bin.hex`) to be submitted online, and debugging files
  `primary_input.bin` and `big_proof.bin`. The later file can be used
  directly with the tvm.vergrth16 instruction.

To simplify the circuits, we use only 124 bits of the public key (we
keep only 4 integers of 31 bits from the initial 256 bits). We think
it is enough to prevent attacks, but the circuit could easily be
modified to check even more bits if suitable.

## Solidity Smart Contracts

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

## Testing

The `tests/` directory contains a full scenario that can be run either
on a sandbox (local network) or on a public network, with the `ft`
tool installed.

The `01_prepare.sh` script generates the `privkey.bin` and
`verifkey.bin` files for the given example passphrase for `user0`. The
`02_deploy.sh` script deploys the corresponding `PubkeyRecovery`
contract for `user0`, the `03_get.sh` does some local checking of
contracts, the `04_replace.sh` script calls `pincode-client` with a
new pubkey (the one of `user1`) and the correct passphrase, to
generate a `proof.bin` file, which is then provided to the
`SetFromPincode()` function. `05_update_multisig.sh` deploys
a `RecoverableMultisigWallet` contract with 3 custodians (`user0`,
`user2` and `user3`), calls the `SetPubkeyRecoveryCode()` and then
`RecoverPubkey()` function with the address of the multisig wallet,
and finally display the updated list of custodians. Finally,
`06_update_multisig.sh` does the same, but uses an external call instead
of an internal call for `RecoverPubkey()`.

