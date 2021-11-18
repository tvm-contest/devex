$ROOT_PATH="./demoBot/"
$DEBOT_NAME="demoBot"
$GIVER="0:841288ed3b55d9cdafa806807f02a0ae0c169aa5edfe88a789a6482429756a94"
$NETWORK="http://127.0.0.1:7777"

Write-Host "Genaddr"
tonos-cli genaddr $ROOT_PATH$DEBOT_NAME'.tvc' $ROOT_PATH$DEBOT_NAME'.abi.json' --genkey $ROOT_PATH$DEBOT_NAME'.keys.json' > $ROOT_PATH'log.log'
$DEBOT_ADDRESS=(Get-Content $ROOT_PATH'log.log') | Select-String -Pattern 'Raw address:' -CaseSensitive
$DEBOT_ADDRESS= $DEBOT_ADDRESS -split ':'
$DEBOT_ADDRESS='0:' + $DEBOT_ADDRESS[2]
Write-Host $DEBOT_ADDRESS

Write-Host "Ask giver"
tonos-cli --url $NETWORK call --abi $ROOT_PATH'local_giver.abi.json' $GIVER sendGrams "{\""dest\"":\""$DEBOT_ADDRESS\"",\""amount\"":10000000000}"

Write-Host "Deploy debot $DEBOT_ADDRESS"
tonos-cli --url $NETWORK deploy $ROOT_PATH$DEBOT_NAME'.tvc' "{}" --sign $ROOT_PATH$DEBOT_NAME'.keys.json' --abi $ROOT_PATH$DEBOT_NAME'.abi.json'
Write-Host "Set Abi $DEBOT_ADDRESS"
$DEBOT_ABI=(Get-Content $ROOT_PATH$DEBOT_NAME'.abi.json' -Encoding Byte -ReadCount 0)
$output = new-object System.Text.StringBuilder # Using stringBuilder seems faster than $a = $a + "a" ?
$count = $DEBOT_ABI.length    # The loop seems much faster when using a pre-set value?
for ($i = 0; $i -le $count-1; $i++) {
  $hex = "{0:x}" -f $DEBOT_ABI[$i]
  [void]$output.Append($hex.PadLeft(2, "0"))  # Pad any single digits
}
$DEBOT_ABI=$output
#Write-Host $DEBOT_ABI
tonos-cli --url $NETWORK call $DEBOT_ADDRESS setABI "{\""dabi\"":\""$DEBOT_ABI\""}" --sign $ROOT_PATH$DEBOT_NAME'.keys.json' --abi $ROOT_PATH$DEBOT_NAME'.abi.json'
Write-Host "Set Icon $DEBOT_ADDRESS"
$ICON=(Get-Content $ROOT_PATH'debot.png' -Encoding Byte -ReadCount 0)
$output = new-object System.Text.StringBuilder # Using stringBuilder seems faster than $a = $a + "a" ?
$count = $ICON.length    # The loop seems much faster when using a pre-set value?
for ($i = 0; $i -le $count-1; $i++) {
  $hex = "{0:x}" -f $ICON[$i]
  [void]$output.Append($hex.PadLeft(2, "0"))  # Pad any single digits
}
$ICON=$output
#Write-Host $ICON
tonos-cli --url $NETWORK call $DEBOT_ADDRESS setIcon "{\""icon\"":\""$ICON\""}" --sign $ROOT_PATH$DEBOT_NAME'.keys.json' --abi $ROOT_PATH$DEBOT_NAME'.abi.json'

Write-Host "Done"
Write-Host $DEBOT_ADDRESS > address.log
Write-Host debot $NETWORK'/'$DEBOT_ADDRESS

Write-Host "Test that we can connect to the DeBot"
tonos-cli --config $ROOT_PATH'tonos-cli.local-config.json' debot fetch $DEBOT_ADDRESS