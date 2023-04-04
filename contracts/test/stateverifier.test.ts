import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import fs from "fs";
import path from "path";
import { PedersenHash } from "../typechain";
import { BigNumber, BigNumberish } from "ethers/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { parseStarknetProof, StarknetProof, StarknetCompositeStateProof, BinaryProof, EdgeProof } from 'pathfinder_getproof_lib'


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

describe("Verify", function () {
  let pedersenHash: any;
  let l1resolverStub: any;
  let starknetCoreContractStub: any;
  let accounts: SignerWithAddress[];

  // Helper method to fetch the verified storage value from the proof
  async function getVerifiedStorageValue(
    contractAddress: BigNumberish,
    storageVarAddress: BigNumberish,
    filename: string
  ) {
    var jsonFile = filename;
    console.log("Reading file: " + jsonFile);
    var filepath = path.resolve(__dirname, jsonFile);
    console.log("Filepath: " + filepath);
    let coreContractBlockNumber =
      await starknetCoreContractStub.stateBlockNumber();

    // let myContractProofs: StarknetProof[] = [];
    // let myStorageproofs: StarknetProof[] = [];
    var originalParse = JSON.parse(fs.readFileSync(filepath, "utf8"));
    var compositeProof: StarknetCompositeStateProof = parseStarknetProof(originalParse.result, contractAddress, storageVarAddress, coreContractBlockNumber);

    console.log("Core contract block number: " + coreContractBlockNumber);
    const result = await l1resolverStub.verifiedStorageValue(
      coreContractBlockNumber,
      compositeProof.classCommitment,
      compositeProof.contractData,
      compositeProof.contractProofArray,
      compositeProof.storageProofArray
    );

    return result;
  }
  // deploy the tables, pedersen and the verifier contract
  before(async () => {
    // Deploy Pederson Tables
    const contracts = await deployTables();
    accounts = await ethers.getSigners();
    try {
      const generatedPath = path.join(__dirname, "..", "generated");

      //////////POSEIDON DEPLOYMENT
      const poseidonBytecodePath = path.join(generatedPath, `poseidon.bytecode`);
      const poseidonBytecode = fs.readFileSync(poseidonBytecodePath);
      const poseidonAbiPath = path.join(generatedPath, `poseidon.abi`);
      const poseidonAbi = fs.readFileSync(poseidonAbiPath);
      const Poseidon3 = new ethers.ContractFactory(
        poseidonAbi.toString(),
        poseidonBytecode.toString(),
        accounts[0]
      );
      const poseidon3 = await Poseidon3.deploy();
      await poseidon3.deployed();
      console.log("Poseidon3 contract has been deployed to: ", poseidon3.address);

      //////////PEDERSEN DEPLOYMENT
      const PedersenHash = await ethers.getContractFactory("PedersenHash");
      pedersenHash = await PedersenHash.deploy(
        contracts.map((c: any) => c.address as string)
      );
      await pedersenHash.deployed();
      console.log(
        "PedersenHash contract has been deployed to: ",
        pedersenHash.address
      );

      //////////StarknetCoreContract STUB DEPLOYMENT(ONLY FOR TESTING)
      const StarknetCoreContractStub = await ethers.getContractFactory(
        "StarknetCoreContractStub"
      );
      starknetCoreContractStub = await StarknetCoreContractStub.deploy();
      await starknetCoreContractStub.deployed();
      console.log(
        "StarknetCoreContractStub contract has been deployed to: ",
        starknetCoreContractStub.address
      );

      //////////VERIFIER + L1 RESOLVER DEPLOYMENT (they are the same class)
      const SNResolverStub = await ethers.getContractFactory(
        "SNResolverStub"
      );
      const proofProxy = await upgrades.deployProxy(
        SNResolverStub,
        [pedersenHash.address, poseidon3.address, starknetCoreContractStub.address, ["https://localhost:9545/{sender}/{data}.json"], '0x7412b9155cdb517c5d24e1c80f4af96f31f221151aab9a9a1b67f380a349ea3'],
        {
          kind: "uups",
          initializer: "initialize(address,address, address,string[],uint256)"
        }
      );
      l1resolverStub = await proofProxy.deployed();

      await l1resolverStub.deployed();
      console.log(
        "Verifier/l1resolver contract has been deployed to: ",
        l1resolverStub.address
      );
    } catch (e) {
      console.log(e);
    }
  });

  it("Time test for a simple hash", async function () {
    const a =
      "0x1a5b65e4c309eb17b135fc9fcbf4201cf6c049fdf72c8180f0bb03c4d0eca37";
    const b =
      "0x1a5b65e4c309eb17b135fc9fcbf4201cf6c049fdf72c8180f0bb03c4d0eca37";
    const input = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "uint256"],
      [a, b]
    );

    const result = await pedersenHash.hash(input);
    const resultFromStarknetVerifier: BigNumber = await l1resolverStub.hash(a, b);
    expect(resultFromStarknetVerifier.toString()).to.be.eq(result[0]);
  });

  it(" test for a poseidon array", async function () {
    const result = await l1resolverStub.poseidonHashMany(["28355430774503553497671514844211693180464", "0x34894aedf9548524f9e5bb189472d25abe3c38befd577c90886a7c519e5eee4", "0x70c5acad61a421be9c2945b921e263f2699c668f20d31c90660e91b32ea99de"]);
    console.log("Result: poseidon array ", result);
    expect(result).to.eq("0x7d608b218ca14fd5174b0fc40a9ea0c34bf7f855533323f348c47c9aa89fe90");
  });


  it("it should verify the sampleproof1.json", async function () {
    var jsonFile = "./sampleProof1.json";
    const contractAddress =
      "0x7412b9155cdb517c5d24e1c80f4af96f31f221151aab9a9a1b67f380a349ea3";
    const storageVarAddress =
      "0x4b14f70a10d78816915e32a2bffa292270624cf4868f40cd489f78e2edc5bb4";
    const expectedStorageVarValue = "3297450976341993905338014621774626109218148093827950687289193790013996697606";
    var result = await getVerifiedStorageValue(
      contractAddress,
      storageVarAddress,
      jsonFile
    );
    console.log("Result: " + result);
    expect(result).to.equal(expectedStorageVarValue);
  });

  it("it should verify the sampleproof2.json", async function () {
    //ETH ERC20 contract proof
    var jsonFile = "./sampleProof2.json";
    const contractAddress =
      "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
    const storageVarAddress =
      "0x5b591ebdce191ad38e7c15ddf7b7913c3756c431f6e6e684e87c1f87023a0fe";
    const expectedStorageVarValue =
      "167316537742136665";
    var result = await getVerifiedStorageValue(
      contractAddress,
      storageVarAddress,
      jsonFile
    );
    console.log("Result: " + result);
    expect(result).to.equal(expectedStorageVarValue);
  });

  it("it should verify the sampleproof3.json", async function () {
    var jsonFile = "./sampleProof3.json";
    const contractAddress =
      "0x000684167f946c40e4fe022e8af0bd6d17a18b04d0a0bed7826fecb891648222";
    const storageVarAddress =
      "0x778220fed180f06f58a2d1b21e63a28f5ff0703186c7a8c742fb64e85f98ab3";
    const expectedStorageVarValue = "2024";
    var result = await getVerifiedStorageValue(
      contractAddress,
      storageVarAddress,
      jsonFile
    );
    console.log("Result: " + result);
    expect(result).to.equal(expectedStorageVarValue);
  });
});
