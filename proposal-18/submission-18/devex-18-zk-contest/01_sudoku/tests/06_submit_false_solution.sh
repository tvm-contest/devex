#!/bin/bash

. ./env.sh

printf "Attempting to create a proof with instance:\n\n$(cat new_instance.in)\n\nand (false) solution:\n\n$(cat false_solution.in)"

cmdk $FT exec -- ../cpp/sudoku-client --sudoku-generate-proof --instance new_instance.in --solution false_solution.in || exit 2

# $FT call sudoku submit '{ "proof" : "%{file:proof.bin.hex}" }' --wait || exit 2
