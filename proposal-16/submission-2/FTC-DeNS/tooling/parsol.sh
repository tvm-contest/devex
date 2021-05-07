#!/bin/bash -eE

./sol.sh

cd ../build

echo "--- Starting linkers ---"
tvm_linker compile DensDebot.code -a DensDebot.abi.json -o DensDebot.tvc --lib ../bin/stdlib_sol.tvm \
  | grep -v 'TVM linker 0.1.0' | grep -v 'COMMIT_ID: ' | grep -v 'BUILD_DATE: ' | grep -v 'COMMIT_DATE: ' | grep -v 'GIT_BRANCH: master' &
tvm_linker compile DensRoot.code -a DensRoot.abi.json -o DensRoot.tvc --lib ../bin/stdlib_sol.tvm \
  | grep -v 'TVM linker 0.1.0' | grep -v 'COMMIT_ID: ' | grep -v 'BUILD_DATE: ' | grep -v 'COMMIT_DATE: ' | grep -v 'GIT_BRANCH: master' &
tvm_linker compile DensPlatform.code -a DensPlatform.abi.json -o DensPlatform.tvc --lib ../bin/stdlib_sol.tvm \
  | grep -v 'TVM linker 0.1.0' | grep -v 'COMMIT_ID: ' | grep -v 'BUILD_DATE: ' | grep -v 'COMMIT_DATE: ' | grep -v 'GIT_BRANCH: master' &
tvm_linker compile DensCertificate.code -a DensCertificate.abi.json -o DensCertificate.tvc --lib ../bin/stdlib_sol.tvm \
  | grep -v 'TVM linker 0.1.0' | grep -v 'COMMIT_ID: ' | grep -v 'BUILD_DATE: ' | grep -v 'COMMIT_DATE: ' | grep -v 'GIT_BRANCH: master' &
tvm_linker compile DensAuction.code -a DensAuction.abi.json -o DensAuction.tvc --lib ../bin/stdlib_sol.tvm \
  | grep -v 'TVM linker 0.1.0' | grep -v 'COMMIT_ID: ' | grep -v 'BUILD_DATE: ' | grep -v 'COMMIT_DATE: ' | grep -v 'GIT_BRANCH: master' &
tvm_linker compile DensBid.code -a DensBid.abi.json -o DensBid.tvc --lib ../bin/stdlib_sol.tvm \
  | grep -v 'TVM linker 0.1.0' | grep -v 'COMMIT_ID: ' | grep -v 'BUILD_DATE: ' | grep -v 'COMMIT_DATE: ' | grep -v 'GIT_BRANCH: master' &
tvm_linker compile DensTest.code -a DensTest.abi.json -o DensTest.tvc --lib ../bin/stdlib_sol.tvm \
  | grep -v 'TVM linker 0.1.0' | grep -v 'COMMIT_ID: ' | grep -v 'BUILD_DATE: ' | grep -v 'COMMIT_DATE: ' | grep -v 'GIT_BRANCH: master' &
