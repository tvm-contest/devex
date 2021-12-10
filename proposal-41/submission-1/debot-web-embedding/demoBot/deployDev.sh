#!/bin/bash
set -e

ROOT_PATH="./demoBot/"
DEBOT_NAME=demoBot
NETWORK="https://net.ton.dev"

function get_address {
    echo $(cat log.log | grep "Raw address:" | cut -d ' ' -f 3)
}

function genaddr {
    tonos-cli genaddr "$ROOT_PATH$1.tvc" "$ROOT_PATH$1.abi.json" --genkey "$ROOT_PATH$1.keys.json" > log.log
}

echo "Genaddr debot"
genaddr $DEBOT_NAME
DEBOT_ADDRESS=$(get_address)
echo $DEBOT_ADDRESS

read -p "...Send coins and press enter to continue..."

DEBOT_ABI=$(cat "$ROOT_PATH$DEBOT_NAME.abi.json" | xxd -ps -c 20000)
ICON=$(cat "$ROOT_PATH"debot.png | xxd -ps -c 20000)

echo "Deploy debot"
tonos-cli --url $NETWORK deploy "$ROOT_PATH$DEBOT_NAME.tvc" "{}" --sign "$ROOT_PATH$DEBOT_NAME.keys.json" --abi "$ROOT_PATH$DEBOT_NAME.abi.json"
tonos-cli --url $NETWORK call $DEBOT_ADDRESS setABI "{\"dabi\":\"$DEBOT_ABI\"}" --sign "$ROOT_PATH$DEBOT_NAME.keys.json" --abi "$ROOT_PATH$DEBOT_NAME.abi.json"
tonos-cli --url $NETWORK call $DEBOT_ADDRESS setIcon "{\"icon\":\"$ICON\"}" --sign "$ROOT_PATH$DEBOT_NAME.keys.json" --abi "$ROOT_PATH$DEBOT_NAME.abi.json"

echo DONE
echo $DEBOT_ADDRESS > address.log
echo debot $NETWORK/$DEBOT_ADDRESS