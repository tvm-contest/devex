#!/bin/bash

. ./env.sh

$FT switch to testnet
$FT switch remove sandbox1

$FT switch create sandbox1 --image ocamlpro/nil-local-node || exit 2

$FT node start

echo Node is starting... waiting 10 seconds
sleep 10

$FT node give user0 --amount 100000


