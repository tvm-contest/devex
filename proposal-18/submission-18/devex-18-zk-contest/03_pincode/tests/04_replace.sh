#!/bin/bash

. ./env.sh


cmd ../cpp/pincode-client prove "${PINCODE_PASSPHRASE}" $($FT output '%{account:pubkey:user1}') || exit 2


$FT call --local PubkeyRecovery Check '{ "proof": "%{file:proof.bin.hex}", "newkey": "0x%{account:pubkey:user1}" }' || exit 2



$FT multisig transfer 1 --from user1 --to PubkeyRecovery SetFromPincode '{ "proof": "%{file:proof.bin.hex}", "newkey": "0x%{account:pubkey:user1}" }' --wait || exit 2

$FT call --local PubkeyRecovery get






