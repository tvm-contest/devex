# C++ code for Use case: Euler Problems Contest

The C++ client is located in the `cpp/` directory, and can be build
with `make` (it will clone a shared version of
`ton-proof-verification-contest` in the top directory for that).
It should generate an executable called `euler-client`.

The `euler-client` program can be used in 2 ways:

* `./euler-client prepare PROBLEM NONCE SOLUTION`, where `PROBLEM` is
  a problem number, `NONCE` is an arbitrary number different for every
  problem, and `SOLUTION` is the numeric solution, will generate a
  proving key (files `provkey.bin` and `provkey.bin.hex`) and a
  verification key (files `verifkey.bin` and `verifkey.bin.hex`) for
  the problem and its solution. These files can be published for users
  to propose submissions and to verify them.

* `./euler-client prove PROBLEM NONCE SUBMISSION PUBKEY`, where
  `SUBMISSION` is the numeric solution proposed by the user and
  `PUBKEY` is his own public key (to prevent other users from
  submitting the same solution). The program expects the files
  `verifkey.bin` and `provkey.bin` to be in the same directory. It
  generates a proof (files `proof.bin` and `proof.bin.hex`) to be
  submitted online, and debugging files `primary_input.bin` and
  `big_proof.bin`. The later file can be used directly with the
  tvm.vergrth16 instruction.

To prevent users from easily brute-forcing the numeric solutions, we
added a simple proof of work of about 20 seconds. The proof of work is
based on 1,000,000 iterations of sha256 over the concatenation of the
problem number, the nonce and the solution. Since a random nonce
included in the hash, the proof-of-work cannot be done before the new
problem has been submitted and the corresponding new nonce published.
