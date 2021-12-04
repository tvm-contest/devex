#!/bin/bash
set -e

TEMP_DIR=../temp
CONTRACTS_DIR=../contracts
DEPLOY_PARAMS_FILE=./deploy_nftRoot_params.json

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

function decode {
    $tos decode stateinit $CONTRACTS_DIR/$1.tvc --tvc | tail -n +5 > $TEMP_DIR/$1.decode.json 2>&1
}

echo "Decoding Index"
decode Index

echo "Decoding Data"
decode Data

echo "Done!"