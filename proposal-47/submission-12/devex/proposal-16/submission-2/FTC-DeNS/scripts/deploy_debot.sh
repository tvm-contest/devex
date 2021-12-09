#!/bin/bash

solc=""
link=""
tcli=""
source ./internal_locator.sh

./select_network.sh get call

if [[ -f "$solc" ]]; then
  cd ../contracts || exit
  echo "[*] Building contracts..."
  $solc DensRoot.sol >/dev/null
  $solc DensDebot.sol >/dev/null
  mv ./*.code ../build/
  mv ./*.json ../build/
  cd ../scripts || exit

  if [[ -f "$link" ]]; then
    cd ../build || exit
    echo "[*] Linking contracts..."
    $link compile DensRoot.code -a DensRoot.abi.json -o DensRoot.tvc --lib ../bin/stdlib_sol.tvm >/dev/null
    $link compile DensDebot.code -a DensDebot.abi.json -o DensDebot.tvc --lib ../bin/stdlib_sol.tvm >/dev/null

    cd ../scripts || exit
  else
    echo "[-] Linking contracts skipped"
  fi

else
  echo "[-] Building and linking contracts skipped"
fi

tvc=../build/DensDebot.tvc
abi=../build/DensDebot.abi.json
rkf=../keys/root.keys.json
dkf=../keys/debot.keys.json

ABI=$(cat $abi | xxd -ps -c 20000)

if [[ ! -f "../keys/debot.keys.json" ]]; then
  echo "[!] Debot keys do not exist, generating them now"
  $tcli genaddr $tvc $abi --genkey $dkf | grep "Seed phrase" > ../keys/debot.phrase.txt
  echo "[#] Seed phrase saved to debot.phrase.txt, keys saved to debot.keys.json"
else
  echo "[#] Using existing keyfile debot.keys.json"
fi

addr=$($tcli genaddr ../build/DensRoot.tvc ../build/DensRoot.abi.json --setkey $rkf | grep 'Raw address' | awk '{print $3}')
echo "[!] Root account address: $addr"
root=$addr

addr=$($tcli genaddr $tvc $abi --setkey $dkf | grep 'Raw address' | awk '{print $3}')
echo "[!] Debot account address: $addr"

# Facepalm, it bounces back!!!
#acnf=$($tcli account "$addr" | grep -c 'Account not found' )
#
#if [[ "$acnf" != "0" ]]; then
#  echo "[!] The account does not exist yet. Prior to deploying you need to send some tokens to it."
#  echo "[*] Trying to fetch some tokens from the root for the debot..."
#  tonos-cli call --abi build/DensRoot.abi.json --sign $rkf "$root" withdraw '{"dest":"'"$addr"'","value":1000000000}'
#fi

acnf=$($tcli account "$addr" | grep -c 'Account not found' )

if [[ "$acnf" != "0" ]]; then
  ./internal_tx.sh "$addr" 1
fi

acnf=$($tcli account "$addr" | grep -c 'Account not found' )

if [[ "$acnf" != "0" ]]; then
  echo "[!] The account does not exist yet. Prior to deploying you need to send some tokens to it."
  echo "!!! Please send some tokens to the DEBOT account with address above and re-run the deployment script."
  exit 2
fi

acty=$($tcli account "$addr" | grep 'acc_type:' | awk '{print $2}')

if [[ "$acty" != "Uninit" ]]; then
  echo "[-] Account state is $acty, deployment is not needed"
else
  echo "[*] Deploying the contract..."
  $tcli deploy --abi $abi --sign $dkf $tvc '{"_root":"'"$root"'"}'
fi

echo "[*] Verifying DeBot ABI..."
ret=$($tcli run --abi $abi "$addr" getDebotOptions {} | grep '"debotAbi"' | awk '{print $2}')

doi=false
if [[ "$ret" == '"",' ]]; then
  echo "[!] Debot ABI is not initialized"
  doi=true
elif [[ "$ret" == '"'"$ABI"'",' ]]; then
  echo "[-] Debot ABI is up to date"
else
  echo "[!] Debot ABI is unknown / outdated"
  doi=true
fi

if $doi; then
  echo "[*] Configuring Debot ABI..."
  $tcli call --abi $abi --sign $dkf "$addr" setABI '{"dabi":"'"$ABI"'"}'
fi

echo "All done! You are advised to re-run this script again to make sure everything is deployed correctly!"
echo "Starting debot..."
$tcli debot fetch "$addr"