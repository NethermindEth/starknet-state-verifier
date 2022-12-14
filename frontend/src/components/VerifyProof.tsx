import React, {useEffect, useState} from 'react';
import * as ethers from "ethers";
import {BigNumberish, Signer} from "ethers";
import {useAccount, useConnect, useContractRead, useDisconnect, useProvider, useSigner} from 'wagmi'
import {InjectedConnector} from 'wagmi/connectors/injected'
import {Button, Heading} from "@chakra-ui/react";
import StarknetVerifier from "../../../artifacts/contracts/StarknetVerifier.sol/StarknetVerifier.json";

interface Props {
  proof: any
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


const VerifyProof = (props: Props) => {
  const [rootHash, setRootHash] = useState('');
  const [path, setPath] = useState('');
  const [value, setValue] = useState('');
  const [proofArray, setProofArray] = useState([]);
  const [result, setResult] = useState(null);
  const [web3, setWeb3] = useState<any>();

  const contract = useContractRead({
    address: '0x262e2b50219620226C5fB5956432A88fffd94Ba7',
    abi: StarknetVerifier.abi,
    functionName: 'verify_proof',
    args: ["0x1a5b65e4c309eb17b135fc9fcbf4201cf6c049fdf72c8180f0bb03c4d0eca37", "0x6fbd460228d843b7fbef670ff15607bf72e19fa94de21e29811ada167b4ca39", "0x64233179314709baca174fce33d3691638260a7c5569b74a8efd30998753c9f", proofArray],
    enabled: false
  })

  const {address, isConnected} = useAccount()
  const {connect} = useConnect({
    connector: new InjectedConnector(),
  })
  const {data: signer, isError, isLoading} = useSigner()
  const {disconnect} = useDisconnect()
  const provider = useProvider()


  const parseProof = (proof: any) => {
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

    console.log("Proofs: " + myproofs.toString())
    setProofArray(myproofs as any)
  }

  useEffect(()=>{
    parseProof(props.proof);
  },[props.proof])

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    console.log('submitting')
    if (!isConnected) {
      connect();
    } else {
      console.log("connected to", address)
    }
  };

  const deployVerifier = async () => {
    try {

      console.log(contract)
      console.log(proofArray)
      try {
        await contract.refetch()
      } catch (e) {
        console.log(e)

      }
      console.log(contract)
      console.log(contract.data)


    } catch (e) {
      console.log(e)
    }

  }

  return (
    <>
      {/*TODO*/}
      <Heading as={"h3"}>Verify proof</Heading>
      <Button onClick={deployVerifier}>Deploy Verifier</Button>
      <Button onClick={handleSubmit}>Verify</Button>
    </>

  );
};

export default VerifyProof;
