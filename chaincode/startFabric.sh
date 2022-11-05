#!/bin/bash

# Exit on first error
set -e

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1
starttime=$(date +%s)

SRC_LANGUAGE="typescript"

# Change Path to new one/home/art3mix/avion/chaincode/typescript
SRC_PATH="../../chaincode/contract/"


# clean out any old identites in the wallets
rm -rf ../api/wallet/*

# launch network; create channel and join peer to channel
pushd ../fabric-network/test-network
./network.sh down
./network.sh up createChannel -c avorax -ca -s couchdb
./network.sh deployCC -c avorax -ccn avion -ccv 1 -cci initLedger -ccl ${SRC_LANGUAGE} -ccp ${SRC_PATH}
popd

cat <<EOF

Total setup execution time : $(($(date +%s) - starttime)) secs ...

Next, use the Avion applications to interact with the deployed Avion contract.
Follow the instructions below:

TypeScript:

  Start by changing into the "typescript" directory:
    cd typescript

  Next, install all required packages:
    npm install

  Next, compile the TypeScript code into JavaScript:
    npm run build

  Then run the following applications to enroll the admin user, and register a new user
  called appUser which will be used by the other applications to interact with the deployed
  FabCar contract:
    node dist/enrollAdmin
    node dist/registerUser

  You can run the invoke application as follows. By default, the invoke application will
  create a new car, but you can update the application to submit other transactions:
    node dist/invoke

  You can run the query application as follows. By default, the query application will
  return all cars, but you can update the application to evaluate other transactions:
    node dist/query

EOF

