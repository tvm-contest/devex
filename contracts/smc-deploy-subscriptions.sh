#!/bin/bash

set -xe
set -o pipefail

giver=0:841288ed3b55d9cdafa806807f02a0ae0c169aa5edfe88a789a6482429756a94

LOCALNET=http://127.0.0.1
NETWORK=$LOCALNET

function giver {
tonos-cli --url $NETWORK call --abi ../local_giver.abi.json $giver sendGrams "{\"dest\":\"$1\",\"amount\":20000000000}"
}

tondev sol compile Wallet.sol
wallet_address=`tonos-cli genaddr Wallet.tvc Wallet.abi.json --genkey Wallet.keys.json | grep 'Raw address' | awk '{print $NF}'`
echo $wallet_address > Wallet.addr
giver $wallet_address
tondev sol compile Subscription.sol
IMAGE=$(base64 -w 0 Subscription.tvc)
tonos-cli --url $NETWORK deploy --abi Wallet.abi.json --sign Wallet.keys.json Wallet.tvc "{\"image\":\"$IMAGE\"}"

# Test account to subscribe
cp Wallet.sol Service.sol
tondev sol compile Service.sol
service_address=`tonos-cli genaddr Service.tvc Service.abi.json --genkey Service.keys.json | grep 'Raw address' | awk '{print $NF}'`
echo $service_address > Service.addr
giver $service_address
IMAGE=$(base64 -w 0 Subscription.tvc)
tonos-cli --url $NETWORK deploy --abi Service.abi.json --sign Service.keys.json Service.tvc "{\"image\":\"$IMAGE\"}"

subscr_address=`tonos-cli genaddr Subscription.tvc Subscription.abi.json --setkey Wallet.keys.json | grep 'Raw address' | awk '{print $NF}'`
echo $subscr_address > Subscription.addr
giver $subscr_address
tonos-cli --url $NETWORK deploy --abi Subscription.abi.json --sign Wallet.keys.json Subscription.tvc "{\"u_wallet\":\"$wallet_address\", \"subscr_to\": \"$service_address\", \"subscr_cost\": \"1000000000\", \"subscr_period\": \"3600\"}"
