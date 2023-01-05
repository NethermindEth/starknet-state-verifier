import { expect } from "chai";
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { PedersenHash } from "../typechain";
import {
  BigNumberish,
} from "ethers";

interface MyBinaryProof {
  leftHash: BigNumberish;
  rightHash: BigNumberish;
}

interface MyEdgeProof {
  childHash: BigNumberish;
  path: BigNumberish;
  length: BigNumberish;
}

interface MyStarknetProof {
  nodeType: BigNumberish;
  binaryProof: MyBinaryProof;
  edgeProof: MyEdgeProof;
}

interface MyContractData {
  contractStateRoot: BigNumberish;
  contractAddress: BigNumberish;
  storageVarAddress: BigNumberish;
  classHash: BigNumberish;
  hashVersion: BigNumberish;
  nonce: BigNumberish;
}

function parseProofElement(element: any): MyStarknetProof {
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
}



describe("Verify", function () {
  let pedersenHash: any;
  let proofverifier: any;
  let starknetCoreContractStub: any;

  before(async () => {
    const contracts = await deployTables();
    try {
      const PedersenHash = await ethers.getContractFactory("PedersenHash");
      pedersenHash = await PedersenHash.deploy(
        contracts.map((c: any) => c.address as string)
      );
      await pedersenHash.deployed();
      console.log("PedersenHash contract has been deployed to: ", pedersenHash.address);

      const StarknetCoreContractStub = await ethers.getContractFactory("StarknetCoreContractStub");
      starknetCoreContractStub = await StarknetCoreContractStub.deploy();
      await starknetCoreContractStub.deployed();
      console.log("StarknetCoreContractStub contract has been deployed to: ", starknetCoreContractStub.address);

      const StarknetVerifier = await ethers.getContractFactory("StarknetVerifier");
      proofverifier = await StarknetVerifier.deploy(pedersenHash.address, starknetCoreContractStub.address);
      await proofverifier.deployed();
      console.log("Verifier contract has been deployed to: ", proofverifier.address);

    } catch (e) {
      console.log(e)
    }
  });

  it("Time test for a simple hash", async function () {
    const PedersenFactory = await ethers.getContractFactory("PedersenHash");
    const pedersen: PedersenHash = await PedersenFactory.attach("0x922D6956C99E12DFeB3224DEA977D0939758A1Fe");
    const input = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "uint256"],
      ["0x1a5b65e4c309eb17b135fc9fcbf4201cf6c049fdf72c8180f0bb03c4d0eca37", "0x1a5b65e4c309eb17b135fc9fcbf4201cf6c049fdf72c8180f0bb03c4d0eca37"]
    );

    const result = await pedersen.hash(input);
    console.log("Result: " + result[0]);
  });

  it("it should verify the proof", async function () {
    var jsonFile = "./sampleProof.json";
    console.log("Reading file: " + jsonFile);
    var filepath = path.resolve(__dirname, jsonFile)
    console.log("Filepath: " + filepath);

    let myContractProofs: MyStarknetProof[] = [];
    let myStorageproofs: MyStarknetProof[] = [];
    var originalParse = JSON.parse(fs.readFileSync(filepath, 'utf8'))

    originalParse.result.contract_proof.forEach((element: any) => {
      myContractProofs.push(parseProofElement(element));
    });

    // zero index for a single proof. the API supports multiple proofs but currently we only support one proof verification
    originalParse.result.contract_data.storage_proofs[0].forEach((element: any) => {
      myStorageproofs.push(parseProofElement(element));
    });

    const contractAddress = "0x6fbd460228d843b7fbef670ff15607bf72e19fa94de21e29811ada167b4ca39";
    const storageVarAddress = "0x0206F38F7E4F15E87567361213C28F235CCCDAA1D7FD34C9DB1DFE9489C6A091";
    const contractStateRoot = originalParse.result.contract_data.root;
    const expectedStorageVarValue = "0x1e240";

    const contractData: MyContractData = {
      contractStateRoot: contractStateRoot,
      contractAddress: contractAddress,
      storageVarAddress: storageVarAddress,
      classHash: originalParse.result.contract_data.class_hash,
      hashVersion: originalParse.result.contract_data.contract_state_hash_version,
      nonce: originalParse.result.contract_data.nonce
    };

    const result = await proofverifier.verifiedStorageValue(contractData
      , myContractProofs, myStorageproofs);
    console.log("Result: " + result);
    expect(result).to.equal(expectedStorageVarValue);
  });
});
