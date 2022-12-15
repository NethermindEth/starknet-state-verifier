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

const deploy_tables = async () => {
  let contracts: any[] = [];
  const PrecomputedTableState = await ethers.getContractFactory(
    "PrecomputedTableState"
  );

  const address = await ethers.provider.getSigner().getAddress()

  console.log("Deploying tables...");
  let deploymentPromises = [];
  // Sequentially deploy the tables to avoid nonce issues
  for (const i in new Array(64).fill(0)) {
    const contract = await PrecomputedTableState.deploy();
    contracts.push(contract);
    deploymentPromises.push(contract.deployed());
  }

  // wait for all the promises to end.
  await Promise.all(deploymentPromises);
  console.log("Tables deployed!");


  let populationPromises = []
  let nonce = await ethers.provider.getTransactionCount(address);
  for (let i = 0; i < 64; ++i) {
    const points = shiftedPrecomputes[i];

    const toHex = (p: any) => `0x${p.toString(16)}`;

    const pointsArr = points.reduce((acc: string[], p: any) => {
      acc.push(toHex(p.getX()), toHex(p.getY()));
      return acc;
    }, []);

    const chunks = chunk(pointsArr, 128);
    const contract = contracts[i];
    for (const [j, chunk] of chunks.entries()) {
      populationPromises.push(contract.populate(chunk as any, j * 128,{nonce:nonce++}))
    }
  }
  await Promise.all(populationPromises);
  console.log("Tables populated!");
  return contracts;
}

const verify = async () => {
  const contracts = await deploy_tables();
  var jsonFile = "../test/sampleProof.json";
  console.log("Reading file: " + jsonFile);
  var filepath = path.resolve(__dirname, jsonFile)
  console.log("Filepath: " + filepath);

  let myproofs: MyStarknetProof[] = [];
  var originalParse = JSON.parse(fs.readFileSync(filepath, 'utf8'))
  originalParse.result.contract_proof.forEach((element: any) => {
    if (element.Binary != undefined) {
      myproofs.push({
        nodeType: 0,
        binaryProof: {
          leftHash: element.Binary.left,
          rightHash: element.Binary.right
        },
        edgeProof: {
          childHash: 0,
          path: 0,
          length: 0
        }
      })
    } else if (element.Edge != undefined) {
      myproofs.push({
        nodeType: 1,
        binaryProof: {
          leftHash: 0,
          rightHash: 0
        },
        edgeProof: {
          childHash: element.Edge.child,
          path: element.Edge.path.value,
          length: element.Edge.path.len
        }
      });
    }
  });

  console.log("Proofs: " + myproofs.toString());

  let pedersenHash: any;
  try {
    const PedersenHash = await ethers.getContractFactory("PedersenHash");
    pedersenHash = await PedersenHash.deploy(
      contracts.map((c: any) => {
        return c.address
      })
    );
    await pedersenHash.deployed();
  } catch (e) {
    console.log(e)
  }

  console.log("PedersenHash contract has been deployed to: ", pedersenHash.address);
  let proofverifier: any;
  try {
    const StarknetVerifier = await ethers.getContractFactory("StarknetVerifier");
    proofverifier = await StarknetVerifier.deploy(pedersenHash.address);
    await proofverifier.deployed();
  } catch (e) {
    console.log(e);
  }


  console.log("Verifier contract has been deployed to: ", proofverifier.address);
  const result = await proofverifier.verify_proof("0x1a5b65e4c309eb17b135fc9fcbf4201cf6c049fdf72c8180f0bb03c4d0eca37", "0x6fbd460228d843b7fbef670ff15607bf72e19fa94de21e29811ada167b4ca39", "0x64233179314709baca174fce33d3691638260a7c5569b74a8efd30998753c9f", myproofs);
  console.log("Result: " + result);
}

verify();
