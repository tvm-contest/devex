# Contracts of use case: Euler Problems Contest

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
