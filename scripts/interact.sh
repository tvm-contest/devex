#!/bin/bash

if ! command -v jq &> /dev/null
then
    echo "Error: jq not found. Please install jq first."
    exit 1
fi

if ! command -v xxd &> /dev/null
then
    echo "Error: xxd not found. Please install xxd first."
    exit 1
fi

tcli=""
source ./internal_locator.sh tcli

abi=../build/DensRoot.abi.json
cabi=../build/DensCertificate.abi.json
aabi=../build/DensAuction.abi.json
rkf=../keys/root.keys.json
aid0='"_answer_id":0'
zero='0x0000000000000000000000000000000000000000000000000000000000000000'
zeroaddr='0:0000000000000000000000000000000000000000000000000000000000000000'
cert_addr=''
auct_addr=''
lrdn=''
lrda=''

./select_network.sh get menu

addr=$($tcli genaddr ../build/DensRoot.tvc ../build/DensRoot.abi.json --setkey $rkf | grep 'Raw address' | awk '{print $3}')
echo "[*] Root account address: $addr"
root=$addr

echo "[>] You can use enter when in any menu to display option keys again! [<]"

function InputAddress() {
  WCID=""
  ADDR=""
  ADDRESS=""
  export WCID ADDR ADDRESS
  IFS=":" read -r -p "$1" -a entered
  elems=${#entered[@]}
  if (( elems != 2 )); then
    echo 'Incorrect address format, please use format workchainId(0/-1):hexAddress(64 hex chars)'
    return 1
  fi
  WCID=${entered[0]}
  if [[ "$WCID" != "0" && "$WCID" != "-1" ]]; then
    echo 'Incorrect workchain ID, please use 0 or -1 before :'
    return 1
  fi
  ADDR=${entered[1]}
  ALEN=${#ADDR}
  if [[ "$ALEN" != 64 ]]; then
    echo 'Incorrect address length, please use 64 hex characters'
    return 1
  fi
  if ! [[ "$ADDR" =~ ^[0-9A-Fa-f]{64}$ ]] ; then
    echo "Incorrect address format, please use 64 hex characters"
    return 1
  fi
  ADDRESS="$WCID:$ADDR"
  export WCID ADDR ADDRESS
  return 0
}

function InputPubKey() {
  PUBKEY=""
  export PUBKEY
  read -r -p "$1" entered
  if ! [[ "$entered" =~ ^[0-9A-Fa-f]{64}$ ]] ; then
    echo "Incorrect pubkey format, please use 64 hex characters"
    return 1
  fi
  PUBKEY="$entered"
  export PUBKEY
  return 0
}

function InputText() {
  TEXT=""
  export TEXT
  read -r -p "$1" entered
  TEXT="$entered"
  export TEXT
  return 0
}

function InputNumber() {
  NUMBER=""
  export NUMBER
  read -r -p "$1" entered
  if [[ ! "$entered" =~ ^[0-9]+$ ]] ; then
    echo "[!] Invalid entered number format"
    return 1
  fi
  NUMBER="$entered"
  export NUMBER
  return 0
}

function ToHex() {
  HEX=$(echo -n "$1" | xxd -c 1000000 -pu)
  export HEX
}

function GetResult() {
  res="$(echo "$1" | tr '\n' ' ' | tr '\r' ' ' | cut -d'{' -f3-)"
  RES=$(echo "{ $res")
  if [ "$#" -ge 2 ]; then
    RES=$(echo "$RES" | jq -r "$2")
  fi
  export RES
  return 0
}

function GetBody() {
  BODY=""
  export BODY
  BODY=$(echo "$1" | grep "Message body" | awk '{print $3}')
  return 0
}

function ProcessBody() {
  value="1"
  if [[ "$3" != "" ]]; then
    value="$3"
  fi
  if [[ -f "../keys/box.keys.json" ]]; then
    echo "[#] Found box.keys.json, carrying out the transaction automatically from the box"
    echo "[.] Sending the following message body:"
    echo "$1"
    echo "[.] to the destination address $2"
    ./internal_tx.sh "$2" "$value" "$1"
  else
    echo "[!] Please provide the following internal message body to the transaction sending routine of your wallet:"
    echo "$1"
    echo "[!] Destination address is $2, please send at least $value Tons"
  fi
  return 0
}

function Resolve() {
  RES=$(echo "$1" | jq -r "$2")
  export RES
  return 0
}

# ======================================================================================================================

function MainMenu() {
  # echo "Root address: $addr"
  PS3='[/] Please select an option: '
  options=("Resolve an address" "Root actions" "Certificate actions" "Auction actions" \
           "Request name registration" "Set root address" "Change network" "Quit")
  select opt in "${options[@]}"
  do
      case $opt in
          "Resolve an address")
              echo "[>] Entering address resolution mode"
              MResolve; break; ;;
          "Root actions")
              echo "[>] Entering root contract operation mode"
              MRoot; break; ;;
          "Certificate actions")
              echo "[>] Entering certificate operation mode"
              MCertificate; break; ;;
          "Auction actions")
              echo "[>] Entering auction operation mode"
              MAuction; break; ;;
          "Request name registration")
              echo "[>] Entering name registration mode"
              MRegName; break; ;;
          "Set root address")
              echo "[>] Configuring root address"
              MRootAddress; break; ;;
          "Change network")
              echo "[>] Calling network selection script"
              ./select_network.sh
              break; ;;
          "Quit")
              echo "[!] Bye bye!"
              exit; ;;
          *) echo "[!] Invalid option $REPLY";;
      esac
  done
}

