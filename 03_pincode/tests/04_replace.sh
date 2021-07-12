#!/bin/bash

. ./env.sh

$FT call PubkeyRecovery SetNewPubkey '{ "proof": "%{file:proof.bin.hex}", "newkey": "0x%{account:pubkey:user2}" }' --local

# $FT multisig transfer 1 --from user0 --to PubkeyRecovery SetNewPubkey '{ "proof": "%{file:proof.bin.hex}", "newkey": "0x%{account:pubkey:user1}" }'







