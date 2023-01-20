import React, {useEffect, useState} from 'react'
import './App.css'
import {Box, Container, Flex} from "@chakra-ui/react";
import {starknetKeccak} from "starknet/utils/hash";
import JsonRpcForm from "./components/JsonRpc/JsonRpcForm";

const CONTRACT_ADDRESS = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
const STORAGE_VAR_NAME = "ERC20_name"

const STORAGE_HASH = starknetKeccak(STORAGE_VAR_NAME)

import * as apiSpecImport from './utils/api-spec.json';
import JsonRpcCard from "./components/JsonRpc/JsonRpcCard";
import EnsProofCard from "./components/ENS/EnsProofCard";
import Navbar from './components/Navbar';

function App() {

  const [result, setResult] = useState([])
  const apiSpec = apiSpecImport as any

  return (
    <Box>
      <Navbar />
      <Flex
        flexDir={"column"}
        width={"100%"}
        alignItems={"center"}
        minH={"90vh"}
        py={"2"}
      >
        <Box maxW={"5xl"} width={"100%"}>
          <EnsProofCard/>
          {/*  Not used.*/}
          {/*{apiSpec.methods.map((method: { name: string; params: string[] }, index: React.Key) =>*/}
          {/*  <Box key={method.name}>*/}
          {/*    <JsonRpcCard method={method} key={index}/>*/}
          {/*  </Box>*/}
          {/*)}*/}
        </Box>
      </Flex>
    </Box>
  )
}

export default App
