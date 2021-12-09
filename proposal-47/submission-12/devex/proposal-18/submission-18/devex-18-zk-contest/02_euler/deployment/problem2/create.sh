#!/bin/bash

. ../../tests/env.sh

export EULER_PROBLEM=2
export EULER_NONCE=1039
export EULER_SOLUTION=4613732

cmd ../../cpp/euler-client prepare ${EULER_PROBLEM} ${EULER_NONCE} ${EULER_SOLUTION}

zip provkey.bin.zip provkey.bin || exit 2

$FT call EulerRoot new_problem '{ "problem": %{env:EULER_PROBLEM}, "verifkey": "%{file:verifkey.bin.hex}", "zip_provkey": "%{hex:file:provkey.bin.zip}", "nonce": "%{env:EULER_NONCE}", "title": "%{hex:file:problem_title.txt}", "description": "%{hex:file:problem_description.txt}", "url": "%{hex:file:problem_url.txt}" }' --wait || exit 2

$FT call --local EulerRoot problem_address '{ "problem": %{env:EULER_PROBLEM} }' --subst @%{res:addr} --output euler_problem.addr || exit 2

$FT account create euler_problem${EULER_PROBLEM} --address "$(cat euler_problem.addr)" --contract EulerProblem || exit 2


