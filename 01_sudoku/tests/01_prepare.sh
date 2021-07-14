#!/bin/bash

. ./env.sh

$FT exec -- ../cpp/sudoku-client --sudoku-generate-keys --proving-key-filename ${SUDOKU_PROVKEY} --verification-key-filename ${SUDOKU_VERIFKEY} || exit 2

zip ${SUDOKU_ZIPPED_PROVKEY} ${SUDOKU_PROVKEY} || exit 2
