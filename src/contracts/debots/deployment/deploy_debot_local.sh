#!/bin/bash
set -e

TEMP_DIR=../temp
CONTRACTS_DIR=../contracts
DEPLOY_PARAMS_FILE=./deploy_nftRoot_params.json
DEBOT_NAME=MintingDebot
NETWORK=http://127.0.0.1


DEPLOYMENT_DIR=./deployment
DEBOT_NAME=MintingDebot

#
# This is TON OS SE giver address, correct it if you use another giver
#
GIVER_ADDRESS=0:841288ed3b55d9cdafa806807f02a0ae0c169aa5edfe88a789a6482429756a94
CRYSTALS_AMOUNT=10000000000

# Check if tonos-cli installed 
tos=tonos-cli
if $tos --version > /dev/null 2>&1; then
    echo "OK $tos installed locally."
else 
    tos=tonos-cli
    if $tos --version > /dev/null 2>&1; then
        echo "OK $tos installed globally."
    else 
        echo "$tos not found globally or in the current directory. Please install it and rerun script."
    fi
fi

function giver {
    $tos --url $NETWORK call --abi local_giver.abi.json $GIVER_ADDRESS \
         sendGrams "{\"dest\":\"$1\",\"amount\":$CRYSTALS_AMOUNT}" 1>/dev/null
}

function get_address {
    echo $(cat $TEMP_DIR/$1.log | grep "Raw address:" | cut -d ' ' -f 3)
}

function genaddr {
    $tos genaddr $CONTRACTS_DIR/$1.tvc $CONTRACTS_DIR/$1.abi.json --genkey $TEMP_DIR/$1.keys.json > $TEMP_DIR/$1.log
}

echo "Step 1. Calculating debot address"
genaddr $DEBOT_NAME
DEBOT_ADDRESS=$(get_address $DEBOT_NAME)

echo "Step 2. Sending $CRYSTALS_AMOUNT tokens to address: $DEBOT_ADDRESS"
giver $DEBOT_ADDRESS

echo "Step 3. Deploying debot"
$tos --url $NETWORK deploy $CONTRACTS_DIR/$DEBOT_NAME.tvc "{}" \
     --sign $TEMP_DIR/$DEBOT_NAME.keys.json \
     --abi $CONTRACTS_DIR/$DEBOT_NAME.abi.json 1>/dev/null

DEBOT_ABI=$(cat $CONTRACTS_DIR/$DEBOT_NAME.abi.json | xxd -ps -c 20000)

$tos --url $NETWORK call $DEBOT_ADDRESS setABI "{\"dabi\":\"$DEBOT_ABI\"}" \
     --sign $TEMP_DIR/$DEBOT_NAME.keys.json --abi $CONTRACTS_DIR/$DEBOT_NAME.abi.json \
     1>/dev/null

echo "Step 4. Getting debot info"
$tos --url $NETWORK run \
     --abi $CONTRACTS_DIR/$DEBOT_NAME.abi.json \
     $DEBOT_ADDRESS getDebotInfo "{}"

echo "Done! Deployed debot with address: $DEBOT_ADDRESS"