#!/bin/bash

. ./env.sh

$FT exec -- ../cpp/sudoku-client --sudoku-generate-keys --proving-key-output ${SUDOKU_PROVKEY} --verification-key-output ${SUDOKU_VERIFKEY} || exit 2

zip provkey.bin.zip ${SUDOKU_PROVKEY} || exit 2
