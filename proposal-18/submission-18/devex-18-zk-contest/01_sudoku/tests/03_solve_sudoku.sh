#!/bin/bash

. ./env.sh

printf "Attempting to create a proof with instance:\n\n$(cat initial_instance.in)\n\nand solution:\n\n$(cat initial_solution.in)"

sleep 4

$FT exec -- ../cpp/sudoku-client --sudoku-generate-proof --instance initial_instance.in --solution initial_solution.in || exit 2

cmd cp proof.bin.hex initialproof.bin.hex

printf "submitting proof to smart contract..."

$FT call sudoku submit '{ "proof" : "%{file:proof.bin.hex}" }' --wait || exit 2
