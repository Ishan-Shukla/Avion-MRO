#!/bin/bash

# Exit on first error
set -e

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1
starttime=$(date +%s)

# Start Fabric Network with chaincode deployment
echo "Starting Fabric Network with chaincode Deployment"
pushd ./chaincode
./endFabric.sh
popd

echo -e "\n <<< Success >>> \n"

echo "Total setup execution time : $(($(date +%s) - starttime)) secs ..."