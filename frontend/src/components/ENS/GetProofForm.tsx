import React, { Key, useEffect, useState } from 'react';
import jsonRpcCall from "../../utils/RpcCall";
import { Box, Button, Flex, FormLabel, Heading, HStack, Input, VStack } from "@chakra-ui/react";
import { useContractRead } from 'wagmi'
import StarknetCoreContract from "../../abi/StarknetCoreContract.json";
import { BigNumber } from 'ethers';
import { Spinner } from '@chakra-ui/react'

interface Props {
  onResult: (result: any) => void;
  setBlockNumber: (blockNumber: string) => void;
  setContractAddress: (address: string) => void;
  setStorageAddress: (address: string) => void;
}


const GetProofForm: React.FunctionComponent<Props> = (props: Props) => {
  const { onResult } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [starknetCoreContractAddress, setStarknetCoreContractAddress] = useState<string>('0xde29d060D45901Fb19ED6C6e959EB22d8626708e')

  const readCoreContract = useContractRead({
    address: starknetCoreContractAddress,
    abi: StarknetCoreContract.abi,
    functionName: 'stateBlockNumber',
    args: [],
    enabled: false
  });

  async function getBlockNumber(): Promise<any> {
    // Create the JSON-RPC request object
    await readCoreContract.refetch();
    let blockNumber: BigNumber = BigNumber.from(readCoreContract.data);
    return blockNumber.toNumber();
  }

  // Handle the form submission
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const contractAddress = formData.get('contract-address') as string;
    const storageAddress = formData.get('storagevar-address') as string;
    setStarknetCoreContractAddress(formData.get('corecontract-address') as string);
    props.setStorageAddress(storageAddress);
    props.setContractAddress(contractAddress);

    setIsLoading(true);
    getBlockNumber().then((blockNumber) => {
      console.log('readCoreContract block #', blockNumber);
      let blockArg = { 'block_number': blockNumber }

      const args = [
        blockArg,
        contractAddress,
        [storageAddress]
      ];
      console.log(args)
      // Call the JSON-RPC method with the given params
      // and pass the result to the onResult callback
      jsonRpcCall("pathfinder_getProof", args).then((result) => {
        props.setBlockNumber(blockNumber.toString());
        onResult(result);
        setIsLoading(false);
      });
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