# ======================================================================================================================

function MResolve() {
  if [[ "$root" == "" ]]; then
    echo "[!] Root address not set! Please configure root address first!"
    return
  fi
  IFS='/' read -r -p '[/resolve/] Please enter domain name: ' -a dom
  parent="$root"
  crumb=""
  for piece in "${dom[@]}"; do
    crumb="$crumb/$piece"
    echo "[.] Resolving $crumb certificate address..."
    ToHex "$piece"
    GetResult "$($tcli run --abi $abi "$root" resolveRPC "{$aid0,\"name\":\"$HEX\",\"cert\":\"$parent\",\"ptype\":1}")" '.value0'
    if [[ "$RES" == "" ]]; then
      echo "[!] Failed when resolving $piece element"
      return
    fi
    echo "[-] Obtained certificate address: $RES"
    parent="$RES"
  done
  echo "[*] Final certificate address: $parent"
  GetResult "$($tcli run --abi $cabi "$parent" whois "{$aid0}")" '.value0'
  if [[ "$RES" == "" ]]; then
    echo "[!] Failed to inquiry information about the certificate!"
    return
  fi
  info="$RES"
  Resolve "$info" ".expiry"
  expires="$RES"
  now=$(date +%s)
  if [ "$now" -gt "$expires" ]; then
    echo "[!!! >>>] WARNING: CERTIFICATE IS EXPIRED [<<< !!!]"
  fi
  Resolve "$info" ".owner"
  echo "[.] Certificate owned by $RES"
  Resolve "$info" ".registered"
  registr="$RES"
  echo "[.] Registered at $(date -d "@$registr"), expires at $(date -d "@$expires")"
  Resolve "$info" ".value"
  echo "[*] Certificate value is: $RES"
  lrdn="$crumb"
  lrda="$parent"
  export lrdn lrda
}

# ======================================================================================================================

function MRoot() {
  if [[ "$root" == "" ]]; then
    echo "Root address not set! Please configure root address first!"
    return
  fi
  if [[ ! -f "$rkf" ]]; then
    echo "[!] Root keyfile does not exist, please configure root.keys.json first!"
    return
  fi
  PS3='[/root/] Please select an option: '
  options=("Change ownership" "Reserve a domain" "Directly deploy certificate" "Directly reconfigure certificate" \
           "Withdraw excess funds" "Return")
  select opt in "${options[@]}"
  do
      case $opt in
          "Change ownership")
              echo "[>] Entering root ownership change mode"
              MRootChOwn; ;;
          "Reserve a domain")
              echo "[>] Entering domain reservation mode"
              MRootReserve; ;;
          "Directly deploy certificate")
              echo "[>] Entering certificate deployment mode"
              MRootDeploy; ;;
          "Directly reconfigure certificate")
              echo "[>] Entering certificate reconfiguration mode"
              MRootReconfigure; ;;
          "Withdraw excess funds")
              echo "[>] Entering withdrawal mode"
              MRootWithdraw; ;;
          "Return")
              echo "[<] Returning to main menu"
              return; ;;
          *) echo "[!] Invalid option $REPLY";;
      esac
  done
}

