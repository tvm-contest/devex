#!/bin/bash

. ./env.sh

$FT call PubkeyRecovery get --local
$FT call PubkeyRecovery PrimaryInputOfPubkey --local '{ "pubkey": "0x%{account:pubkey:user1}" }'






