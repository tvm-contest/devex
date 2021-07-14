# Use case: Sudoku grid

*To see how to test the code, please go to the Testing section at the end of this README.*

The goal of this use case is to show how one can prove on the FreeTON
blockchain that they have solved a Sudoku grid, without revealing any
information about their particular solution.

For technical reasons independent from our will (as explained in
further detail in our submission), we had to restrain to 4x4 Sudoku
grids, which makes this more of a proof-of-concept than a real
application. However, the code for a 9x9 (or indeed, n^2 by n^2 in the
general case) is written and can be deployed as soon as a bug we had
with the contest library's marshalling functions is resolved.

## C++ Client Part

The C++ client is located in the `cpp/` directory, and can be built
with `make` (it will clone a shared version of
`ton-proof-verification-contest` in the top directory for that).
It should generate an executable called `sudoku-client`.

The `sudoku-client` program can be used in 2 ways:

* `./sudoku-client --sudoku-generate-keys` will generate a proving key
  (files `provkey.bin` and `provkey.bin.hex`) and a verification key
  (files `verifkey.bin` and `verifkey.bin.hex`) corresponding to the
  4x4 Sudoku grid. These keys are valid for *all* possible valid
  Sudoku grids, not just for a specific instance. These files can be
  published for users to propose submissions and to verify them.

* `./sudoku-client --sudoku-generate-proof --instance instance.in
  --solution solution.in` will generate a proof that `solution.in` is
  a valid solution to the instance `instance.in` (if that is the
  case). An instance file looks like

	```
	0000
	0000
	0000
	0001
	```
  (where the zeroes are values to be determined by the player) and a corresponding solution looks like
	```
	1234
	3412
	2143
	4321
	```

## Solidity smart contracts

The Solidity smart contract is located in the `contracts/`
directory. It can be built with `make` if `ft` (freeton-wallet) is
installed.

The only contract for this use case is the Sudoku contract. Only the
deployer's public key is allowed to submit new Sudoku instances. Its
constructor defines an initial instance and the verification key
(recall that in this case the proving key is not included in the smart
contract due to its size). The main function `submit` takes as input a
proof and returns a boolean stating its correctness. The local
function `pi_from_instance` encodes the primary input given the
current instance, but does not store it anywhere. The
`submit_instance` allows the owner to add a new challenge at any time.

## Testing

The `tests/` directory contains a full scenario that can be run either
on a sandbox (local network) or on a public network, with the `ft`
tool installed.

The `01_prepare.sh` script generates the `privkey.bin` and
`verifkey.bin` files. The `02_deploy.sh` script deploys the Sudoku
smart contract on behalf of `user0` with an initial instance
corresponding to the file `initial_instance.in`.

TODO
