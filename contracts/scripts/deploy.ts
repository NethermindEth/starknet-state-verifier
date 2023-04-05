import { ethers, upgrades } from "hardhat";
import fs from "fs";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config();

const deployTables = async () => {
  let precomputedContracts: any[64] = [];
  for (const i in new Array(64).fill(0)) {
    const generatedPath = path.join(__dirname, "..", "generated");
    const bytecodePath = path.join(generatedPath, `${i}.bytecode`);
    const bytecode = fs.readFileSync(bytecodePath);

    const ContractCodePrecomputed = await ethers.getContractFactory(
      "ContractCodePrecomputed"
    );
    const factory = new ethers.ContractFactory(
      ContractCodePrecomputed.interface,
      bytecode.toString(),
      ContractCodePrecomputed.signer
    );

    console.log("Deploying contract: ", i);
    const contract = await factory.deploy();
    precomputedContracts.push(contract);
    await contract.deployed();
    console.log("Contract deployed: ", contract.address);
  }
  return precomputedContracts;
};

const deployAll = async () => {
  let pedersenHash: any;
  let l1resolverStub: any; // this is also the verifier
  let starknetCoreContractStub: any;

  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  try {
    const SNResolverStub = await ethers.getContractFactory(
      "SNResolverStub"
    );
    const network = await ethers.provider.getNetwork();

    console.log("Network: ", network.name);
    if (network.name == "goerli") {
      // GOERLI DEPLOYMENT can be expensive!!!!
      const gasPrice = await SNResolverStub.signer.getGasPrice();
      console.log(`Current gas price: ${gasPrice}`);

      const estimatedGas = await SNResolverStub.signer.estimateGas(
        SNResolverStub.getDeployTransaction(),
      );
      console.log(`Estimated gas: ${estimatedGas}`);
      const deploymentPrice = gasPrice.mul(estimatedGas);
      const deployerBalance = await SNResolverStub.signer.getBalance();
      console.log(`Deployer balance:  ${ethers.utils.formatEther(deployerBalance)}`);
      console.log(`Deployment price:  ${ethers.utils.formatEther(deploymentPrice)}`);
      if (deployerBalance.lt(deploymentPrice)) {
        throw new Error(
          `Insufficient funds. Top up your account balance by ${ethers.utils.formatEther(
            deploymentPrice.sub(deployerBalance),
          )}`,
        );
      }

      console.log("Deploying to Goerli");
      const proofProxy = await upgrades.deployProxy(
        SNResolverStub,
        [
          "0x1a1eB562D2caB99959352E40a03B52C00ba7a5b1", // pedersen already deployed on goerli (goerli eth is expensive, cant do reployments all the time)
          "0x84d43a8cbEbF4F43863f399c34c06fC109c957a4", // poseidon already deployed on goerli (goerli eth is expensive, cant do reployments all the time)
          "0xde29d060D45901Fb19ED6C6e959EB22d8626708e", // starknetcore contract address on goerli
          ["https://starknetens.ue.r.appspot.com/{sender}/{data}.json"], // per https://eips.ethereum.org/EIPS/eip-3668  the sender and data populated by the client library like ethers.js with data returned by the CCIP enabled contract via revert
          '0x7412b9155cdb517c5d24e1c80f4af96f31f221151aab9a9a1b67f380a349ea3' // L2 resolver contract address on starknet
        ],
        {
          initializer: "initialize(address,address,address,string[],uint256)"
        }
      );
      l1resolverStub = await proofProxy.deployed();
    } else if (network.name == "mainnet") {
      console.log("Deploying to Mainnet");
      // TODO: Add mainnet address
      // proofverifier = await StarknetVerifier.deploy(
      //   "XXXXXXX",
      //   "0xc662c410C0ECf747543f5bA90660f6ABeBD9C8c4"
      // );
      throw new Error(
        "Mainnet deployment not supported yet. Please use Goerli or Localhost"
      );
    } else {
      console.log("Deploying to Localhost");


      //////////POSEIDON DEPLOYMENT
      const generatedPath = path.join(__dirname, "..", "generated");
      const poseidonBytecodePath = path.join(generatedPath, `poseidon.bytecode`);
      const poseidonBytecode = fs.readFileSync(poseidonBytecodePath);
      const poseidonAbiPath = path.join(generatedPath, `poseidon.abi`);
      const poseidonAbi = fs.readFileSync(poseidonAbiPath);
      const Poseidon3 = new ethers.ContractFactory(
        poseidonAbi.toString(),
        poseidonBytecode.toString(),
        deployer
      );
      const poseidon3 = await Poseidon3.deploy();
      await poseidon3.deployed();
      console.log("Poseidon3 contract has been deployed to: ", poseidon3.address);

      //////////PEDERSEN DEPLOYMENT
      const contracts = await deployTables();
      const PedersenHash = await ethers.getContractFactory("PedersenHash");
      pedersenHash = await PedersenHash.deploy(
        contracts.map((c: any) => c.address as string)
      );
      await pedersenHash.deployed();
      console.log(
        "PedersenHash contract has been deployed to: ",
        pedersenHash.address
      );

      // TEST STUB FOR LOCAL TESTING
      const StarknetCoreContractStub = await ethers.getContractFactory(
        "StarknetCoreContractStub"
      );
      starknetCoreContractStub = await StarknetCoreContractStub.deploy();
      await starknetCoreContractStub.deployed();
      console.log(
        "StarknetCoreContractStub contract has been deployed to: ",
        starknetCoreContractStub.address
      );

      //L1Resolver deployment
      const proofProxy = await upgrades.deployProxy(
        SNResolverStub,
        [pedersenHash.address, poseidon3.address
          , starknetCoreContractStub.address, ["https://localhost:8080/{sender}/{data}.json"], '0x7412b9155cdb517c5d24e1c80f4af96f31f221151aab9a9a1b67f380a349ea3'],
        {
          initializer: "initialize(address,address,address,string[],uint256)"
        }
      );
      l1resolverStub = await proofProxy.deployed();
    }

    console.log(
      "Verifier/l1resolver contract has been deployed to: ",
      l1resolverStub.address
    );
  } catch (e) {
    console.log(e);
  }
};

deployAll();
