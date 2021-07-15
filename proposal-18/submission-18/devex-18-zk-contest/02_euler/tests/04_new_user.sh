#!/bin/bash

. ./env.sh

$FT multisig transfer 5 --from user1 --to EulerRoot new_user '{ "pubkey": "0x%{account:pubkey:user1}" }' --wait || exit 2

rm -f user.addr
$FT call --local EulerRoot user_address '{ "pubkey": "0x%{account:pubkey:user1}" }' --subst @%{res:addr} --output user.addr || exit 2

$FT account create euler_user --address "$(cat user.addr)" --contract EulerUser || exit 2

$FT call --sign user1 euler_user set_name '{ "name": "%{hex:string:John Doo}" }' || exit 2

$FT call --local euler_user get || exit 2






