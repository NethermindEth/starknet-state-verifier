import JsonRpcForm from "../JsonRpc/JsonRpcForm";
import {Box, Button, Card, Collapse, Divider, FormLabel, Heading, HStack, Input, Text, VStack} from "@chakra-ui/react";
import React, {Key, useEffect, useState} from "react";
import JsonRpcResponse from "../JsonRpc/JsonRpcResponse";
import {ChevronRightIcon, ChevronUpIcon} from '@chakra-ui/icons'
import {pedersen, starknetKeccak} from "starknet/utils/hash";
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
const EnsProofCard = () => {

  const gatewayAddress = 'http://localhost:9545/rpc/v0.2';

  const [storageAddress, setStorageAddress] = useState<string>()
  const [contractAddress, setContractAddress] = useState<string>()
  const [proof, setProof] = useState<string>()


  return (
    <>
      <HStack
      >
        <Heading as={"h3"}
                 fontSize={"18px"}
                 fontWeight={"600"}
        >ENS Resolution
        </Heading>
      </HStack>
      <VStack
        marginY={"10px"}
        borderRadius={"4px"}
        alignItems={"flex-start"}
      >
        <VStack w={"100%"}>
          <StorageVarForm setStorageAddress={setStorageAddress}/>
          {storageAddress && <Text fontSize={"12px"} w={"100%"}>{storageAddress}</Text>}
        </VStack>
        <HStack w={"100%"}>
          <FormLabel
            fontWeight={"400"}
            fontSize={"12px"}
            w={"150px"}
          >Pathfinder address</FormLabel>
          <Text fontSize={"12px"} textAlign={"left"}>
            {gatewayAddress}
          </Text>
        </HStack>
        <GetProofForm onResult={setProof} setContractAddress={setContractAddress} setStorageAddress={setStorageAddress}/>
        {proof && <JsonRpcResponse data={proof}/>}
        <ConnectWallet/>
        {proof && <VerifyProof storageAddress={storageAddress} contractAddress={contractAddress} proof={proof}/>}
      </VStack>
      <Divider/>


    </>);
}

export default EnsProofCard;