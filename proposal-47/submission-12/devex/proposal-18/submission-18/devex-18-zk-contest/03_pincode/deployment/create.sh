#!/bin/bash

. ../tests/env.sh

# $FT switch to nil

export PINCODE_PASSPHRASE='Best Passphrase Ever'

echo ../cpp/pincode-client prepare "'${PINCODE_PASSPHRASE}'" 
../cpp/pincode-client prepare "${PINCODE_PASSPHRASE}" || exit 2

zip provkey.bin.zip provkey.bin || exit 2



$FT contract deploy PubkeyRecovery --sign user0 --deployer user0 --credit 10 '{ "verifkey": "%{file:verifkey.bin.hex}", "zip_provkey": "%{hex:file:provkey.bin.zip}", "backup_key": "0x%{account:pubkey:user2}" }' -f || exit 2

$FT call --local PubkeyRecovery get || exit 2

$FT account info PubkeyRecovery --all
echo "Pincode is: '${PINCODE_PASSPHRASE}'"
