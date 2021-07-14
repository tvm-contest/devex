# Use case: Euler Problems Contest

The goal of this use-case is to show how Euler problems could be
submitted on Free TON using zksnarks to prove that a user has a
solution without disclosing it. Each problem contract contains the top
10 of the first users submitting a solution, and each user contract
contains the list of solved problems with time.

## C++ Client Part

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

## Solidity Smart Contracts

The Solidity smart contracts are located in the `contracts/`
directory. They can be built with `make` if `ft` (freeton-wallet) is
installed.

The following smart contracts are defined:

* EulerRoot : it's the central contract of a set of Euler
  problems. The EulerRoot contracts is owned by the organizer, who is
  the only one able to publish new Euler problems.  Its most important
  functions are `new_problem()` to deploy a new problem contract,
  `new_user()` to deploy a user contract (anybody can call it) and
  `submit()` to submit a solution for a problem. `problem_address()`
  and `user_address()` are useful to get the contract address of a
  problem or a user. An event is emitted everytime a problem is solved
  by a user.

* EulerProblem: it's the contract corresponding to a given Euler
  problem. The contract contains the verification key of the problem,
  so that it can check the proofs submitted by users. Since proofs are
  attached to users' pubkeys, other users cannot re-use proofs
  submitted by other users. The EulerProblem contains the top 10 of
  the first users to submit a correct solution. An event is also
  emitted everytime the problem is solved by a user. The contract also
  contains the description of the problem (title, description, url)
  and the information needed to submit solutions (compressed proving
  key and nonce).

* EulerUser: it's the contract corresponding to the pubkey of a
  user. The user can provide a name using the `set_name()` function.
  The `has_solved()` function is called by the EulerRoot contract when
  the user has solved a new problem. The function stores the problem
  and the time of solution in the contract.

For internal messages between these contracts, they either check that
messages are coming from the unique EulerRoot contract, or that they
come from pre-computed addresses à la TIP-3.

## Testing

The `tests/` directory contains a full scenario that can be run either
on a sandbox (local network) or on a public network, with the `ft`
tool installed.

In these tests, `user0` deploys the `EulerRoot` contract (script
`02_deploy.sh`), prepares a problem using `euler-client` (script
`01_prepare.sh`) and deploys the corresponding `EulerProblem` contract
(script `03_new_problem.sh`). `user1` deploys his `EulerUser` contract
(script `04_new_user.sh`) and submit his solution, using the
`euler-client` program and the `submit()` message of EulerRoot (script
`05_submit_user1.sh`). Finally, `user2` also successfully submits his
solution (script `06_submit_user2.sh`) while `user3` fails to replay
the solution of `user2` and cannot generate a proof for a wrong
solution.

