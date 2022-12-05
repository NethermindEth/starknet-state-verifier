import { expect } from "chai";
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { StarknetVerifier } from '../typechain/StarknetVerifier';
import { StarknetVerifier__factory } from "../typechain/factories/StarknetVerifier__factory";
import { PedersenHashNaive } from "../typechain";
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


describe("Verify", function () {
  it("it should verify the proof", async function () {
    var jsonFile = "./sampleProof.json";
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
      }
      else if (element.Edge != undefined) {
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


    // var myproofs = JSON.parse(fs.readFileSync(filepath, 'utf8'), (key, value) => {
    //   console.log("Key: " + key + " Value: " + value);
    //   if (key == "Binary") {
    //     return {
    //       nodeType: 0,
    //       binaryProof: {
    //         leftHash: value.left_hash,
    //         rightHash: value.right_hash
    //       },
    //       edgeProof: {
    //         childHash: 0,
    //         path: 0,
    //         length: 0
    //       }
    //     };
    //   }
    //   else if (key == "Edge") {
    //     return {
    //       nodeType: 1,
    //       binaryProof: {
    //         leftHash: 0,
    //         rightHash: 0
    //       },
    //       edgeProof: {
    //         childHash: value.child_hash,
    //         path: value.path,
    //         length: value.length
    //       }
    //     };
    //   }
    // });

    console.log("Proofs: " + myproofs.toString());

    const PedersenLib = await ethers.getContractFactory("PedersenHashNaive");
    const pedersenLib = await PedersenLib.deploy();
    await pedersenLib.deployed();

    const StarknetVerifier = await ethers.getContractFactory("StarknetVerifier", {
      libraries: {
        PedersenHashNaive: pedersenLib.address,
      }
    },
    );

    const proofverifier = await StarknetVerifier.deploy() as StarknetVerifier;
    await proofverifier.deployed();

    console.log("Deployed to: ", proofverifier.address);


    const result = await proofverifier.verify_proof("0x1a5b65e4c309eb17b135fc9fcbf4201cf6c049fdf72c8180f0bb03c4d0eca37", "0x206f38f7e4f15e87567361213c28f235cccdaa1d7fd34c9db1dfe9489c6a091", "0x64233179314709baca174fce33d3691638260a7c5569b74a8efd30998753c9f", myproofs);
    console.log("Result: " + result);

  });
});
