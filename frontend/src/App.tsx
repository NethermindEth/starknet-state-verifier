import React, { useEffect, useState } from "react";
import "./App.css";
import { Alert, AlertIcon, Box, Container, Flex } from "@chakra-ui/react";
import { starknetKeccak } from "starknet/utils/hash";
import JsonRpcForm from "./components/JsonRpc/JsonRpcForm";

const CONTRACT_ADDRESS =
  "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
const STORAGE_VAR_NAME = "ERC20_name";

const STORAGE_HASH = starknetKeccak(STORAGE_VAR_NAME);

import EnsProofCard from "./components/ENS/EnsProofCard";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/homepage";

function App() {
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
        <Box maxW={"5xl"} width={"100%"} p={"10px"}>
          <Alert status="info">
            <AlertIcon />
            Currently only works in goerli/testnet for Ethereum/Starknet.
            Mainnet version coming soon..
          </Alert>
          <HomePage />
          {/*  Not used.*/}
          {/*{apiSpec.methods.map((method: { name: string; params: string[] }, index: React.Key) =>*/}
          {/*  <Box key={method.name}>*/}
          {/*    <JsonRpcCard method={method} key={index}/>*/}
          {/*  </Box>*/}
          {/*)}*/}
        </Box>
      </Flex>
      <Footer />
    </Box>
  );
}

export default App;
