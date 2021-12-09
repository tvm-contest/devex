#!/bin/bash
set -e

tondev sol compile ./contracts/Image.sol
tondev sol compile ./contracts/UserCert.sol
tondev sol compile ./contracts/Token.sol
tondev sol compile ./contracts/NFTCollection.sol

tondev js wrap ./contracts/Image.abi.json
tondev js wrap ./contracts/UserCert.abi.json
tondev js wrap ./contracts/Token.abi.json
tondev js wrap ./contracts/NFTCollection.abi.json

