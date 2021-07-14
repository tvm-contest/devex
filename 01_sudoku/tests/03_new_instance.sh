#!/bin/bash

. ./env.sh

INSTANCE=$(./convert_instance.sh new_instance.in)

$FT multisig transfer --from user0 --to  sudoku 1 submit_instance '{ "instance" : ['"${INSTANCE}"']}' --wait || exit 2

# $FT multisig transfer --from user0 --to  sudoku 1 submit_instance '{ "instance" : [{ "i" : "3", "j" : "3", "value" : "4"},{ "i" : "2", "j" : "3", "value" : "1"}]}' --wait || exit 2

$FT account info sudoku
