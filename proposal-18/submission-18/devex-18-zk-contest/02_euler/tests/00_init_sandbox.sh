#!/bin/bash

. ./env.sh

$FT switch to testnet
$FT --switch sandbox1 node stop
$FT switch remove sandbox1

$FT switch create sandbox1 --image ocamlpro/nil-local-node || exit 2

$FT node start || exit 2

echo Node is starting... waiting 10 seconds
sleep 10

$FT node give user0 user1 user2 user3 --amount 100000 || exit 2


