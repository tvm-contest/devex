# Deployment of use case: Euler Problems Contest

This directory contains a deployment of an Euler contest with 2
problems on the testnet network deployed by the Nil Foundation at
https://net.freeton.nil.foundation/

The EulerRoot contract is deployed at:

```
0:623dd0eb5a849f492d19276435f87d9ec210fa561e3b872c3948793560925aeb
```

It can be tested with:

```
tonos-cli --url https://net.freeton.nil.foundation/ run 0:623dd0eb5a849f492d19276435f87d9ec210fa561e3b872c3948793560925aeb get {} --abi ../contracts/EulerRoot.abi.json
```

## Problem 1

Problem 1 of Euler is deployed at:

```
0:f025ac5f00cd2b34ed7ecb576fc0f18e597ff9dc2e1f568acb7db58c27d0a9f2
```

and can be tested with:

```
tonos-cli --url https://net.freeton.nil.foundation/ run 0:f025ac5f00cd2b34ed7ecb576fc0f18e597ff9dc2e1f568acb7db58c27d0a9f2 get {} --abi ../contracts/EulerProblem.abi.json
```

The 'provkey.bin' and 'verifkey.bin' files are also available for
simplicity of use in the `problem1/` directory. The nonce is 487499.

The `problem1/create.sh` file contains the solution in variable
`EULER_SOLUTION`.

## Problem 2

Problem 2 of Euler is deployed at:

```
0:d52ad5a1f2bcfdad5a3efe8c35e834aa2efe684d9be4d088e1d4de0cd3a231a9
```

and can be tested with:

```
tonos-cli --url https://net.freeton.nil.foundation/ run 0:d52ad5a1f2bcfdad5a3efe8c35e834aa2efe684d9be4d088e1d4de0cd3a231a9 get {} --abi ../contracts/EulerProblem.abi.json
```

The 'provkey.bin' and 'verifkey.bin' files are also available for
simplicity of use in the `problem2/` directory. The nonce is 1039.

The `problem2/create.sh` file contains the solution in variable
`EULER_SOLUTION`.

## Testing

To test, the simplest way is to test the solution locally:

In `problem1`, run:

```
../../cpp/euler-client prove 1 487499 PROPOSED_SOLUTION PUBKEY_IN_HEX
```

If a file 'proof.bin' is generated, it means that the solution was correct.

A new user should:

* Use the 'new_user' function of the EulerRoot contract to create a
  EulerUser contract for himself (he should send something like ~3-5 ton
  for later use of this contract)

* Use the 'submit' function of EulerUser to submit solutions to problems
  for this user.
  
