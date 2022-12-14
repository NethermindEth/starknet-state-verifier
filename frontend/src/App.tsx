import React, {useEffect, useState} from 'react'
import './App.css'
import {Box, Flex} from "@chakra-ui/react";
import {starknetKeccak} from "starknet/utils/hash";
import JsonRpcForm from "./components/JsonRpc/JsonRpcForm";

const CONTRACT_ADDRESS = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
const STORAGE_VAR_NAME = "ERC20_name"

const STORAGE_HASH = starknetKeccak(STORAGE_VAR_NAME)

import * as apiSpecImport from './utils/api-spec.json';
import JsonRpcCard from "./components/JsonRpc/JsonRpcCard";
import EnsProofCard from "./components/EnsProofCard";

function App() {

  const [result, setResult] = useState([])
  const apiSpec = apiSpecImport as any

  return (
    <Flex minHeight={"100vh"}>
      <Flex
        flexDir={"column"}
        minW={"1000px"}
      >
        <EnsProofCard/>
        {apiSpec.methods.map((method: { name: string; params: string[] }, index: React.Key) =>
          <Box key={method.name}>
            <JsonRpcCard method={method} key={index}/>
          </Box>
        )}
      </Flex>
    </Flex>
  )
}

export default App
