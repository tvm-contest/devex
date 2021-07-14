#!/bin/bash

. ./env.sh
INSTANCE=$(./convert_instance.sh initial_instance.in)

printf "Deploying Sudoku contract with initial instance:\n\n$(cat initial_instance.in)\n\n"

$FT contract deploy sudoku --credit 100 --deployer user0 '{ "v_key_in" : "%{hex:file:'"${SUDOKU_VERIFKEY}"'}",  "instance" : ['"${INSTANCE}"']}' -f || exit 2

$FT account info sudoku

# $FT call --local sudoku get || exit 2