function MRootChOwn() {
  echo '[/root/chown/] Verifying pending ownership change...'
  GetResult "$($tcli run --abi $abi "$root" pending_owner "{}")" '.pending_owner'
  if [[ "$RES" == "" ]]; then
    echo "[!] Failed to retrieve pending ownership change!"
    return
  fi
  if [[ "$RES" == "$zero" ]]; then
    echo "[-] There is no pending ownership change"
  else
    echo "[>] There is a pending ownership change to $RES"
  fi
  PS3='[/root/chown/] Please select an option: '
  options=("Cancel pending ownership change" "Initiate ownership change" "Accept ownership" "Return")
  select opt in "${options[@]}"
  do
      case $opt in
          "Cancel pending ownership change")
              echo "[>] Configuring ownership change to zero pubkey..."
              $tcli call --abi $abi --sign $rkf "$addr" transferOwner '{"new_owner":"'"$zero"'"}'
              ;;
          "Initiate ownership change")
              InputPubKey "[?] Please enter new owner's public key (without 0x): "
              if [[ "$PUBKEY" != "" ]]; then
                echo "[>] Configuring ownership change to 0x$PUBKEY..."
                $tcli call --abi $abi --sign $rkf "$addr" transferOwner '{"new_owner":"'"0x$PUBKEY"'"}'
              fi
              ;;
          "Accept ownership")
              echo "[>] Attempting to accept ownership change..."
              $tcli call --abi $abi --sign $rkf "$addr" acceptOwner '{}'
              ;;
          "Return")
              echo "[<] Returning to root actions menu"
              return; ;;
          *) echo "[!] Invalid option $REPLY";;
      esac
  done
}

function MRootReserve() {
  InputText "[?] Please enter a domain name to reserve: "
  if [[ "$TEXT" == "" ]]; then
    echo "[!] No domain name entered"
    return
  fi
  echo '[*] Enter 0 to unreserve, 1 for permanent or unix time to reserve until'
  InputNumber '[?] Enter reservation expiration unix time: '
  if [[ "$NUMBER" == "" ]]; then
    echo "[!] No correct reservation expiration entered"
    return
  fi
  ToHex "$TEXT"
  $tcli call --abi $abi --sign $rkf "$addr" reserveName '{"name":"'"$HEX"'","until":'"$NUMBER"'}'
}

function MRootDeploy() {
  InputText "[?] Please enter a domain name to deploy: "
  if [[ "$TEXT" == "" ]]; then
    echo "[!] No domain name entered"
    return
  fi
  echo '[*] Enter 0 for permanent domain or lifetime in years'
  InputNumber '[?] Enter domain lifetime in years: '
  if [[ "$NUMBER" == "" ]]; then
    echo "[!] No correct lifetime entered"
    return
  fi
  InputAddress "[?] Enter initial domain owner address: "
  if [[ "$ADDRESS" == "" ]]; then
    echo "[!] No correct owner address entered"
    return
  fi
  ToHex "$TEXT"
  now=$(date +%s)
  exp=4294967295
  if [[ "$NUMBER" != "0" ]]; then
    exp=$((now + 365*24*60*60*NUMBER))
  fi
  echo "[>] Deploying $TEXT domain with expiration $exp and owner $ADDRESS"
  $tcli call --abi $abi --sign $rkf "$addr" directlyDeploy '{"name":"'"$HEX"'","_owner":"'"$ADDRESS"'","expiry":'"$exp"'}'
}

