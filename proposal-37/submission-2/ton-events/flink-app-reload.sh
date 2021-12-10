#!/bin/bash

set -eo pipefail

BASE_URL='127.0.0.1:18081'

if [ -n "$1" ]; then
    curl -s -X POST -H 'Expect:' -F "jarfile=@$1" "$BASE_URL/jars/upload" > /dev/null
fi

RUNNING_JOBS=$(curl -s "$BASE_URL/jobs" | jq -c '.jobs | map(select(.status == "RUNNING"))')
LAST_JOBID=$(echo "$RUNNING_JOBS" | jq -r 'last | .id')
SAVEPOINT=

if [[ "$LAST_JOBID" =~ ^[[:xdigit:]]{32}$ ]]; then
    REQUEST_ID=$(curl -s -X POST "$BASE_URL/jobs/$LAST_JOBID/savepoints" | jq -er '.["request-id"]')

    while [ -z "$SAVEPOINT" ]; do
        SAVEPOINT=$(curl -s "$BASE_URL/jobs/$LAST_JOBID/savepoints/$REQUEST_ID" \
            | jq -r 'select(.status.id == "COMPLETED") | .operation.location')

        if [ -z "$SAVEPOINT" ]; then
            sleep 5
        fi
    done
fi

for JOBID in $(echo "$RUNNING_JOBS" | jq -r '.[] | .id'); do
    curl -s -X PATCH "$BASE_URL/jobs/$JOBID" > /dev/null
done

EXTRA_ARGS='{}'

if [ -n "$SAVEPOINT" ]; then
    EXTRA_ARGS=$(echo "$EXTRA_ARGS" | jq -c --arg sp "$SAVEPOINT" \
        '. + {savepointPath: $sp, allowNonRestoredState: true}')
fi

JARID=$(curl -s "$BASE_URL/jars" | jq -er '.files | first | .id')

curl -s -X POST -H "Content-Type: application/json" -d "$EXTRA_ARGS" "$BASE_URL/jars/$JARID/run"

