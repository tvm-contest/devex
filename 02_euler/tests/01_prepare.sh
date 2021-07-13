#!/bin/bash

. ./env.sh

$FT exec -- ../cpp/euler-client prepare ${EULER_PROBLEM} ${EULER_SOLUTION} || exit 2
