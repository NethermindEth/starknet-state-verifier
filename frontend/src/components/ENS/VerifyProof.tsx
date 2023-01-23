import React, { useEffect, useState } from 'react';
import { BigNumberish, Signer } from "ethers";
import { useContractRead } from 'wagmi'
import { Box, Button, FormLabel, Heading, HStack, Input, Text } from "@chakra-ui/react";
import StarknetVerifier from "../../abi/StarknetVerifier.json";
import { Spinner } from '@chakra-ui/react'

interface Props {
  proof: any
  storageAddress: string | undefined
  contractAddress: string | undefined
  ethereumBlockNumber: string | undefined
  starknetCommittedBlockNumber: string | undefined
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
  contractStateRoot: BigNumberish;
  contractAddress: BigNumberish;
  storageVarAddress: BigNumberish;
  classHash: BigNumberish;
  hashVersion: BigNumberish;
  nonce: BigNumberish;
}

const VERIFIER_ADDRESS = '0x995c2A07cd092AC5E4bCB655B9C0e58FFB952d70' // this is on goerli, plus update in the UI field to your custom deployment

const VerifyProof = (props: Props) => {
  const [verifierAddress, setVerifierAddress] = useState<string>(VERIFIER_ADDRESS)
  // const [starknetStateRoot, setStarknetStateRoot] = useState('');
  const [storageProof, setStorageProof] = useState([]);
  const [contractProof, setContractProof] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // const [blockNumber, setBlockNumber] = useState<string>();

  const [verificationResult, setVerificationResult] = useState<string>();
  const [submit, setSubmit] = useState(false);
  const [contractData, setContractData] = useState<MyContractData>();


  const readContractVerifier = useContractRead({
    address: verifierAddress,
    abi: StarknetVerifier.abi,
    functionName: 'verifiedStorageValue',
    args: [props.starknetCommittedBlockNumber, contractData, contractProof, storageProof[0]],
    overrides: { blockTag: parseInt(props.ethereumBlockNumber!) },
    enabled: false,
    onError: (error: Error) => {
      console.log(error)
      setVerificationResult(error.message)
    }, onSettled(data, error: Error | null) {
      if (data) {
        setVerificationResult(data.toString())
      } else {
        setVerificationResult(error?.message)
      }
    },
  });

  function parseProofElement(element: any): MyStarknetProof {
    console.log(element)
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


  useEffect(() => {
    /// parse proof JSON
    if (!props.proof) return
    let myContractProofs: any = [];
    let myStorageproofs: any = [];
    props.proof.contract_proof.forEach((element: any) => {
      myContractProofs.push(parseProofElement(element));
    });

    if (props.proof.contract_data !== undefined) {
      console.log('contract data', props.proof.contract_data)
      if (props.proof.contract_data.storage_proofs !== undefined) {
        props.proof.contract_data.storage_proofs.forEach((storage_proof: any) => {
          let myStorageProof: any = [];
          storage_proof.forEach((element: any) => {
            myStorageProof.push(parseProofElement(element));
          });
          myStorageproofs.push(myStorageProof);
        });
      }
    }

    setContractProof(myContractProofs);
    setStorageProof(myStorageproofs);
  }, [props.proof])


  // recompute contract data used with the contractRead hook
  useEffect(() => {
    if (!(props.proof)) {
      return;
    }
    const _contractData: MyContractData = {
      contractStateRoot: props.proof.contract_data.root,
      contractAddress: props.contractAddress!,
      storageVarAddress: props.storageAddress!,
      classHash: props.proof.contract_data.class_hash,
      hashVersion: props.proof.contract_data.contract_state_hash_version,
      nonce: props.proof.contract_data.nonce
    }
    setContractData(_contractData)
  }, [props.proof])

  // refetch contractRead hook
  useEffect(() => {
    if (contractProof && contractData && storageProof) {
      fetchResult();
    }
  }, [contractData, contractProof, storageProof, verifierAddress])

  const fetchResult = async () => {
    try {
      setIsLoading(true)
      console.log('block number', props.ethereumBlockNumber);
      await readContractVerifier.refetch({
        throwOnError: true,
        cancelRefetch: false,
      })
      console.log('verifying proof...')
      setIsLoading(false)

    } catch (error) {
      console.log(error)
      setIsLoading(false)
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const _verifier = formData.get('verifier') as string;
    setVerifierAddress(_verifier);
    setSubmit(!submit);
    fetchResult();
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
            type="text" id={"verifier"} name={"verifier"} defaultValue={verifierAddress} />
        </HStack>
        {/* <HStack>
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
            type="text" id={"state-root"} name={"state-root"} />
        </HStack> */}
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
        <Heading as={"h5"}>Verified Storage Value  </Heading>
        {!isLoading && <Text> against ethereum block # {props.ethereumBlockNumber} and starknet block # {props.starknetCommittedBlockNumber} </Text>}
        {!isLoading && <Box>Value is = <strong >   {verificationResult}</strong> </Box>}

        {isLoading && <Spinner thickness='4px' speed='0.65s' emptyColor='gray.200' color='blue.500' size='xl' />}
      </Box>
    </>

  );
};

export default VerifyProof;