function MRootReconfigure() {
  InputText "[?] Please enter a domain name to reconfigure: "
  if [[ "$TEXT" == "" ]]; then
    echo "[!] No domain name entered"
    return
  fi
  echo '[*] Enter 0 for permanent domain or lifetime in years'
  InputNumber '[?] Enter domain lifetime in years: '
  if [[ "$NUMBER" == "" ]]; then
    echo "[!] No correct lifetime entered"
    return
  fi
  InputAddress "[?] Enter new domain owner address: "
  if [[ "$ADDRESS" == "" ]]; then
    echo "[!] No correct owner address entered"
    return
  fi
  ToHex "$TEXT"
  now=$(date +%s)
  exp=4294967295
  if [[ "$NUMBER" != "0" ]]; then
    exp=$((now + 365*24*60*60*NUMBER))
  fi
  echo "[>] Reconfiguring $TEXT domain with expiration $exp and owner $ADDRESS"
  $tcli call --abi $abi --sign $rkf "$addr" directlyReconfigure '{"name":"'"$HEX"'","_owner":"'"$ADDRESS"'","expiry":'"$exp"'}'
}

function MRootWithdraw() {
  InputAddress "[?] Where to withdraw funds to: "
  if [[ "$ADDRESS" == "" ]]; then
    echo "[!] No correct withdrawal address entered"
    return
  fi
  InputNumber '[?] How many Tons you want to withdraw: '
  if [[ "$NUMBER" == "" ]]; then
    echo "[!] No correct withdrawal amount entered"
    return
  fi
  $tcli call --abi $abi --sign $rkf "$addr" withdraw '{"dest":"'"$ADDRESS"'","value":'"$NUMBER"'000000000}'
  echo "[*] Notice: withdrawal may fail if resulting balance is lower than required threshold"
}

# ======================================================================================================================

function MCertificate() {
  if [[ "$lrdn" != "" ]]; then
    echo "[*] You can just press enter to use latest resolved certificate (for $lrdn)"
  fi
  InputAddress "[?] Please enter certificate address to work with: "
  if [[ "$ADDRESS" == "" ]]; then
    if [[ "$lrdn" == "" ]]; then
      return
    fi
    echo "[#] Using last resolved domain name: $lrdn"
    echo "[#] Substituting address: $lrda"
    ADDRESS="$lrda"
  fi
  export cert_addr="$ADDRESS"
  PS3='[/certificate/] Please select an option: '
  options=("Query information" "Set value" "Transfer owner" "Accept owner transfer" "Create subcertificate" \
           "Sync subcertificate" "Request code upgrade" "Withdraw excess funds" "Return")
  select opt in "${options[@]}"
  do
      case $opt in
          "Query information")
              echo "[>] Querying certificate information"
              MCertificateQuery; ;;
          "Set value")
              echo "[>] Entering value modification mode"
              MCertificateSetValue; ;;
          "Transfer owner")
              echo "[>] Entering owner transfer configuration mode"
              MCertificateTransferOwner; ;;
          "Accept owner transfer")
              echo "[>] Attempting to accept owner transfer"
              MCertificateAcceptOwner; ;;
          "Create subcertificate")
              echo "[>] Entering subcertificate creation mode"
              MCertificateSubCreate; ;;
          "Sync subcertificate")
              echo "[>] Entering subcertificate synchronization mode"
              MCertificateSubSync; ;;
          "Request code upgrade")
              echo "[>] Attempting to request code upgrade from root"
              MCertificateRequestUpgrade; ;;
          "Return")
              echo "[<] Returning to main menu"
              return; ;;
          *) echo "[!] Invalid option $REPLY";;
      esac
  done
}

function MCertificateQuery() {
  echo "[.] Querying certificate information for $cert_addr"
  GetResult "$($tcli run --abi $cabi "$cert_addr" whois "{$aid0}")" '.value0'
  if [[ "$RES" == "" ]]; then
    echo "[!] Failed to obtain information"
    return
  fi
  info="$RES"
  GetResult "$($tcli run --abi $cabi "$cert_addr" root "{}")" '.root'
  echo "[-] Root contract: $RES"
  Resolve "$info" ".name" && echo "[-] Encoded name (hex): $RES"
  Resolve "$info" ".owner" && echo "[-] Current owner: $RES"
  GetResult "$($tcli run --abi $cabi "$cert_addr" pending_owner "{}")" '.pending_owner'
  echo "[-] Pending owner: $RES"
  Resolve "$info" ".parent" && echo "[-] Parent contract: $RES"
  Resolve "$info" ".value" && echo "[-] Target address (value): $RES"
  Resolve "$info" ".registered" && echo "[-] Registered at: ($RES) $(date -d "@$RES")"
  Resolve "$info" ".expiry" && echo "[-] Expires at: ($RES) $(date -d "@$RES")"
}

