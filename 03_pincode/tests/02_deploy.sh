#!/bin/bash

. ./env.sh

# $FT exec -- ../cpp/pincode-client prove toto '%{account:pubkey:user1}'

$FT contract deploy PubkeyRecovery --deployer user0 --credit 100 '{ "verifkey": "%{file:verifkey.bin.hex}", "backup_key": "0x%{account:pubkey:user2}" }' -f




