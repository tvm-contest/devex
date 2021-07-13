#!/bin/bash

. ./env.sh

$FT contract deploy sudoku --deployer user0 '{ "owner" : "%{account:address:user0}", "v_key_in" : "%{hex:file:'"${SUDOKU_VERIFKEY}"'}", "instance" : [{ "i" : "3", "j" : "3", "value" : "4"}]}' -f || exit 2

$FT account info sudoku

# $FT call --local sudoku get || exit 2
