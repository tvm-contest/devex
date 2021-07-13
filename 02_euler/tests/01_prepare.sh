#!/bin/bash

. ./env.sh

$FT exec -- ../cpp/euler-client prepare ${EULER_PROBLEM} ${EULER_NONCE} ${EULER_SOLUTION} || exit 2

zip provkey.bin.zip provkey.bin || exit 2
