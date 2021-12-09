#!/bin/bash

. ./env.sh

INSTANCE=$(./convert_instance.sh new_instance.in)

printf "Deploying Sudoku contract with new instance:\n\n$(cat new_instance.in)\n\n"


$FT call sudoku submit_instance '{ "instance" : ['"${INSTANCE}"']}' --wait || exit 2

$FT account info sudoku
