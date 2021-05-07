#!/bin/bash

# MSA=0:16727aa2069d16b632d596ea411647c32a176cb3bc970c72080d9a0647e9eebd
DST=$1
VAL=$2
NGR=$(( VAL*1000000000 ))
PL=$3

# cd box || exit

MSA=$(tonos-cli genaddr ../box/SafeMultisigWallet.tvc ../box/SafeMultisigWallet.abi.json --setkey ../keys/box.keys.json | grep 'Raw address' | awk '{print $3}')
tonos-cli call "$MSA" submitTransaction \
  "{\"dest\":\"$DST\",\"value\":$NGR,\"bounce\":false,\"allBalance\":false,\"payload\":\"$PL\"}" \
  --abi ../box/SafeMultisigWallet.abi.json --sign ../keys/box.keys.json
