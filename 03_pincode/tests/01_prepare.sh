#!/bin/bash

. ./env.sh

$FT exec -- ../cpp/pincode-client prepare ${PINCODE_PASSPHRASE} || exit 2

zip provkey.bin.zip provkey.bin || exit 2


# $FT contract deploy PubkeyRecovery --deployer user0 --credit 100 '{ "verifkey": "%{file:"'


