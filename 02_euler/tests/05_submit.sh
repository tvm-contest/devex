#!/bin/bash

. ./env.sh


$FT exec -- ../cpp/euler-client prove ${EULER_PROBLEM} ${EULER_SOLUTION} '%{account:pubkey:user1}' || exit 2



$FT multisig transfer 1 --from user1 --to EulerRoot submit '{ "problem": %{env:EULER_PROBLEM}, "proof": "%{file:proof.bin.hex}", "pubkey": "0x%{account:pubkey:user1}" }' --wait || exit 2









