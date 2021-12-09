#!/bin/bash

tcli=""
source ./internal_locator.sh tcli

tvc=../build/DensDebot.tvc
abi=../build/DensDebot.abi.json
dkf=../keys/debot.keys.json

if [[ ! -f "../keys/debot.keys.json" ]]; then
  echo "[!] Debot keys do not exist, I cannot determine address without them"
  exit 1
fi

addr=$($tcli genaddr $tvc $abi --setkey $dkf | grep 'Raw address' | awk '{print $3}')
echo "[!] Debot account address: $addr"

acnf=$($tcli account "$addr" | grep -c 'Account not found' )

if [[ "$acnf" != "0" ]]; then
  echo "!!! The debot was not initialized. Please run deploy_debot.sh"
  exit 2
fi

acty=$($tcli account "$addr" | grep 'acc_type:' | awk '{print $2}')

if [[ "$acty" == "Uninit" ]]; then
  echo "!!! The debot was not initialized. Please run deploy_debot.sh"
  exit 3
fi

echo "Starting debot..."
$tcli debot fetch "$addr"