function MCertificateSetValue() {
  InputAddress "[?] Please enter new certificate value: "
  if [[ "$ADDRESS" == "" ]]; then
    echo "[!] No correct value address entered"
    echo "Are you sure you want to reset value to zero?"
    echo "Type in 0 in the next prompt to confirm."
    InputNumber "[#] Type 0 to confirm value reset: "
    if [[ "$NUMBER" != "0" ]]; then
      echo "[!] Aborted"
      return
    fi
    ADDRESS="$zeroaddr"
  fi
  GetBody "$($tcli body --abi $cabi setValue '{"new_value":"'"$ADDRESS"'"}')"
  ProcessBody "$BODY" "$cert_addr"
}

function MCertificateTransferOwner() {
  InputAddress "[?] Please enter new certificate owner address: "
  if [[ "$ADDRESS" == "" ]]; then
    echo "[!] No correct new owner address entered"
    echo "Are you sure you want to cancel transfer procedure?"
    echo "Type in 0 in the next prompt to confirm."
    InputNumber "[#] Type 0 to confirm cancelling owner transfer: "
    if [[ "$NUMBER" != "0" ]]; then
      echo "[!] Aborted"
      return
    fi
    ADDRESS="$zeroaddr"
  fi
  GetBody "$($tcli body --abi $cabi transferOwner '{"new_owner":"'"$ADDRESS"'"}')"
  ProcessBody "$BODY" "$cert_addr"
}

function MCertificateAcceptOwner() {
  GetBody "$($tcli body --abi $cabi acceptOwner '{}')"
  ProcessBody "$BODY" "$cert_addr"
}

function MCertificateSubCreate() {
  InputText "[?] Please enter a subdomain name to deploy: "
  if [[ "$TEXT" == "" ]]; then
    echo "[!] No subdomain name entered"
    return
  fi
  echo '[*] Enter 0 for permanent subdomain or lifetime in years'
  InputNumber '[?] Enter subdomain lifetime in years: '
  if [[ "$NUMBER" == "" ]]; then
    echo "[!] No correct lifetime entered"
    return
  fi
  ToHex "$TEXT"
  now=$(date +%s)
  exp=4294967295
  if [[ "$NUMBER" != "0" ]]; then
    exp=$((now + 365*24*60*60*NUMBER))
  fi
  echo "[>] Deploying $TEXT subdomain with expiration $exp"
  GetBody "$($tcli body --abi $cabi subCertRequest '{"subname":"'"$HEX"'","subexpiry":'"$exp"'}')"
  ProcessBody "$BODY" "$cert_addr"
}

function MCertificateSubSync() {
  InputText "[?] Please enter a subdomain name to synchronize: "
  if [[ "$TEXT" == "" ]]; then
    echo "[!] No subdomain name entered"
    return
  fi
  echo '[*] Enter 0 for permanent subdomain or lifetime in years'
  InputNumber '[?] Enter subdomain lifetime in years: '
  if [[ "$NUMBER" == "" ]]; then
    echo "[!] No correct lifetime entered"
    return
  fi
  ToHex "$TEXT"
  now=$(date +%s)
  exp=4294967295
  if [[ "$NUMBER" != "0" ]]; then
    exp=$((now + 365*24*60*60*NUMBER))
  fi
  echo "[>] Deploying $TEXT subdomain with expiration $exp"
  GetBody "$($tcli body --abi $cabi subCertSynchronize '{"subname":"'"$HEX"'","subexpiry":'"$exp"'}')"
  ProcessBody "$BODY" "$cert_addr"
}

