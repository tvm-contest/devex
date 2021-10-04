#!/bin/bash

. ./env.sh


$FT contract deploy RecoverableMultisigWallet --credit 10 '{"owners":[ "0x%{account:pubkey:user0}", "0x%{account:pubkey:user2}","0x%{account:pubkey:user3}" ],"reqConfirms":1}' -f || exit 2


$FT call RecoverableMultisigWallet SetPubkeyRecoveryCode '{ "code": "%{get-code:contract:tvc:PubkeyRecovery}" }' --wait || exit 2

$FT call --local RecoverableMultisigWallet getCustodians || exit 2


$FT call --sign user1 PubkeyRecovery RecoverPubkey '{ "addr": "%{account:address:RecoverableMultisigWallet}" }' --wait || exit 2



$FT call --local RecoverableMultisigWallet getCustodians || exit 2
