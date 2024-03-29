import * as dotenv from "dotenv";

import { HardhatUserConfig, task, types } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import '@typechain/hardhat'
import '@nomiclabs/hardhat-ethers'
import fs from 'fs';
// hardhat.config.ts
import '@openzeppelin/hardhat-upgrades';

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("createWallet", "print out address, public and private key", async (_taskArgs, hre) => {
  const wallet = hre.ethers.Wallet.createRandom()
  console.log({
    address: wallet.address,
    // publicKey: wallet.publicKey,
    privateKey: wallet.privateKey,
  })
})

task("getBalance")
  // specify `--address` argument for the task, task arguments will be available as the 1st parameter `taskArgs` below
  .addParam("address")
  // specify handler function for the task, `hre` is the task context that contains `ethers` package
  .setAction(async (taskArgs, hre) => {
    // create RPC provider for Goerli network
    const provider = hre.ethers.getDefaultProvider("goerli");
    console.log(
      "$ETH",
      // format it from Gwei to ETH
      hre.ethers.utils.formatEther(
        // fetch wallet balance using its address
        await provider.getBalance(taskArgs.address)
      )
    );
  })

// Define a task to copy the ABI file to the destination folder
task('copy-abi', 'Copies the ABI file to the destination folder').setAction(async () => {
  // Check if the ABI file exists
  // Define the path to the ABI file
  console.log("Copying ABI file");
  const abiSourceL1ResolverPath = './artifacts/contracts/SNResolverStub.sol/SNResolverStub.json';
  const abiSourceCoreContractPath = './artifacts/contracts/SNStateProofVerifier.sol/StarknetCoreContract.json';
  const abiSourceResolverService = './artifacts/contracts/SNStateProofVerifier.sol/IStarknetResolverService.json';

  // Define the destination for front end
  const abiL1ResolverDestinationFrontEnd = '../frontend/src/abi/SNResolverStub.json';
  const abiCoreContractDestinationFrontEnd = '../frontend/src/abi/StarknetCoreContract.json';

  // Define the destination for gateway
  const abiL1ResolverDestinationGateway = '../gateway/src/SNResolverStub.json';
  const abiCoreContractDestinationGateway = '../gateway/src/StarknetCoreContract.json';
  const abiResolverServiceDestinationGateway = '../gateway/src/IStarknetResolverService.json';

  // Define the destination for testclient
  const abiL1ResolverDestinationTestClient = '../testclient/src/SNResolverStub.json';
  const abiResolverServiceDestinationTestClient = '../testclient/src/IStarknetResolverService.json';

  // front end
  fs.copyFile(abiSourceL1ResolverPath, abiL1ResolverDestinationFrontEnd, (err) => {
    if (err)
      throw err;
    console.log(`ABI file copied to ${abiL1ResolverDestinationFrontEnd}`);
  });
  fs.copyFile(abiSourceCoreContractPath, abiCoreContractDestinationFrontEnd, (err) => {
    if (err)
      throw err;
    console.log(`ABI file copied to ${abiCoreContractDestinationFrontEnd}`);
  });

  // gateway
  fs.copyFile(abiSourceL1ResolverPath, abiL1ResolverDestinationGateway, (err) => {
    if (err)
      throw err;
    console.log(`ABI file copied to ${abiL1ResolverDestinationGateway}`);
  });
  fs.copyFile(abiSourceCoreContractPath, abiCoreContractDestinationGateway, (err) => {
    if (err)
      throw err;
    console.log(`ABI file copied to ${abiCoreContractDestinationGateway}`);
  });
  fs.copyFile(abiSourceResolverService, abiResolverServiceDestinationGateway, (err) => {
    if (err)
      throw err;
    console.log(`ABI file copied to ${abiResolverServiceDestinationGateway}`);
  });

  // test client
  fs.copyFile(abiSourceL1ResolverPath, abiL1ResolverDestinationTestClient, (err) => {
    if (err)
      throw err;
    console.log(`ABI file copied to ${abiL1ResolverDestinationTestClient}`);
  });
  fs.copyFile(abiSourceResolverService, abiResolverServiceDestinationTestClient, (err) => {
    if (err)
      throw err;
    console.log(`ABI file copied to ${abiResolverServiceDestinationTestClient}`);
  });




});


// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
const GOERLI_RPC_URL = process.env.GOERLI_ETHEREUM_API_URL
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || ""

const userconfig: HardhatUserConfig = {
  solidity: "0.8.4",
  defaultNetwork: "anvil",
  networks: {
    anvil: {
      url: "http://localhost:8545",
      blockGasLimit: 190000000429720, // whatever you want here,
      gas: "auto",
      accounts: {
        accountsBalance: "10000347372345184000",
        mnemonic: "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
        passphrase: "",
      },
    },
    hardhat: {
      blockGasLimit: 990000000429720,// whatever you want here,
      gas: "auto",
      accounts: {
        accountsBalance: "111045000347372345184000",
        mnemonic: "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
        passphrase: "",
      },
    },
    goerli: {
      url: GOERLI_RPC_URL,
      gas: "auto",
      accounts: [WALLET_PRIVATE_KEY]
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  mocha: {
    timeout: 2 ** 53 - 1
  },
};

// module.exports = {
//   // other config options
//   // hooks: {
//   //   'post-compile': async (contract, any) => {
//   //     console.log("Copying ABI file");
//   //     const abiSourceFilePath = './artifacts/contracts/StarknetVerifier.sol/StarknetVerifier.json';

//   //     // Define the destination folder for the ABI file
//   //     const abiDestinationFilePath = './frontend/src/abi/StarknetVerifier.json';

//   //     // File "destination.txt" will be created or overwritten by default.
//   //     fs.copyFile(abiSourceFilePath, abiDestinationFilePath, (err) => {
//   //       if (err)
//   //         throw err;
//   //       console.log(`ABI file copied to ${abiDestinationFilePath}`);
//   //     });
//   //   },
//   // },
//   // default export
//   default:
//     userconfig
// };
export default userconfig;
