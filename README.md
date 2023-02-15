# Verify Starknet state proofs in solidity and resolve ENS names on l1 via starknet with the hep CCIP-Read enabed l1 resolver
This projects implements the verification of state/storage proofs for starknet on L1. We have built our custom contract(StarknetVerifier.sol) which verifies the state/storage proofs exported by pathfinder_getproof API. This repo utilizes a third party library/contract to calculate pedersen hashes(mentioned below) but implements custom verification and CCIP logic to enable ENS name resolution. Frontend (ccip-helper.nethermind.io) app demonstrates the proof verification and ens resolution via starknet. ENS resolution is WIP.

## Build and run UI Tool
```shell
cd frontend
yarn install
yarn build
yarn dev
```

## Deploy contracts
From the root folder run the following
```shell
cd contracts
yarn install
cp .env.example .env
npx hardhat run <--network yournetwork > scripts/deploy.ts
```
StarknetVerifier is the verifier and also l1resolver.

## Run contract tests
From the root folder run the following
```shell
cd contracts
npx hardhat test
```

Run tests with gas statistics report:
```shell
REPORT_GAS=true npx hardhat test 
```


## Other Hardhat commands

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat node
npx hardhat help
```

# Acknowledgements
Pedersen Hash implementation has been borrowed from https://github.com/Kelvyne/starknet-storage-proof-solidity. Many Thanks!

# Disclaimer
None of the contracts have been audited and shoud not be used in production.
