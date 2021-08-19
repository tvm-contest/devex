
#!/bin/bash
set -xe

for i in SubsMan deployerDebot Subscription serviceDebot SubscriptionService SubscriptionIndex; do
	tondev sol compile $i.sol;
done

tos=tonos-cli

DEBOT_NAME=SubsMan
DEBOT_CLIENT=deployerDebot
giver=0:841288ed3b55d9cdafa806807f02a0ae0c169aa5edfe88a789a6482429756a94
function giver {
$tos --url $NETWORK call --abi ../local_giver.abi.json $giver sendGrams "{\"dest\":\"$1\",\"amount\":20000000000}"
}
function get_address {
echo $(cat log.log | grep "Raw address:" | cut -d ' ' -f 3)
}
function genaddrw {
$tos genaddr $1.tvc $1.abi.json --setkey Service.keys.json > log.log
}
function genaddr {
$tos genaddr $1.tvc $1.abi.json --setkey $1.keys.json > log.log
}
function genaddrgen {
$tos genaddr $1.tvc $1.abi.json --genkey $1.keys.json > log.log
}
function deploy {
echo GENADDR $1 ----------------------------------------------
genaddr $1
DEBOT_ADDRESS=$(get_address)
echo GIVER $1 ------------------------------------------------
giver $DEBOT_ADDRESS
echo DEPLOY $1 -----------------------------------------------
$tos --url $NETWORK deploy $1.tvc "{}" --sign $1.keys.json --abi $1.abi.json
DEBOT_ABI=$(cat $1.abi.json | xxd -ps -c 20000)
$tos --url $NETWORK call $DEBOT_ADDRESS setABI "{\"dabi\":\"$DEBOT_ABI\"}" --sign $1.keys.json --abi $1.abi.json
echo -n $DEBOT_ADDRESS > $1.addr
}
function deploygen {
echo GENADDR $1 ----------------------------------------------
genaddrgen $1
DEBOT_ADDRESS=$(get_address)
echo GIVER $1 ------------------------------------------------
giver $DEBOT_ADDRESS
echo DEPLOY $1 -----------------------------------------------
$tos --url $NETWORK deploy $1.tvc "{}" --sign $1.keys.json --abi $1.abi.json
DEBOT_ABI=$(cat $1.abi.json | xxd -ps -c 20000)
$tos --url $NETWORK call $DEBOT_ADDRESS setABI "{\"dabi\":\"$DEBOT_ABI\"}" --sign $1.keys.json --abi $1.abi.json
echo -n $DEBOT_ADDRESS > $1.addr
}
function deployMsig {
msig=SafeMultisigWallet
echo GENADDR $msig ----------------------------------------------
genaddrw $msig
ADDRESS=$(get_address)
echo GIVER $msig ------------------------------------------------
giver $ADDRESS
echo DEPLOY $msig -----------------------------------------------
PUBLIC_KEY=$(cat Service.keys.json | jq .public)
$tos --url $NETWORK deploy $msig.tvc "{\"owners\":[\"0x${PUBLIC_KEY:1:64}\"],\"reqConfirms\":1}" --sign Service.keys.json --abi $msig.abi.json
echo -n $ADDRESS > msig.addr
}

LOCALNET=http://127.0.0.1
DEVNET=https://net.ton.dev
MAINNET=https://main.ton.dev
NETWORK=$LOCALNET

deployMsig
MSIG_ADDRESS=$(cat msig.addr)

deploy $DEBOT_NAME
DEBOT_ADDRESS=$(cat $DEBOT_NAME.addr)
ACCMAN_ADDRESS=$DEBOT_ADDRESS

#ICON_BYTES=$(base64 -w 0 hellodebot.png)
#ICON=$(echo -n "data:image/png;base64,$ICON_BYTES" | xxd -ps -c 20000)
IMAGE=$(base64 -w 0 Subscription.tvc)
$tos --url $NETWORK call $DEBOT_ADDRESS setSubscriptionBase "{\"image\":\"$IMAGE\"}" --sign $DEBOT_NAME.keys.json --abi $DEBOT_NAME.abi.json
#$tos --url $NETWORK call $DEBOT_ADDRESS setIcon "{\"icon\":\"$ICON\"}" --sign $DEBOT_NAME.keys.json --abi $DEBOT_NAME.abi.json
IMAGE=$(base64 -w 0 Wallet.tvc)
$tos --url $NETWORK call $DEBOT_ADDRESS setSubscriptionWalletCode "{\"image\":\"$IMAGE\"}" --sign $DEBOT_NAME.keys.json --abi $DEBOT_NAME.abi.json

IMAGE=$(base64 -w 0 SubscriptionIndex.tvc)
$tos --url $NETWORK call $DEBOT_ADDRESS setSubscriptionIndexCode "{\"image\":\"$IMAGE\"}" --sign $DEBOT_NAME.keys.json --abi $DEBOT_NAME.abi.json
# SET IMAGE for SERVICE
IMAGE=$(base64 -w 0 SubscriptionService.tvc)
$tos --url $NETWORK call $DEBOT_ADDRESS setSubscriptionService "{\"image\":\"$IMAGE\"}" --sign $DEBOT_NAME.keys.json --abi $DEBOT_NAME.abi.json

echo DONE ------------------------------------------------------------------
echo debot $DEBOT_ADDRESS

deploy $DEBOT_CLIENT
DEBOT_ADDRESS=$(cat $DEBOT_CLIENT.addr)
$tos --url $NETWORK call $DEBOT_ADDRESS setSubsman "{\"addr\":\"$ACCMAN_ADDRESS\"}" --sign $DEBOT_CLIENT.keys.json --abi $DEBOT_CLIENT.abi.json

# SERVICE DEBOT DEPLOY
deploygen serviceDebot
DEBOT_ADDRESS_SVC=$(cat serviceDebot.addr)
$tos --url $NETWORK call $DEBOT_ADDRESS_SVC setSubsman "{\"addr\":\"$ACCMAN_ADDRESS\"}" --sign serviceDebot.keys.json --abi serviceDebot.abi.json

echo client $DEBOT_ADDRESS
echo service $DEBOT_ADDRESS_SVC
echo debot $ACCMAN_ADDRESS
echo msig $MSIG_ADDRESS

cat msig.addr
cat msig.client.addr

cat client.keys.json
cat service.keys.json

#$tos --url $NETWORK debot fetch $DEBOT_ADDRESS
$tos --url $NETWORK debot fetch `cat deployerDebot.addr`
