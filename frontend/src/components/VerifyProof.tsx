import React, {useEffect, useState} from 'react';
import * as ethers from "ethers";
import {BigNumberish} from "ethers";

interface Props{
  proof:any
}

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


const VerifyProof = (props:Props) => {
  const [rootHash, setRootHash] = useState('');
  const [path, setPath] = useState('');
  const [value, setValue] = useState('');
  const [proofArray, setProofArray] = useState([]);
  const [result, setResult] = useState(null);
  const [web3, setWeb3] = useState<any>();

  const parseProof = (proof:any) => {
    let myproofs: MyStarknetProof[] = [];
    proof.contract_proof.forEach((element: any) => {
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

    console.log("Proofs: " + myproofs.toString());
  }

  const handleSubmit = async (event:any) => {
    event.preventDefault();

    // Check if the user has MetaMask installed
    if (window.ethereum) {
      // Initialize ethers.js
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      // Request access to the user's accounts
      window.ethereum.enable().then(() => {
        // Set the web3 instance
        setWeb3(provider);
      });
    }

    try {
      // const contract = new web3.eth.Contract(
      //   StarknetVerifier.abi,
      //   StarknetVerifier.address
      // );

      // get the values from the L2 merkle proof
      // const result = await contract.verify_proof(
      //   rootHash,
      //   path,
      //   value,
      //   proofArray
      // );

      // setResult(result);
    } catch (e) {
      console.log(e)
    }
  };

  return (
    <>
      {/*TODO*/}
      Verify proof
    </>

  );
};

export default VerifyProof;
