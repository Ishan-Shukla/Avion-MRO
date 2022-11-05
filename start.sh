#!/bin/bash

# Exit on first error
set -e

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1
starttime=$(date +%s)

# Start Fabric Network with chaincode deployment
echo "Starting Fabric Network with chaincode Deployment"
pushd ./chaincode
./startFabric.sh
popd

# Enrolling Admin and Registring User
echo "Enrolling Admin and Registring User"
pushd ./api/src
node enrollAdmin.js
node registerUser.js
popd

echo "<<< Success >>>"


echo "Total setup execution time : $(($(date +%s) - starttime)) secs ..."