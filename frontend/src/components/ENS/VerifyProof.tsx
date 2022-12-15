import React, {useEffect, useState} from 'react';
import {BigNumberish, Signer} from "ethers";
import {useContractRead} from 'wagmi'
import {Box, Button, FormLabel, Heading, HStack, Input, Text} from "@chakra-ui/react";
import StarknetVerifier from "../../../../artifacts/contracts/StarknetVerifier.sol/StarknetVerifier.json";

interface Props {
  proof: any
  storageAddress: string | undefined
  contractAddress: string | undefined
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


const VerifyProof = (props: Props) => {
  const [verifierAddress, setVerifierAddress] = useState<string>()
  const [starknetStateRoot, setStarknetStateRoot] = useState('');
  const [value, setValue] = useState('');
  const [storageProof, setStorageProof] = useState([]);
  const [contractProof, setContractProof] = useState([]);
  const [verificationResult, setVerificationResult] = useState<string>();
  const [submit, setSubmit] = useState(false);
  const [contractData, setContractData] = useState<MyContractData>();

  //FIXME here we only verify the first storage_proof as the contract doesn't allow to verify multiple proofs yet?
  const readContractVerifier = useContractRead({
    address: verifierAddress,
    abi: StarknetVerifier.abi,
    functionName: 'verifyCompleteProof',
    args: [contractData, contractProof, storageProof[0]],
    enabled: false
  });

  function parseProofElement(element: any): MyStarknetProof {
    console.log(element)
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


  useEffect(() => {
    /// parse proof JSON
    if (!props.proof) return
    let myContractProofs: any = [];
    let myStorageproofs: any = [];
    props.proof.contract_proof.forEach((element: any) => {
      myContractProofs.push(parseProofElement(element));
    });

    props.proof.contract_data.storage_proofs.forEach((storage_proof: any) => {
      let myStorageProof: any = [];
      storage_proof.forEach((element: any) => {
        myStorageProof.push(parseProofElement(element));
      });
      myStorageproofs.push(myStorageProof);
    });

    setContractProof(myContractProofs);
    setStorageProof(myStorageproofs);
  }, [props.proof])


  // recompute contract data used with the contractRead hook
  useEffect(() => {
    if (!(starknetStateRoot && value && props.proof && verifierAddress)) {
      return;
    }
    const _contractData: MyContractData = {
      stateRoot: starknetStateRoot,
      contractStateRoot: props.proof.contract_data.root,
      contractAddress: props.contractAddress!,
      storageVarAddress: props.storageAddress!,
      storageVarValue: value,
      classHash: props.proof.contract_data.class_hash,
      hashVersion: props.proof.contract_data.contract_state_hash_version,
      nonce: props.proof.contract_data.nonce
    }
    setContractData(_contractData)
  }, [starknetStateRoot, value, props.proof])

  // refetch contractRead hook
  useEffect(() => {
    if (contractProof && contractData && storageProof) {
      fetchResult();
    }
  }, [contractData, contractProof, storageProof, verifierAddress])

  const fetchResult = async () => {
    await readContractVerifier.refetch()
    console.log('verifying proof...')
    console.log(readContractVerifier.data)
    if (readContractVerifier.data) {
      setVerificationResult("true")
    }else{
      setVerificationResult("false")
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const _verifier = formData.get('verifier') as string;
    const _stateRoot = formData.get('state-root') as string;
    const _value = formData.get('storagevar-value') as string;
    setStarknetStateRoot(_stateRoot);
    setValue(_value);
    setVerifierAddress(_verifier);
    setSubmit(!submit);
  }

  return (
    <>
      <Heading as={"h3"}>Verification</Heading>
      <form onSubmit={handleSubmit}>
        <HStack>
          <FormLabel
            htmlFor={"verifier"}
            fontWeight={"400"}
            fontSize={"12px"}
            w={"150px"}
          > {"Verifier address: "}</FormLabel>
          <Input
            padding={"8px"}
            border={"1px solid #ccc"}
            borderRadius={"4px"}
            w={"250px"}
            fontSize={"12px"}
            type="text" id={"verifier"} name={"verifier"}/>
        </HStack>
        <HStack>
          <FormLabel
            htmlFor={"state-root"}
            fontWeight={"400"}
            fontSize={"12px"}
            w={"150px"}
          > {"Starknet state root: "}</FormLabel>
          <Input
            padding={"8px"}
            border={"1px solid #ccc"}
            borderRadius={"4px"}
            w={"250px"}
            fontSize={"12px"}
            type="text" id={"state-root"} name={"state-root"}/>
        </HStack>
        <HStack>
          <FormLabel
            htmlFor={"storagevar-value"}
            fontWeight={"400"}
            fontSize={"12px"}
            w={"150px"}
          >Storage variable value</FormLabel>
          <Input
            padding={"8px"}
            border={"1px solid #ccc"}
            borderRadius={"4px"}
            w={"250px"}
            fontSize={"12px"}
            type="text" id={"storagevar-value"} name={"storagevar-value"}/>
        </HStack>
        <Box>
          <Button
            margin={"8px 0 0"}
            padding={"8px"}
            border={"none"}
            borderRadius={"4px"}
            backgroundColor={"#333"}
            color={"#fff"}
            fontSize={"14px"}
            fontWeight={"600"}
            cursor={"pointer"}
            type="submit">Verify proof</Button>
        </Box>
      </form>
      <Box>
        <Heading as={"h3"}>Result</Heading>
        <Box>{verificationResult}</Box>
      </Box>
    </>

  );
};

export default VerifyProof;