function MCertificateRequestUpgrade() {
  GetBody "$($tcli body --abi $cabi requestUpgrade '{}')"
  ProcessBody "$BODY" "$cert_addr"
}

function MCertificateWithdraw() {
  InputAddress "[?] Where to withdraw funds to: "
  if [[ "$ADDRESS" == "" ]]; then
    echo "[!] No correct withdrawal address entered"
    return
  fi
  InputNumber '[?] How many Tons you want to withdraw: '
  if [[ "$NUMBER" == "" ]]; then
    echo "[!] No correct withdrawal amount entered"
    return
  fi
  GetBody "$($tcli body --abi $cabi withdraw '{"dest":"'"$ADDRESS"'","value":'"$NUMBER"'000000000}')"
  ProcessBody "$BODY" "$cert_addr"
  echo "[*] Notice: withdrawal may fail if resulting balance is lower than required threshold"
}

# ======================================================================================================================

function MAuction() {
  if [[ "$root" == "" ]]; then
    echo "[!] Root address not set! Please configure root address first!"
    return
  fi
  InputText "[?] Please enter domain name to look for auction: "
  if [[ "$TEXT" == "" ]]; then
    echo "[!] Domain name was not porovided"
    return
  fi
  ToHex "$TEXT"
  GetResult "$($tcli run --abi $abi "$root" resolveRPC "{$aid0,\"name\":\"$HEX\",\"cert\":\"$root\",\"ptype\":2}")" '.value0'
  if [[ "$RES" == "" ]]; then
    echo "[!] Failed to resolve!"
    return
  fi
  auct_addr="$RES"
  echo "[*] Possible auction address: $auct_addr"
  GetResult "$($tcli run --abi $aabi "$auct_addr" endBid "{}")" '.endBid'
  endbid="$RES"
  GetResult "$($tcli run --abi $aabi "$auct_addr" endRev "{}")" '.endRev'
  endrev="$RES"
  if [[ "$endbid" == "" || "$endrev" == "" || "$endbid" == "null" || "$endrev" == "null" ]]; then
    echo "[!] Auction does not exist on that address (for the provided name)!"
    return
  fi
  export auct_addr
  PS3='[/auction/] Please select an option: '
  options=("Query information" "Query lists" "Bid" "Reveal" "Finalize" "Return")
  select opt in "${options[@]}"
  do
      case $opt in
          "Query information")
              echo "[>] Querying auction information"
              MAuctionQuery; ;;
          "Query lists")
              echo "[>] Querying auction lists"
              MAuctionQueryEx; ;;
          "Bid")
              echo "[>] Entering bid mode"
              MAuctionBid; ;;
          "Reveal")
              echo "[>] Entering reveal mode"
              MAuctionReveal; ;;
          "Finalize")
              echo "[>] Attempting to finalize auction"
              MAuctionFinalize; ;;
          "Return")
              echo "[<] Returning to main menu"
              return; ;;
          *) echo "[!] Invalid option $REPLY";;
      esac
  done
}

function MAuctionQuery() {
  echo "[-] Auction address: $auct_addr"
  GetResult "$($tcli run --abi $aabi "$auct_addr" root "{}")" '.root'
  echo "[-] Root address: $RES"
  GetResult "$($tcli run --abi $aabi "$auct_addr" name "{}")" '.name'
  echo "[-] Encoded name (hex): $RES"
  GetResult "$($tcli run --abi $aabi "$auct_addr" start "{}")" '.start'
  echo "[-] Auction start: ($RES) $(date -d "@$RES")"
  GetResult "$($tcli run --abi $aabi "$auct_addr" endBid "{}")" '.endBid'
  echo "[-] Bid phase ends: ($RES) $(date -d "@$RES")"
  GetResult "$($tcli run --abi $aabi "$auct_addr" endRev "{}")" '.endRev'
  echo "[-] Reveal phase ends: ($RES) $(date -d "@$RES")"
  GetResult "$($tcli run --abi $aabi "$auct_addr" expiry "{}")" '.expiry'
  echo "[-] New contract expiration: ($RES) $(date -d "@$RES")"
  GetResult "$($tcli run --abi $aabi "$auct_addr" minfinal "{}")" '.minfinal'
  echo "[-] Earliest possible finalize: ($RES) $(date -d "@$RES")"
  GetResult "$($tcli run --abi $aabi "$auct_addr" reveal_1 "{}")" '.reveal_1'
  echo "[-] Reveal phase first place: ($RES)"
  GetResult "$($tcli run --abi $aabi "$auct_addr" reveal_2 "{}")" '.reveal_2'
  echo "[-] Reveal phase second place: ($RES)"
}

