#!/bin/sh
PLATFORM=$1
if [ "$PLATFORM" = "" ]; then
read -p "Enter Value (darwin/amd64,windows/amd64,linux/amd64,linux/arm): " PLATFORM
PLATFORM=${PLATFORM:-local}
fi
echo $PLATFORM
rm -R build 2> /dev/null
DOCKER_BUILDKIT=1 docker build . --target bin --output build --platform $PLATFORM