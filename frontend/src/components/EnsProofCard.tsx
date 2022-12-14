import JsonRpcForm from "./JsonRpc/JsonRpcForm";
import {Box, Button, Card, Collapse, Divider, FormLabel, Heading, HStack, Input, Text, VStack} from "@chakra-ui/react";
import React, {Key, useState} from "react";
import JsonRpcResponse from "./JsonRpc/JsonRpcResponse";
import {ChevronRightIcon, ChevronUpIcon} from '@chakra-ui/icons'
import {pedersen, starknetKeccak} from "starknet/utils/hash";
import StorageVarForm from "./StorageVarForm";
import JsonRpcCard from "./JsonRpc/JsonRpcCard";
import VerifyProof from "./VerifyProof";
import Profile from "./Profile";


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

  const [result, setResult] = React.useState()
  const [folded, setFolded] = React.useState(true)

  const [ensRegistryInput, setEnsRegistryInput] = useState<string>()
  const [storageAddress, setStorageAddress] = useState<string>()
  const [proof, setProof] = useState<string>()


  const FoldableDetails = () => (
    <>
      <VStack
        marginY={"10px"}
        borderRadius={"4px"}
        alignItems={"flex-start"}
      >
        <VStack w={"100%"}>
          <StorageVarForm setStorageAddress={setStorageAddress}/>
          {storageAddress && <Text fontSize={"12px"} w={"100%"}>{storageAddress}</Text>}
        </VStack>
        {/*<HStack>*/}
        {/*<FormLabel*/}
        {/*  htmlFor={"storage-name"}*/}
        {/*  fontWeight={"400"}*/}
        {/*  fontSize={"12px"}*/}
        {/*  w={"200px"}*/}
        {/*>ENS Registry Address</FormLabel>*/}
        {/*<Input*/}
        {/*  placeholder={"0x..."}*/}
        {/*  onChange={(e) => setEnsRegistryInput(e.target.value)}*/}
        {/*/>*/}
        {/*</HStack>*/}
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
        <JsonRpcForm methodName={getProofMethod.name} params={getProofMethod.params as any} key={1}
                     onResult={setProof}/>
        {proof && <JsonRpcResponse data={proof}/>}
        <Profile/>
        {proof && <VerifyProof proof={proof}/>}
      </VStack>
    </>
  )

  return (
    <>
      <HStack
        onClick={() => setFolded(!folded)}
        cursor={"pointer"}
      >
        {folded ? <ChevronRightIcon/> : <ChevronUpIcon/>}
        <Heading as={"h3"}
                 fontSize={"18px"}
                 fontWeight={"600"}
        >ENS Resolution
        </Heading>
      </HStack>
      <Collapse in={!folded}>
        {FoldableDetails()}
      </Collapse>
      <Divider/>


    </>);
}

export default EnsProofCard;