function MAuctionQueryEx() {
  GetResult "$($tcli run --abi $aabi "$auct_addr" hashes "{}")" '.hashes'
  echo "Hashes: $RES"
  GetResult "$($tcli run --abi $aabi "$auct_addr" reveals "{}")" '.reveals'
  echo "Reveals: $RES"
  GetResult "$($tcli run --abi $aabi "$auct_addr" withdrawn "{}")" '.withdrawn'
  echo "Withdrawn: $RES"
}

function MAuctionBid() {
  GetResult "$($tcli run --abi $aabi "$auct_addr" endBid "{}")" '.endBid'
  endbid="$RES"
  now=$(date +%s)
  if [ "$now" -ge "$endbid" ]; then
    echo "[!!! >>>] WARNING: Local time suggests bid phase is over! [<<< !!!]"
    InputNumber "[!] Please type 1 to continue: "
    if [[ "$NUMBER" != "1" ]]; then
      return
    fi
  fi
  InputNumber '[?] Enter your bid amount in Tons: '
  if [[ "$NUMBER" == "" || "$NUMBER" == "0" ]]; then
    echo "[!] No correct bid amount entered"
    return
  fi
  bid="$NUMBER"
  nonce="$(dd if=/dev/urandom bs=32 count=1 2>/dev/null)"
  ToHex "$name"
  xname="$HEX"
  ToHex "$nonce"
  xnonce="$HEX"
  GetResult "$($tcli run --abi $abi "$root" generateHash '{"nonce":"0x'"$xnonce"'","amount":'"$bid"'000000000}')" '.value0'
  xhash="$RES"
  # {"components":[{"name":"name","type":"bytes"},{"name":"duration","type":"uint32"},{"name":"hash","type":"uint256"}],"name":"request","type":"tuple"}
  GetBody "$($tcli body --abi $aabi bid '{"_answer_id":0,"hash":"'"$xhash"'"}')"
  ProcessBody "$BODY" "$auct_addr"
  echo "[!!!] COPY YOUR AMOUNT AND NONCE TO SAFE PLACE! WITHOUT THEM YOU WILL NOT BE ABLE TO REVEAL YOUR BID LATER! [!!!]"
  echo "[!] "
  echo "[!] Amount (in Tons): $bid"
  echo "[!] Nonce value: $xnonce"
  echo "[!] "
  echo "[!!!] COPY YOUR AMOUNT AND NONCE TO SAFE PLACE! WITHOUT THEM YOU WILL NOT BE ABLE TO REVEAL YOUR BID LATER! [!!!]"
}

function MAuctionReveal() {
  GetResult "$($tcli run --abi $aabi "$auct_addr" endBid "{}")" '.endBid'
  endbid="$RES"
  GetResult "$($tcli run --abi $aabi "$auct_addr" endRev "{}")" '.endRev'
  endrev="$RES"
  now=$(date +%s)
  if [ "$now" -le "$endbid" ]; then
    echo "[!!! >>>] WARNING: Local time suggests reveal phase has not yet started! [<<< !!!]"
    InputNumber "[!] Please type 1 to continue: "
    if [[ "$NUMBER" != "1" ]]; then
      return
    fi
  fi
  if [ "$now" -ge "$endrev" ]; then
    echo "[!!! >>>] WARNING: Local time suggests reveal phase is over! [<<< !!!]"
    InputNumber "[!] Please type 1 to continue: "
    if [[ "$NUMBER" != "1" ]]; then
      return
    fi
  fi
  InputNumber '[?] Enter your bid amount in Tons: '
  if [[ "$NUMBER" == "" || "$NUMBER" == "0" ]]; then
    echo "[!] No correct bid amount entered"
    return
  fi
  bid="$NUMBER"
  InputPubKey "[?] Enter your nonce (without 0x): "
  if [[ "$PUBKEY" == "" ]]; then
    echo "[!] No correct nonce entered"
    return
  fi
  GetBody "$($tcli body --abi $aabi bid '{"_answer_id":0,"nonce":"0x'"$xnonce"'","amount":'"$bid"'000000000}')"
  ProcessBody "$BODY" "$auct_addr" $((bid+1))
}

