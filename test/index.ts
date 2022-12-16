import { expect } from "chai";
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { StarknetVerifier } from '../typechain/StarknetVerifier';
import { StarknetVerifier__factory } from "../typechain/factories/StarknetVerifier__factory";
import { PedersenHash, PedersenHashNaive } from "../typechain";
import {
  pedersen as shiftedTablesPedersen,
  precomputes as shiftedPrecomputes,
} from "../lib/shifted_tables";

function chunk<T>(arr: T[], len: number): T[][] {
  const chunks: T[][] = [];
  let i = 0;
  const n = arr.length;

  while (i < n) {
    chunks.push(arr.slice(i, (i += len)));
  }

  return chunks;
}

import {
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  BaseContract,
  ContractTransaction,
  CallOverrides,
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
  stateRoot: BigNumberish;
  contractStateRoot: BigNumberish;
  contractAddress: BigNumberish;
  storageVarAddress: BigNumberish;
  storageVarValue: BigNumberish;
  classHash: BigNumberish;
  hashVersion: BigNumberish;
  nonce: BigNumberish;
}

function parseProofElement(element: any): MyStarknetProof {
  if (element.Binary != undefined) {
    return {
      nodeType: 0,
      binaryProof: {
        leftHash: element.Binary.left,
        rightHash: element.Binary.right,
      },
      edgeProof: {
        childHash: 0,
        path: 0,
        length: 0,
      },
    };
  } else if (element.Edge != undefined) {
    return {
      nodeType: 1,
      binaryProof: {
        leftHash: 0,
        rightHash: 0,
      },
      edgeProof: {
        childHash: element.Edge.child,
        path: element.Edge.path.value,
        length: element.Edge.path.len,
      },
    };
  } else {
    throw new Error("Invalid proof element");
  }
}


describe("Verify", function () {

  // it("Time test for a simple hash", async function () {
  //   const PedersenFactory = await ethers.getContractFactory("PedersenHash");
  //   const pedersen: PedersenHash = await PedersenFactory.attach("0x01cf58e264d7578D4C67022c58A24CbC4C4a304E");
  //   const result = await pedersen.hash("0x1a5b65e4c309eb17b135fc9fcbf4201cf6c049fdf72c8180f0bb03c4d0eca37", "0x1a5b65e4c309eb17b135fc9fcbf4201cf6c049fdf72c8180f0bb03c4d0eca37");
  //   console.log("Result: " + result);
  // });

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

    originalParse.result.contract_data.storage_proofs.forEach((element: any) => {
      myStorageproofs.push(parseProofElement(element));
    });

    // console.log("contract Proofs: " + myContractProofs.toString());
    // console.log("storage Proofs: " + myStorageproofs.toString());

    const StarknetVerifier = await ethers.getContractFactory("StarknetVerifier");

    // UPDATE THIS ADDRESS WITH THE DEPLOYED ADDRESS OF PEDERSENHASH, Run the deploy script to get the address
    const proofverifier = await StarknetVerifier.deploy("0x59C4e2c6a6dC27c259D6d067a039c831e1ff4947");
    await proofverifier.deployed();

    console.log("Deployed to: ", proofverifier.address);
    const starknetStateRoot = "0x1a5b65e4c309eb17b135fc9fcbf4201cf6c049fdf72c8180f0bb03c4d0eca37";
    const contractAddress = "0x6fbd460228d843b7fbef670ff15607bf72e19fa94de21e29811ada167b4ca39";
    const storageVarAddress = "0x0206F38F7E4F15E87567361213C28F235CCCDAA1D7FD34C9DB1DFE9489C6A091";
    const contractStateRoot = originalParse.result.contract_data.root;
    const storageVarValue = "0x1e240";

    const contractData: MyContractData = {
      stateRoot: starknetStateRoot,
      contractStateRoot: contractStateRoot,
      contractAddress: contractAddress,
      storageVarAddress: storageVarAddress,
      storageVarValue: storageVarValue,
      classHash: originalParse.result.contract_data.class_hash,
      hashVersion: originalParse.result.contract_data.contract_state_hash_version,
      nonce: originalParse.result.contract_data.nonce
    };

    const result = await proofverifier.verifyCompleteProof(contractData
      , myContractProofs, myStorageproofs);
    console.log("Result: " + result);
    expect(result).to.equal(true);
  });
});
