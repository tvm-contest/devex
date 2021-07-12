#!/bin/bash

. ./env.sh

$FT call PubkeyRecovery get --local
$FT call PubkeyRecovery pi_of_pubkey --local '{ "pubkey": "0x%{account:pubkey:user1}" }'






