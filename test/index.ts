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
  }
  else {
    throw new Error("Invalid proof element");
  }
}

describe("simple table pedersen", () => {
  let contracts: any[];
  before(async () => {
    const PrecomputedTableState = await ethers.getContractFactory(
      "PrecomputedTableState"
    );

    contracts = await Promise.all(
      new Array(64).fill(0).map(async (_, i) => {
        const contract = await PrecomputedTableState.deploy();
        return contract;
      })
    );

    for (let i = 0; i < 64; ++i) {
      const points = shiftedPrecomputes[i];

      const toHex = (p: any) => `0x${p.toString(16)}`;

      const pointsArr = points.reduce((acc: string[], p: any) => {
        acc.push(toHex(p.getX()), toHex(p.getY()));
        return acc;
      }, []);

      const chunks = chunk(pointsArr, 128);
      const contract = contracts[i];
      await Promise.all(
        chunks.map((chunk, j) => contract.populate(chunk as any, j * 128))
      );
    }
    console.log("done");
  });


  describe("Verify", function () {
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

      console.log("contract Proofs: " + myContractProofs.toString());
      console.log("storage Proofs: " + myStorageproofs.toString());

      const PedersenHash = await ethers.getContractFactory("PedersenHash");
      const pedersenHash = await PedersenHash.deploy(
        contracts.map((c) => c.address)
      );

      await pedersenHash.deployed();
      const StarknetVerifier = await ethers.getContractFactory("StarknetVerifier");
      const proofverifier = await StarknetVerifier.deploy(pedersenHash.address);
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
      // const result = await proofverifier.verify_proof("0x1a5b65e4c309eb17b135fc9fcbf4201cf6c049fdf72c8180f0bb03c4d0eca37", "0x6fbd460228d843b7fbef670ff15607bf72e19fa94de21e29811ada167b4ca39", "0x64233179314709baca174fce33d3691638260a7c5569b74a8efd30998753c9f", myContractProofs);
      console.log("Result: " + result);

    });
  });
});
