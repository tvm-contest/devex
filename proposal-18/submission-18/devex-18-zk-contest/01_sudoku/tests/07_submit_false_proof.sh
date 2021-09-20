#!/bin/bash

. ./env.sh

printf "Ok, but now let's try to submit the proof for our initial
instance:\n\n"

printf "submitting proof to smart contract...\n\n"

sleep 4

cmdk $FT call sudoku submit '{ "proof" : "%{hex:file:initialproof.bin}" }'

printf "\nAs expected, it failed.\n"
