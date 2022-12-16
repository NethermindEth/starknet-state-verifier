import React, {Key} from 'react';
import jsonRpcCall from "../../utils/RpcCall";
import {Box, Button, Flex, FormLabel, Heading, HStack, Input, VStack} from "@chakra-ui/react";

interface Props {
  onResult: (result: any) => void;
  setContractAddress: (address: string) => void;
  setStorageAddress: (address: string) => void;
}

const GetProofForm: React.FunctionComponent<Props> = (props: Props) => {
    const {onResult} = props;

    // Handle the form submission
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const contractAddress = formData.get('contract-address') as string;
      const storageAddress = formData.get('storagevar-address') as string;
      const block = formData.get('block') as string;
      props.setStorageAddress(storageAddress);
      props.setContractAddress(contractAddress);

      // test if blockArg is a number
      let blockArg;
      const blockNumber = parseInt(block);
      if (isNaN(blockNumber)) {
        blockArg = block;
      }else{
        blockArg = {block_number: blockNumber};
      }
      const args = [
        contractAddress,
        [storageAddress],
        blockArg
      ];
      console.log(args)
      // Call the JSON-RPC method with the given params
      // and pass the result to the onResult callback
      jsonRpcCall("pathfinder_getProof", args).then(onResult);
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
              type="text" id={"contract-address"} name={"contract-address"}/>
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
              type="text" id={"storagevar-address"} name={"storagevar-address"}/>
          </HStack>
          <HStack>
            <FormLabel
              htmlFor={"block-tag"}
              fontWeight={"400"}
              fontSize={"12px"}
              w={"150px"}
            >Block</FormLabel>
            <Input
              placeholder={`number or "latest"...`}
              padding={"8px"}
              border={"1px solid #ccc"}
              borderRadius={"4px"}
              w={"250px"}
              fontSize={"12px"}
              type="text" id={"block"} name={"block"}/>
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
        </form>
      </Flex>
    );
  }
;

export default GetProofForm;
