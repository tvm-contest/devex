#!/bin/bash -eE

docker run --name notify-api \
  -v /var/docker/data/notify-api:/home/node/app/data \
  -p 3010:3000 \
  --read-only \
  -d \
  -e KAFKA_HOST=’YOUR_VALUE’\
  -e KAFKA_CLIENT_ID=’YOUR_VALUE’ \
  -e SASL_MECHANISM=’YOUR_VALUE’ \
  -e SASL_USERNAME=’YOUR_VALUE’ \
  -e SASL_PASSWORD=’YOUR_VALUE’ \
  -e GROUP_ID=’YOUR_VALUE’ \
  -e TOPIC=’YOUR_VALUE’ \
  notify-api
