#!/bin/bash

. ./env.sh


$FT exec -- ../cpp/euler-client prove ${EULER_PROBLEM} ${EULER_SOLUTION} '%{account:pubkey:user2}' || exit 2



$FT multisig transfer 1 --from user2 --to EulerRoot submit '{ "problem": %{env:EULER_PROBLEM}, "proof": "%{file:proof.bin.hex}", "pubkey": "0x%{account:pubkey:user2}" }' --wait || exit 2


$FT call --local euler_problem get    
