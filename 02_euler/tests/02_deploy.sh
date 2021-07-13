#!/bin/bash

. ./env.sh

$FT contract deploy EulerRoot --deployer user0 --credit 2 '{ "problem_code": "%{get-code:contract:tvc:EulerProblem}", "user_code": "%{get-code:contract:tvc:EulerUser}" }' -f || exit 2

$FT account info EulerRoot

$FT call --local EulerRoot get || exit 2





