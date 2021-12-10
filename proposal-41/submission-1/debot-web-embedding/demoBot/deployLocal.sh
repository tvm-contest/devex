#!/bin/bash
set -e

ROOT_PATH="./demoBot/"
DEBOT_NAME=demoBot
GIVER=0:841288ed3b55d9cdafa806807f02a0ae0c169aa5edfe88a789a6482429756a94
NETWORK="http://127.0.0.1:7777"

function giver {
    tonos-cli --url $NETWORK call --abi "$ROOT_PATH/local_giver.abi.json" $GIVER sendGrams "{\"dest\":\"$1\",\"amount\":10000000000}"
}

function get_address {
    echo $(cat log.log | grep "Raw address:" | cut -d ' ' -f 3)
}

function genaddr {
    tonos-cli genaddr "$ROOT_PATH$1.tvc" "$ROOT_PATH$1.abi.json" --genkey "$ROOT_PATH$1.keys.json" > log.log
}

echo GENADDR DEBOT
genaddr $DEBOT_NAME
DEBOT_ADDRESS=$(get_address)

echo ASK GIVER
giver $DEBOT_ADDRESS
DEBOT_ABI=$(cat "$ROOT_PATH$DEBOT_NAME.abi.json" | xxd -ps -c 20000)
ICON=$(cat "$ROOT_PATH"debot.png | xxd -ps -c 20000)

echo DEPLOY DEBOT $DEBOT_ADDRESS
tonos-cli --url $NETWORK deploy "$ROOT_PATH$DEBOT_NAME.tvc" "{}" --sign "$ROOT_PATH$DEBOT_NAME.keys.json" --abi "$ROOT_PATH$DEBOT_NAME.abi.json"
tonos-cli --url $NETWORK call $DEBOT_ADDRESS setABI "{\"dabi\":\"$DEBOT_ABI\"}" --sign "$ROOT_PATH$DEBOT_NAME.keys.json" --abi "$ROOT_PATH$DEBOT_NAME.abi.json"
tonos-cli --url $NETWORK call $DEBOT_ADDRESS setIcon "{\"icon\":\"$ICON\"}" --sign "$ROOT_PATH$DEBOT_NAME.keys.json" --abi "$ROOT_PATH$DEBOT_NAME.abi.json"

echo DONE
echo $DEBOT_ADDRESS > address.log
echo debot $NETWORK/$DEBOT_ADDRESS
