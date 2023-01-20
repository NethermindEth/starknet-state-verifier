import {Box, Button, Card, Collapse, Divider, Flex, FormLabel, Heading, HStack, Input, Tooltip, useToast, VStack} from "@chakra-ui/react";
import React, {Key, useEffect, useState} from "react";
import {pedersen, starknetKeccak} from "starknet/utils/hash";
import {toFelt, toHex} from "starknet/utils/number";


interface Props {
  setStorageAddress: (address: string) => void
}

const StorageVarForm:React.FC<Props> = ({setStorageAddress}) => {

  const toast = useToast();

  const [storageVarFormState, setStorageVarFormState] = useState({
    name: "",
    args: ""
  });

  useEffect(() => {
    const address = computeStorageAddress(
      storageVarFormState.name, 
      storageVarFormState?.args?.split(',')
    );
    setStorageAddress(address);
  }, [storageVarFormState])

  const computeStorageAddress = (name: string, keys: string[]) => {
    // storage_var address is the sn_keccak of the name hashed with the pedersen hash of the keys
    // console.log(name, keys)
    let res:any = starknetKeccak(name)
    keys.forEach((key) => {
      if(key==='') return;
      try{
      let felt_key = toFelt(key);
      res = pedersen([res, felt_key]);
    } catch(e) {
      toast({
        title: "Invalid BN Character!!",
        description: `"${key}" Not a valid key character`,
        isClosable: true,
        duration: 3000,
        status: "error"
      });
      setStorageVarFormState({...storageVarFormState, args: ""});
    }
    });
    return toHex(res);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    switch(e.target.name) {
      case "storage-name": setStorageVarFormState({...storageVarFormState, name: e.target.value}); break;
      case "storage-args": setStorageVarFormState({...storageVarFormState, args: e.target.value}); break;
    }
  }

  return (
    <Flex
      justifyContent={"space-between"}
      width={"100%"}
      py={"10px"}
    >
      <Box width={"40%"}>
        <FormLabel
          htmlFor={"storage-name"}
          fontWeight={"400"}
          fontSize={"sm"}
        >
          <Tooltip label={"It is the storage variable name which is defined in the source cairo contract."}>
            Storage variable name
          </Tooltip>
        </FormLabel>
        <Input
          variant={"outline"}
          fontSize={"sm"}
          placeholder={"Leave empty if not required"}
          padding={"8px"}
          type="text" 
          id={"storage-name"} 
          name={"storage-name"}
          onChange={handleChange}
          value={storageVarFormState.name}
        />
      </Box>
      <Box width={"40%"}>
        <FormLabel
          htmlFor={"storage-name"}
          fontWeight={"400"}
          fontSize={"sm"}
        >
          <Tooltip label={"Enter your storage variable arguments here comma seperated. e.g two args as: 0x034, 0x343"}>
            Storage variable arguments
          </Tooltip>
        </FormLabel>
        <Input
          variant={"outline"}
          padding={"8px"}
          type="text" 
          name={"storage-args"}
          id={"storage-args"}
          placeholder={"Enter `,` seperated args"}
          onChange={handleChange}
          value={storageVarFormState.args}
        />
      </Box>
    </Flex>
  );
}

export default StorageVarForm;