#!/bin/bash

. ./env.sh

cmd ../cpp/pincode-client prepare "${PINCODE_PASSPHRASE}" || exit 2

zip provkey.bin.zip provkey.bin || exit 2
