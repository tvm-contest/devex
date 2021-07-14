#!/bin/bash

. ./env.sh

cmd ../cpp/euler-client prove ${EULER_PROBLEM} ${EULER_NONCE} ${EULER_SOLUTION} $($FT output '%{account:pubkey:user1}') || exit 2



$FT multisig transfer 1 --from user1 --to EulerRoot submit '{ "problem": %{env:EULER_PROBLEM}, "proof": "%{file:proof.bin.hex}", "pubkey": "0x%{account:pubkey:user1}" }' --wait || exit 2

$FT call --local euler_user get    
$FT call --local euler_problem get    
