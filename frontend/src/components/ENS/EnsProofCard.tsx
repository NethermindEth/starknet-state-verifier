import JsonRpcForm from "../JsonRpc/JsonRpcForm";
import { border, Box, Button, Card, Collapse, Divider, FormLabel, Heading, HStack, Input, Text, useColorModeValue, VStack } from "@chakra-ui/react";
import React, { Key, useEffect, useState } from "react";
import JsonRpcResponse from "../JsonRpc/JsonRpcResponse";
import StorageVarForm from "./StorageVarForm";
import VerifyProof from "./VerifyProof";
import GetProofForm from "./GetProofForm";
import { L2_RESOLVER_ADDRESS, PATHFINDER_RPC_URL } from "../../constants";

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


export type EnsProofCardStateKeys = "storageAddress" | "contractAddress" | "ethereumBlockNumber" | "starknetCommitmentBlockNumber" | "proof";
export interface EnsProofCardState {
  storageAddress: string;
  contractAddress: string;
  ethereumBlockNumber?: string;
  starknetCommitmentBlockNumber: string;
  proof?: any;// should be jsonrpc response
};


const EnsProofCard = () => {

  const gatewayAddress = PATHFINDER_RPC_URL

  const [
    proofCardState, setProofCardState
  ] = useState<EnsProofCardState>({
    contractAddress: L2_RESOLVER_ADDRESS,
    ethereumBlockNumber: "",
    starknetCommitmentBlockNumber: "",
    storageAddress: ""
  });

  const mutateSetProofCardState = (key: EnsProofCardStateKeys, value: string) => {
    setProofCardState({
      ...proofCardState,
      [key]: value
    })
  }

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
          setState={setProofCardState}
        />
        {proofCardState.proof && <JsonRpcResponse key={ proofCardState.contractAddress.concat(proofCardState.storageAddress)}
          data={proofCardState.proof}
          onResult={(proof: string) => mutateSetProofCardState("proof", proof)}
        />}
        {proofCardState.proof && <VerifyProof
          state={proofCardState}
        />}
      </VStack>
    </>);
}

export default EnsProofCard;