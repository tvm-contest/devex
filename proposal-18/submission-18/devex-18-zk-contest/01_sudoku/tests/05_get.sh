#!/bin/bash

. ./env.sh

printf "Now fetching the state of our contract, it should show the verification key and the current Sudoku instance matching:\n\n$(cat new_instance.in)\n\n"

sleep 5

$FT call sudoku get --local || exit 2
