# Tests of use case: Recoverable Pubkeys with Pincodes

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

