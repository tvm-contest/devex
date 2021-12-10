tos=/home/chezetti/tonos-cli/target/release/tonos-cli

DEBOT_NAME=NftDebot

DEBOT_ABI=$(cat $DEBOT_NAME.abi.json | xxd -ps -c 20000)

function get_address {
echo $(cat NftDebot.log | grep "Raw address:" | cut -d ' ' -f 3)
}

DEBOT_ADDRESS=$(get_address)

$tos --url https://net.ton.dev deploy $DEBOT_NAME.tvc "{}" --sign $DEBOT_NAME.keys.json --abi $DEBOT_NAME.abi.json
$tos --url https://net.ton.dev call $DEBOT_ADDRESS setABI "{\"dabi\":\"$DEBOT_ABI\"}" --sign $DEBOT_NAME.keys.json --abi $DEBOT_NAME.abi.json