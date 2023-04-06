# Resolve ENS names on l1 via starknet
# Verify Starknet state/storage proofs in solidity. 
This projects implements the verification of state/storage proofs for starknet on L1. We have built our custom contract(SNStateProofVerifier.sol) which verifies the state/storage proofs exported by pathfinder_getproof API. This repo utilizes a third party library/contract to calculate pedersen hashes(mentioned below) but implements custom verification and CCIP logic to enable ENS name resolution. . Frontend (ccip-helper.nethermind.io) app demonstrates the proof verification and ens resolution via starknet. Full details of this request flow can be found in EIP 3668.

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

SNL1ResolverStub.sol inherits from SNStateProofVerifier.sol and has been deployed to Goerli at [0xBB49c34D4d92aC3207d589657fAC14186a470116](https://goerli.etherscan.io/address/0xBB49c34D4d92aC3207d589657fAC14186a470116)

On goerli Pedersen hash contract is already deployed at [0x1a1eB562D2caB99959352E40a03B52C00ba7a5b1](https://goerli.etherscan.io/address/0x1a1eB562D2caB99959352E40a03B52C00ba7a5b1)

Poseidon3(starkewares version) contracts EVM code has ben generated from the following repo and deployed on Goerli at [0x84d43a8cbEbF4F43863f399c34c06fC109c957a4](https://goerli.etherscan.io/address/0x84d43a8cbebf4f43863f399c34c06fc109c957a4).

https://github.com/NethermindEth/circomlibjs/

## Run contract tests
From the root folder run the following
```shell
cd contracts
npx hardhat test --network hardhat
```

Run tests with gas statistics report:
```shell
REPORT_GAS=true npx hardhat test 
```

## Build and deploy the gateway
From the root folder run the following. L2/Starknet resolver is already deployed on goerli at [0x7412b9155cdb517c5d24e1c80f4af96f31f221151aab9a9a1b67f380a349ea](https://goerli.voyager.online/contract/0x07412b9155cdb517c5d24e1c80f4af96f31f221151aab9a9a1b67f380a349ea3#readContract)
```shell
cd gateway
yarn install
yarn build
yarn start --l1_provider_url XXXXX --l2_provider_url XXXX  --l2_resolver_address 0x7412b9155cdb517c5d24e1c80f4af96f31f221151aab9a9a1b67f380a349ea
```

To deploy to google cloud.

```shell
gcloud app deploy goeril.app.yml
gcloud app logs tail -s default
```
Current implementation is already deployed for goerli at https://starknetens.ue.r.appspot.com


## L2 Resolver
This has been upgraded to cairo1 and deployed to [0x7412b9155cdb517c5d24e1c80f4af96f31f221151aab9a9a1b67f380a349ea](https://goerli.voyager.online/contract/0x07412b9155cdb517c5d24e1c80f4af96f31f221151aab9a9a1b67f380a349ea3#readContract) on goerli

# Acknowledgements
Pedersen Hash implementation has been borrowed from https://github.com/Kelvyne/starknet-storage-proof-solidity. Many Thanks!

Help taken from existing implementaion of optimism related solution at https://github.com/ensdomains/op-resolver.


# Disclaimer
None of the contracts have been audited and should not be used in production.
