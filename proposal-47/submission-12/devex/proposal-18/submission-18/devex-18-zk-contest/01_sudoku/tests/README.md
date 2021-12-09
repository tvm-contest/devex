# Testing

The `tests/` directory contains a full scenario that can be run either
on a sandbox (local network) or on a public network, with the `ft`
tool installed.

The `01_prepare.sh` script generates the `provkey.bin` and
`verifkey.bin` files. The `02_deploy.sh` script deploys the Sudoku
smart contract on behalf of `user0` with an initial instance
corresponding to the file `initial_instance.in`.

The `03_solve_sudoku.sh` script produces a proof that
`initial_solution.in` contains a valid solution to the problem defined
by `initial_instance.in` and submits it to the smart contract.  The
`04_new_instance.sh` script submits a new instance of Sudoku (e.g. a
new problem) to the smart contract. The `05_get.sh` script prints the
state of the contract, to check that the new instance was indeed taken
into account. The `06_submit_false_solution.sh` attempts to create a
proof with a false solution (and fails). The `07_submit_false_proof`
attempts to resubmit the proof from the first instance to the second
instance (and fails).
