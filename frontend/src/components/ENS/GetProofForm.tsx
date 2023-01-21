import React, { Key, useEffect, useMemo, useState } from 'react';
import jsonRpcCall from "../../utils/RpcCall";
import { Box, Button, Flex, FormLabel, Heading, HStack, Input, Text, Tooltip, useColorModeValue, useToast, VStack } from "@chakra-ui/react";
import { useBlockNumber, useContractRead, useProvider } from 'wagmi'
import StarknetCoreContract from "../../abi/StarknetCoreContract.json";
import { BigNumber, BigNumberish } from 'ethers';
import { Spinner } from '@chakra-ui/react'
import { ethers } from 'ethers';

import { useAccount, useConnect } from 'wagmi'
import { InjectedConnector } from "wagmi/connectors/injected";
import { EnsProofCardState, EnsProofCardStateKeys } from './EnsProofCard';


interface Props {
  state: EnsProofCardState;
  setState: (newState:EnsProofCardState) => any;
  mutateProofCardState: (key: EnsProofCardStateKeys, value: string) => any;
}


const GetProofForm: React.FC<Props> = ({
  state,
  setState,
  mutateProofCardState
}) => {

  const toast = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [starknetCoreContractAddress, setStarknetCoreContractAddress] = useState<string>('0xde29d060D45901Fb19ED6C6e959EB22d8626708e');
  const [coreContractRootState, setContractRootState] = useState<string>("");

  const provider = useProvider();

  const  getLatestEthereumBlockNumber = async (): Promise<number> =>  {
    return await provider.getBlockNumber();
  }

  const makeCoreContractInstance = () => {
    return new ethers.Contract(
      starknetCoreContractAddress,
      StarknetCoreContract.abi,
      provider
    );
  }

  const getStarknetCommittedBlockNumber = async (ethereumBlockNumber: number): Promise<number> => {
    const readCoreContract = makeCoreContractInstance();
    const starknetCommittedBlock = await readCoreContract.stateBlockNumber({ blockTag: ethereumBlockNumber })
    return BigNumber.from(starknetCommittedBlock).toNumber();
  }

  const getRootState = async () => {
    const readCoreContract = makeCoreContractInstance();
    const stateRoot: BigNumberish = await readCoreContract.stateRoot();
    setContractRootState(stateRoot.toString());
  }

  const [currentCount, setCount] = useState(1);

  const timer = () => { getRootState(); setCount(currentCount + 1) };

  // Required for First Load Trigger
  useEffect(() => {
    getRootState();
  }, [])

  // This calls as per interval timer
  useEffect(() => {
   
    const id = setInterval(timer, 10000);
    
    return () => clearInterval(id);

   }, [coreContractRootState]);

  const { connector: activeConnector, isConnected } = useAccount();

  const { connect, connectors, error, pendingConnector } =
    useConnect({
      connector: new InjectedConnector(),
    });


  // Handle the form submission
  const handleSubmit = async () => {
    if (!isConnected) {
      connect();
    }

    // const formData = new FormData(event.currentTarget);
    const contractAddress = state.contractAddress;
    const storageAddress = state.storageAddress;
    // setStarknetCoreContractAddress(formData.get('corecontract-address') as string);
    // setStorageAddress(storageAddress);
    // setContractAddress(contractAddress);

    if(!contractAddress?.trim()) {
      toast({
        title: "Invalid Contract Address",
        description: "Enter a valid Contract Address for L2",
        duration: 3000,
        isClosable: true,
        status: "error"
      });
      return;
    }

    setIsLoading(true);

    // Fetch and update Ethereum Block Number
    const ethereumBlockNumber = await getLatestEthereumBlockNumber();
    // Fetch and update Starknet Commited Block Number
    const committedBlockNumber = await getStarknetCommittedBlockNumber(ethereumBlockNumber);
    
    console.log('readCoreContract block #', committedBlockNumber);

    let blockArg = { 'block_number': committedBlockNumber }
    const args = [
      blockArg,
      contractAddress,
      [storageAddress]
    ];
    console.log(args)
    // Call the JSON-RPC method with the given params
    // and pass the result to the onResult callback
    const result = await jsonRpcCall("pathfinder_getProof", args);
    console.log(result)

    setState({
      ...state,
      "ethereumBlockNumber": ethereumBlockNumber.toString(),
      "starknetCommitmentBlockNumber": committedBlockNumber.toString(),
      "proof": result
    });

    setIsLoading(false);
  };

  const stateRootColor = useColorModeValue("green", "palegreen");

  return (
    <Flex
      flexDir={"column"}
      justifyContent={"flex-start"}
      width={"100%"}
    >
      <Flex my={"10px"} alignItems={"center"}>
        <FormLabel
          htmlFor={"contract-address"}
          fontSize={"sm"}
          fontWeight={"bold"}
          margin={"0px"}
          w={"20%"}
        >
          <Tooltip 
            label={"Contract Address for which you want to verify storage variable on L2 (Starknet)."}
          >
            Contract Address
          </Tooltip>
        </FormLabel>
        <Input
          w={"80%"}
          fontSize={"sm"}
          type="text" 
          id={"contract-address"} 
          name={"contract-address"}
          onChange={(e) => mutateProofCardState("contractAddress", e.target.value)}
          value={state?.contractAddress}
        />
      </Flex>
      <Flex my={"10px"} alignItems={"center"}>
        <FormLabel
          htmlFor={"storagevar-address"}
          fontSize={"sm"}
          fontWeight={"bold"}
          margin={"0px"}
          w={"20%"}
        >
          <Tooltip label={"This is calculated from above storage inputs"}>
            Storage variable address
          </Tooltip>
        </FormLabel>
        <Input
          padding={"8px"}
          border={"1px solid #ccc"}
          borderRadius={"4px"}
          w={"80%"}
          fontSize={"sm"}
          value={state?.storageAddress}
          readOnly
          type="text" 
          id={"storagevar-address"} 
          name={"storagevar-address"} 
        />
      </Flex>
      <Flex my={"10px"} alignItems={"center"}>
        <FormLabel
          htmlFor={"block-tag"}
          fontSize={"sm"}
          fontWeight={"bold"}
          margin={"0px"}
          w={"20%"}
        >
          <Tooltip label={"This is main starknet rollup contract deployed on L1 Ethereum."}>
            StarknetCoreContract Address
          </Tooltip>
        </FormLabel>
        <Input
          value={starknetCoreContractAddress}
          onChange={(e) => {setStarknetCoreContractAddress(e.target.value)}}
          w={"80%"}
          fontSize={"sm"}
          type="text" 
          id={"corecontract-address"} 
          name={"corecontract-address"} 
        />
      </Flex>
      <Text my={"10px"}>Core Contract State Root: <Text as={"span"} fontWeight={"900"} color={stateRootColor}>{coreContractRootState}</Text></Text>
      <Box>
        <Button 
          variant={"solid"}
          colorScheme={"blue"}
          cursor={"pointer"}
          disabled={isLoading}
          onClick={handleSubmit}
        >
          {isLoading ? <Spinner /> :  "Call pathfinder_getProof"}
        </Button>
      </Box>
    </Flex>
  );
}
  ;

export default GetProofForm;
