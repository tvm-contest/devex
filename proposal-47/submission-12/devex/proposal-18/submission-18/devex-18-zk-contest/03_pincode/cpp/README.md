# C++ client of Use case: Recoverable Pubkeys with Pincodes

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
