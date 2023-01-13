# Verify Starknet proofs in solidity

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
yarn install
cp .env.example .env
npx hardhat run <--network yournetwork > scripts/deploy.ts
```

## Run contract tests
From the root folder run the following
```shell
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
