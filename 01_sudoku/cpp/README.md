# C++ Client Part

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
