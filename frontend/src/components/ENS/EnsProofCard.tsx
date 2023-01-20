import JsonRpcForm from "../JsonRpc/JsonRpcForm";
import { border, Box, Button, Card, Collapse, Divider, FormLabel, Heading, HStack, Input, Text, useColorModeValue, VStack } from "@chakra-ui/react";
import React, { Key, useEffect, useState } from "react";
import JsonRpcResponse from "../JsonRpc/JsonRpcResponse";
import { ChevronRightIcon, ChevronUpIcon } from '@chakra-ui/icons'
import { pedersen, starknetKeccak } from "starknet/utils/hash";
import StorageVarForm from "./StorageVarForm";
import JsonRpcCard from "../JsonRpc/JsonRpcCard";
import VerifyProof from "./VerifyProof";
import ConnectWallet from "../ConnectWallet";
import GetProofForm from "./GetProofForm";


const getProofMethod = {
  "name": "pathfinder_getProof",
  "params": [
    {
      "name": "contract_address",
      "description": "lorem ipsum",
      "required": true,
      "schema": {
        "$ref": "#/components/schemas/BLOCK_ID"
      }
    },
    {
      "name": "storage_var addresses",
      "description": "lorem ipsum",
      "required": true,
      "schema": {
        "$ref": "#/components/schemas/BLOCK_ID"
      }
    },
    {
      "name": "block_id",
      "description": "The hash of the requested block, or number (height) of the requested block, or a block tag",
      "required": true,
      "schema": {
        "$ref": "#/components/schemas/BLOCK_ID"
      }
    }
  ]
}


export type EnsProofCardStateKeys =  "storageAddress" | "contractAddress" | "ethereumBlockNumber" | "starknetCommitmentBlockNumber" | "proof" ;
export interface EnsProofCardState {
    storageAddress?: string;
    contractAddress?: string;
    ethereumBlockNumber?: string;
    starknetCommitmentBlockNumber?: string;
    proof?: string;
}

const EnsProofCard = () => {

  const gatewayAddress = 'https://pathfinder-goerli.nethermind.io/rpc/v0.2';

  const [
    proofCardState, setProofCardState
  ] = useState<EnsProofCardState>({
    contractAddress: "",
    ethereumBlockNumber: "",
    proof: "",
    starknetCommitmentBlockNumber: "",
    storageAddress: ""
  });

  const mutateSetProofCardState = (key: EnsProofCardStateKeys, value: string) => {
    setProofCardState({
      ...proofCardState,
      [key]: value
    })
  }

  const [storageAddress, setStorageAddress] = useState<string>()
  const [contractAddress, setContractAddress] = useState<string>()
  const [ethereumBlockNumber, setEthereumBlockNumber] = useState<string>()
  const [starknetCommittedBlockNumber, setStarknetCommittedBlockNumber] = useState<string>()
  const [proof, setProof] = useState<string>()

  const borderColor = useColorModeValue("gray.600", "whiteAlpha.600")

  return (
    <>
      <VStack
        marginY={"10px"}
        borderRadius={"4px"}
        alignItems={"flex-start"}
      >
        <VStack w={"100%"} p={4} border={`1px dashed`} borderColor={borderColor}>
          <StorageVarForm setStorageAddress={
            (address: string) => mutateSetProofCardState("storageAddress", address)
            } 
          />
          {
            proofCardState?.storageAddress && 
            <Text fontSize={"xs"} w={"100%"}>Calulated Storage Address: {proofCardState?.storageAddress}</Text>
          }
        </VStack>
        <HStack w={"100%"}>
          <Text
            fontWeight={"400"}
            fontSize={"sm"}
          >Pathfinder address: </Text>
          <Text fontSize={"sm"} textAlign={"left"} fontWeight={"bold"}>
            {gatewayAddress}
          </Text>
        </HStack>
        <GetProofForm 
          state={proofCardState}
          mutateProofCardState={mutateSetProofCardState}
          onResult={setProof} 
          setContractAddress={setContractAddress} 
          setStorageAddress={setStorageAddress} 
          storageAddress={storageAddress}
          setEthereumBlockNumber={setEthereumBlockNumber} 
          setStarknetCommittedBlockNumber={setStarknetCommittedBlockNumber} 
        />
        {proof && <JsonRpcResponse data={proof} onResult={setProof} />}
        <ConnectWallet />
        {proof && <VerifyProof ethereumBlockNumber={ethereumBlockNumber} starknetCommittedBlockNumber={starknetCommittedBlockNumber} storageAddress={storageAddress} contractAddress={contractAddress} proof={proof} />}
      </VStack>
      <Divider />
    </>);
}

export default EnsProofCard;