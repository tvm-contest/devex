#!/bin/bash

. ./env.sh

$FT exec -- ../cpp/sudoku-client --sudoku-generate-proof --instance initial_instance.in --solution initial_solution.in || exit 2

$FT call sudoku submit '{ "proof" : "%{file:proof.bin.hex}" }' --wait || exit 2
