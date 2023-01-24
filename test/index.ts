import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import fs from "fs";
import path from "path";
import { PedersenHash } from "../typechain";
import { BigNumber, BigNumberish } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

interface BinaryProof {
  leftHash: BigNumberish;
  rightHash: BigNumberish;
}

interface EdgeProof {
  childHash: BigNumberish;
  path: BigNumberish;
  length: BigNumberish;
}

interface StarknetProof {
  nodeType: BigNumberish;
  binaryProof: BinaryProof;
  edgeProof: EdgeProof;
}

interface MyContractData {
  contractStateRoot: BigNumberish;
  contractAddress: BigNumberish;
  storageVarAddress: BigNumberish;
  classHash: BigNumberish;
  hashVersion: BigNumberish;
  nonce: BigNumberish;
}

function parseProofElement(element: any): StarknetProof {
  // console.log(JSON.stringify(element));
  if (element.binary != undefined) {
    return {
      nodeType: 0,
      binaryProof: {
        leftHash: element.binary.left,
        rightHash: element.binary.right,
      },
      edgeProof: {
        childHash: 0,
        path: 0,
        length: 0,
      },
    };
  } else if (element.edge != undefined) {
    return {
      nodeType: 1,
      binaryProof: {
        leftHash: 0,
        rightHash: 0,
      },
      edgeProof: {
        childHash: element.edge.child,
        path: element.edge.path.value,
        length: element.edge.path.len,
      },
    };
  } else {
    throw new Error("Invalid proof element");
  }
}

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
  let proofverifier: any;
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

    let myContractProofs: StarknetProof[] = [];
    let myStorageproofs: StarknetProof[] = [];
    var originalParse = JSON.parse(fs.readFileSync(filepath, "utf8"));

    originalParse.result.contract_proof.forEach((element: any) => {
      myContractProofs.push(parseProofElement(element));
    });

    // zero index for a single proof. the API supports multiple proofs but currently we only support one proof verification
    originalParse.result.contract_data.storage_proofs[0].forEach(
      (element: any) => {
        myStorageproofs.push(parseProofElement(element));
      }
    );

    const contractStateRoot = originalParse.result.contract_data.root;
    const contractData: MyContractData = {
      contractStateRoot: contractStateRoot,
      contractAddress: contractAddress,
      storageVarAddress: storageVarAddress,
      classHash: originalParse.result.contract_data.class_hash,
      hashVersion:
        originalParse.result.contract_data.contract_state_hash_version,
      nonce: originalParse.result.contract_data.nonce,
    };

    let coreContractBlockNumber =
      await starknetCoreContractStub.stateBlockNumber();
    console.log("Core contract block number: " + coreContractBlockNumber);
    const result = await proofverifier.verifiedStorageValue(
      coreContractBlockNumber,
      contractData,
      myContractProofs,
      myStorageproofs
    );

    return result;
  }
  // deploy the tables, pedersen and the verifier contract
  before(async () => {
    // Deploy Pederson Tables
    const contracts = await deployTables();
    accounts = await ethers.getSigners();
    try {
      const PedersenHash = await ethers.getContractFactory("PedersenHash");
      pedersenHash = await PedersenHash.deploy(
        contracts.map((c: any) => c.address as string)
      );
      await pedersenHash.deployed();
      console.log(
        "PedersenHash contract has been deployed to: ",
        pedersenHash.address
      );

      const StarknetCoreContractStub = await ethers.getContractFactory(
        "StarknetCoreContractStub"
      );
      starknetCoreContractStub = await StarknetCoreContractStub.deploy();
      await starknetCoreContractStub.deployed();

      console.log(
        "StarknetCoreContractStub contract has been deployed to: ",
        starknetCoreContractStub.address
      );

      const StarknetVerifier = await ethers.getContractFactory(
        "StarknetVerifier"
      );

      const proofProxy = await upgrades.deployProxy(
        StarknetVerifier,
        [pedersenHash.address, starknetCoreContractStub.address],
        { kind: "uups" }
      );
      proofverifier = await proofProxy.deployed();

      await proofverifier.deployed();
      console.log(
        "Verifier contract has been deployed to: ",
        proofverifier.address
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
    const resultFromStarknetVerifier:BigNumber = await proofverifier.hash(a, b);
    expect(resultFromStarknetVerifier.toString()).to.be.eq(result[0]);
  });

  it("it should verify the sampleproof1.json", async function () {
    var jsonFile = "./sampleProof1.json";
    const contractAddress =
      "0x6fbd460228d843b7fbef670ff15607bf72e19fa94de21e29811ada167b4ca39";
    const storageVarAddress =
      "0x0206F38F7E4F15E87567361213C28F235CCCDAA1D7FD34C9DB1DFE9489C6A091";
    const expectedStorageVarValue = "0x1e240";
    var result = await getVerifiedStorageValue(
      contractAddress,
      storageVarAddress,
      jsonFile
    );
    console.log("Result: " + result);
    expect(result).to.equal(expectedStorageVarValue);
  });

  it("it should verify the sampleproof2.json", async function () {
    var jsonFile = "./sampleProof2.json";
    const contractAddress =
      "0x048a64f708011fb5089778204f37d6111bd9bbac0fe4b6e7851292b8cbeeb6ef";
    const storageVarAddress =
      "0x3284999a2939a8b54b2831813deb324170904a9a5145470eca917d66eb69708";
    const expectedStorageVarValue =
      "0x1C62C52C1709ACB3EB9195594E39C04323658463CFE0C641E39B99A83BA11A1";
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
      "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
    const storageVarAddress =
      "0x5b591ebdce191ad38e7c15ddf7b7913c3756c431f6e6e684e87c1f87023a0fe";
    const expectedStorageVarValue = "0xfc0d9ddcd6892";
    var result = await getVerifiedStorageValue(
      contractAddress,
      storageVarAddress,
      jsonFile
    );
    console.log("Result: " + result);
    expect(result).to.equal(expectedStorageVarValue);
  });
});
