#!/bin/bash

set -eo pipefail

CALLBACK_URL=$1

if [ -z "$CALLBACK_URL" ]; then
    echo "Usage: $0 <callback URL>"
    exit 1
fi

curl -X POST -H 'Content-Type: application/json' \
	-d "{\"data\": \"$(printf '%s' $CALLBACK_URL | base64 -w0)\", \"hash\": \"4684e98f0b6562f8699a1bfe51f4228bd832864efebb02b278d2249eda8ab3ab\"}" \
    http://localhost:13000/api/v1/subscribe

