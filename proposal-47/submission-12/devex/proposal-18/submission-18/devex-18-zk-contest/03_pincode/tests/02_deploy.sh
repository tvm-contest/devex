#!/bin/bash

. ./env.sh

$FT contract deploy PubkeyRecovery --sign user0 --deployer user0 --credit 100 '{ "verifkey": "%{file:verifkey.bin.hex}", "zip_provkey": "%{hex:file:provkey.bin.zip}", "backup_key": "0x%{account:pubkey:user2}" }' -f




