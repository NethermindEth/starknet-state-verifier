import React, { Key, useEffect, useState } from 'react';
import jsonRpcCall from "../../utils/RpcCall";
import { Box, Button, Flex, FormLabel, Heading, HStack, Input, VStack } from "@chakra-ui/react";
import { useBlockNumber, useContractRead, useProvider } from 'wagmi'
import StarknetCoreContract from "../../abi/StarknetCoreContract.json";
import { BigNumber } from 'ethers';
import { Spinner } from '@chakra-ui/react'
import { ethers } from 'ethers';

import { useAccount, useConnect } from 'wagmi'
import { InjectedConnector } from "wagmi/connectors/injected";


interface Props {
  onResult: (result: any) => void;
  setStarknetCommittedBlockNumber: (blockNumber: string) => void;
  setEthereumBlockNumber: (blockNumber: string) => void;
  setContractAddress: (address: string) => void;
  setStorageAddress: (address: string) => void;
  storageAddress?: string;
}


const GetProofForm: React.FunctionComponent<Props> = (props: Props) => {
  const { onResult } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [starknetCoreContractAddress, setStarknetCoreContractAddress] = useState<string>('0xde29d060D45901Fb19ED6C6e959EB22d8626708e')
  const provider = useProvider()
  async function getLatestEthereumBlockNumber(): Promise<any> {
    const ethereumBlockNumber = await provider.getBlockNumber();
    return ethereumBlockNumber;
  }
  async function getStarknetCommittedBlockNumber(ethereumBlockNumber: number): Promise<any> {

    const readCoreContract = new ethers.Contract(
      starknetCoreContractAddress,
      StarknetCoreContract.abi,
      provider
    );
    const starknetCommittedBlock = await readCoreContract.stateBlockNumber({ blockTag: ethereumBlockNumber })
    return BigNumber.from(starknetCommittedBlock).toNumber();
  }

  const { connector: activeConnector, isConnected } = useAccount()
  const { connect, connectors, error, pendingConnector } =
    useConnect({
      connector: new InjectedConnector(),
    })

  // Handle the form submission
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (!isConnected) {
      connect()
    }
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const contractAddress = formData.get('contract-address') as string;
    const storageAddress = formData.get('storagevar-address') as string;
    setStarknetCoreContractAddress(formData.get('corecontract-address') as string);
    props.setStorageAddress(storageAddress);
    props.setContractAddress(contractAddress);

    setIsLoading(true);
    const ethereumBlockNumber = getLatestEthereumBlockNumber().then((ethereumBlockNumber) => {
      props.setEthereumBlockNumber(ethereumBlockNumber.toString());
      getStarknetCommittedBlockNumber(ethereumBlockNumber).then((committedBlockNumber) => {
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
        jsonRpcCall("pathfinder_getProof", args).then((result) => {
          props.setStarknetCommittedBlockNumber(committedBlockNumber.toString());
          onResult(result);
          setIsLoading(false);
        });
      })
    }
    );
  };

  return (
    <Flex
      flexDir={"column"}
      justifyContent={"flex-start"}
      width={"100%"}
    >
      <form onSubmit={handleSubmit}>
        <HStack>
          <FormLabel
            htmlFor={"contract-address"}
            fontWeight={"400"}
            fontSize={"12px"}
            w={"150px"}
          >Contract Address</FormLabel>
          <Input
            padding={"8px"}
            border={"1px solid #ccc"}
            borderRadius={"4px"}
            w={"250px"}
            fontSize={"12px"}
            type="text" id={"contract-address"} name={"contract-address"} />
        </HStack>
        <HStack>
          <FormLabel
            htmlFor={"storagevar-address"}
            fontWeight={"400"}
            fontSize={"12px"}
            w={"150px"}
          >Storage variable address</FormLabel>
          <Input
            padding={"8px"}
            border={"1px solid #ccc"}
            borderRadius={"4px"}
            w={"250px"}
            fontSize={"12px"}
            value={props.storageAddress}
            type="text" id={"storagevar-address"} name={"storagevar-address"} />
        </HStack>
        <HStack>
          <FormLabel
            htmlFor={"block-tag"}
            fontWeight={"400"}
            fontSize={"12px"}
            w={"150px"}
          >StarknetCoreContract Address</FormLabel>
          <Input
            defaultValue={starknetCoreContractAddress}
            padding={"8px"}
            border={"1px solid #ccc"}
            borderRadius={"4px"}
            w={"250px"}
            fontSize={"12px"}
            type="text" id={"corecontract-address"} name={"corecontract-address"} />
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
            type="submit">Call pathfinder_getProof</Button>
        </Box>
        {isLoading && <Spinner />}
      </form>
    </Flex>
  );
}
  ;

export default GetProofForm;
