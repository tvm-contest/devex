#!/bin/bash

if [ "X$1" = "X" ] ; then
    echo "Usage: ./create_nil_accounts.sh ACCOUNT"
    echo "  ACCOUNT is a multisig account containing at least 500 TON"
    exit 2
fi

ACCOUNT=$1

. ./env.sh

$FT switch to nil || exit 2
$FT account create user0 user1 user2 user3 user4 || exit 2

for i in $(seq 0 4); do
    $FT account set user$i --surf || exit 2
    $FT multisig transfer 100 --from $ACCOUNT --to user$i --parrain || exit 2
    $FT multisig create user$i || exit 2
done