function MAuctionFinalize() {
  GetResult "$($tcli run --abi $aabi "$auct_addr" minfinal "{}")" '.minfinal'
  minfinal="$RES"
  GetResult "$($tcli run --abi $aabi "$auct_addr" endRev "{}")" '.endRev'
  endrev="$RES"
  now=$(date +%s)
  if [ "$now" -le "$endrev" ]; then
    echo "[!!! >>>] WARNING: Local time suggests reveal phase has not finished yet! [<<< !!!]"
    InputNumber "[!] Please type 1 to continue: "
    if [[ "$NUMBER" != "1" ]]; then
      return
    fi
  fi
  if [ "$now" -le "$minfinal" ]; then
    echo "[!!! >>>] WARNING: Local time suggests minimum finalization time is not reached! [<<< !!!]"
    InputNumber "[!] Please type 1 to continue: "
    if [[ "$NUMBER" != "1" ]]; then
      return
    fi
  fi
  GetBody "$($tcli body --abi $aabi finalize '{"_answer_id":0}')"
  ProcessBody "$BODY" "$auct_addr"
}

# ======================================================================================================================

function MRegName() {
  InputText "[?] Please enter a domain name: "
  if [[ "$TEXT" == "" ]]; then
    echo "[!] No domain name entered"
    return
  fi
  name="$TEXT"
  InputNumber '[?] Enter domain lifetime in years: '
  if [[ "$NUMBER" == "" || "$NUMBER" == "0" ]]; then
    echo "[!] No correct lifetime entered"
    return
  fi
  life="$NUMBER"
  InputNumber '[?] Enter your bid amount in Tons: '
  if [[ "$NUMBER" == "" || "$NUMBER" == "0" ]]; then
    echo "[!] No correct bid amount entered"
    return
  fi
  bid="$NUMBER"
  nonce="$(dd if=/dev/urandom bs=32 count=1 2>/dev/null)"
  ToHex "$name"
  xname="$HEX"
  ToHex "$nonce"
  xnonce="$HEX"
  GetResult "$($tcli run --abi $abi "$root" generateHash '{"nonce":"0x'"$xnonce"'","amount":'"$bid"'000000000}')" '.value0'
  xhash="$RES"
  # {"components":[{"name":"name","type":"bytes"},{"name":"duration","type":"uint32"},{"name":"hash","type":"uint256"}],"name":"request","type":"tuple"}
  GetBody "$($tcli body --abi $abi regName '{"callbackFunctionId":0,"request":{"name":"'"$xname"'","duration":'"$life"',"hash":"'"$xhash"'"}}')"
  ProcessBody "$BODY" "$root" 6
  echo "[!!!] COPY YOUR AMOUNT AND NONCE TO SAFE PLACE! WITHOUT THEM YOU WILL NOT BE ABLE TO REVEAL YOUR BID LATER! [!!!]"
  echo "[!] "
  echo "[!] Amount (in Tons): $bid"
  echo "[!] Nonce value: $xnonce"
  echo "[!] "
  echo "[!!!] COPY YOUR AMOUNT AND NONCE TO SAFE PLACE! WITHOUT THEM YOU WILL NOT BE ABLE TO REVEAL YOUR BID LATER! [!!!]"
}

# ======================================================================================================================

function MRootAddress() {
  echo "Current root address: [$root]"
  InputAddress 'Please enter new root address: '
  if [[ "$ADDRESS" != "" ]]; then
    export root="$ADDRESS"
    echo "Root address changed to [$root]"
  fi
}

# ======================================================================================================================

while true
do
  MainMenu
done
