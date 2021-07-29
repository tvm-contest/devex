#!/bin/bash

set -e
set -o pipefail

SafeMultisigWalletABI="~~/TON-Solidity-Compiler/lib/stdlib_sol.tvm/ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.abi.json"
stdlib="~/TON-Solidity-Compiler/lib/stdlib_sol.tvm"
giver=0:841288ed3b55d9cdafa806807f02a0ae0c169aa5edfe88a789a6482429756a94

LOCALNET=http://127.0.0.1
NETWORK=$LOCALNET

function giver {
tonos-cli --url $NETWORK call --abi local_giver.abi.json $giver sendGrams "{\"dest\":\"$1\",\"amount\":20000000000}"
}

if [ -z $1 ]; then

    echo 'USAGE: ./smc-deploy.sh <source file>'
    echo 'EXAMPLE: ./smc-deploy.sh wallet.sol'

else

    contract_name=`basename $1 .sol`
    solc $1
    tvc=`tvm_linker compile $contract_name.code --lib $stdlib | grep 'Saved contract to file' | awk '{print $NF}'`
    echo $tvc
    contract_address=`tonos-cli genaddr $tvc $contract_name.abi.json --genkey $contract_name.keys.json | grep 'Raw address' | awk '{print $NF}'`
    # Change gen key to set key if needed
    echo $contract_address > $contract_name.addr
    giver $contract_address
    tonos-cli --url $NETWORK deploy --abi $contract_name.abi.json --sign $contract_name.keys.json $tvc {}

fi
