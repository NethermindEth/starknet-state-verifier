import {Box, Button, Card, Collapse, Divider, Flex, FormLabel, Heading, HStack, Input} from "@chakra-ui/react";
import React, {Key} from "react";
import {pedersen, starknetKeccak} from "starknet/utils/hash";
import {toFelt, toHex} from "starknet/utils/number";


interface Props {
  setStorageAddress: (address: string) => void

}

const StorageVarForm = (props: Props) => {


  const handleStorageAddressSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = formData.get('storage-name') as string
    const args = formData.get('storage-args') as string
    const address = computeStorageAddress(name, args.split(','))
    props.setStorageAddress(address);
  }
  const computeStorageAddress = (name: string, keys: string[]) => {
    // storage_var address is the sn_keccak of the name hashed with the pedersen hash of the keys
    console.log(name, keys)
    let res:any = starknetKeccak(name)
    keys.forEach((key) => {
      if(key==='') return;
      let felt_key = toFelt(key);
      res = pedersen([res, felt_key]);
    });
    return toHex(res);
  }

  return (
    <Flex
      flexDir={"column"}
      justifyContent={"flex-start"}
      width={"100%"}
    >
        <form onSubmit={handleStorageAddressSubmit}>
          <Flex justifyContent={"flex-start"}
                gap={10}
          >
            <HStack>
              <FormLabel
                htmlFor={"storage-name"}
                fontWeight={"400"}
                fontSize={"12px"}
                w={"150px"}
              >Storage variable name </FormLabel>
              <Input
                fontSize={"12px"}
                placeholder={"Leave empty if not required"}
                padding={"8px"}
                border={"1px solid #ccc"}
                borderRadius={"4px"}
                w={"250px"}
                type="text" id={"storage-name"} name={"storage-name"}/>
            </HStack>
            <HStack>
              <FormLabel
                htmlFor={"storage-name"}
                fontWeight={"400"}
                fontSize={"12px"}
                w={"150px"}
              >Storage variable arguments</FormLabel>
              <Input
                padding={"8px"}
                border={"1px solid #ccc"}
                borderRadius={"4px"}
                w={"250px"}
                type="text" 
                id={"storage-args"} 
                name={"storage-args"}
              />
            </HStack>
          </Flex>
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
              type="submit">Storage address</Button>
          </Box>
        </form>
    </Flex>
  );
}

export default StorageVarForm;