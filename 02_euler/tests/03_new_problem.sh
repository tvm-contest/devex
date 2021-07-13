#!/bin/bash

. ./env.sh

$FT call EulerRoot new_problem '{ "problem": %{env:EULER_PROBLEM}, "verifkey": "%{file:verifkey.bin.hex}", "zip_provkey": "%{hex:file:provkey.bin.zip}" }' --wait || exit 2

zip provkey.bin.zip provkey.bin || exit 2

rm -f euler_problem.addr
$FT call --local EulerRoot problem_address '{ "problem": %{env:EULER_PROBLEM} }' --subst @%{res:addr} --output euler_problem.addr || exit 2

$FT account create euler_problem --address "$(cat euler_problem.addr)" --contract EulerProblem || exit 2

$FT call --local euler_problem get || exit 2





