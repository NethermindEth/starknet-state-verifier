import { expect } from "chai";
import { ethers } from "hardhat";
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
}

const deployAll = async () => {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const contracts = await deployTables();

  let pedersenHash: any;
  try {
    const PedersenHash = await ethers.getContractFactory("PedersenHash");
    pedersenHash = await PedersenHash.deploy(
      contracts.map((c: any) => c.address as string)
    );

    await pedersenHash.deployed();
  } catch (e) {
    console.log(e)
  }

  console.log("PedersenHash contract has been deployed to: ", pedersenHash.address);
  let proofverifier: any;
  try {
    const StarknetVerifier = await ethers.getContractFactory("StarknetVerifier");
    proofverifier = await StarknetVerifier.deploy(pedersenHash.address/*, starknetCoreContractAddress*/);
    await proofverifier.deployed();
  } catch (e) {
    console.log(e);
  }
  console.log("Verifier contract has been deployed to: ", proofverifier.address);
}

deployAll();
//deployVerifier("0x922D6956C99E12DFeB3224DEA977D0939758A1Fe");