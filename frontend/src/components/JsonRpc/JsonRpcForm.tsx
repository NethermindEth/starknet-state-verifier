import React, {Key} from 'react';
import jsonRpcCall from "../../utils/RpcCall";
import {Box, Button, Flex, FormLabel, Heading, HStack, Input, VStack} from "@chakra-ui/react";

interface Props {
  // The name of the JSON-RPC method to call
  methodName: string;
  // The parameters for the JSON-RPC method
  params: any[];
  // The callback to call with the result of the JSON-RPC method
  onResult: (result: any) => void;
}

const JsonRpcForm: React.FunctionComponent<Props> = (props: Props) => {
    const {methodName, params, onResult} = props;

    // Handle the form submission
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const args = params.map((param: any) => {
          let param_name = formData.get(`${param.name}-key`);
          let param_value: number | string = (formData.get(`${param.name}-value`) as string);
          // try to parse the param_value if it's a number
          if (!isNaN(Number(param_value)) && !param_value.startsWith("0x")) {
            param_value = Number(param_value);
          }
          try {
            console.log('parseing', param_value)
            param_value = JSON.parse(param_value as string);
            console.log(param_value)
          } catch (e) {
            console.log(e)
          }
          if (!param_name) {
            return param_value as string
          }
          return {[param_name as string]: param_value as string};
        }
      )
      console.log(args)

      // Call the JSON-RPC method with the given params
      // and pass the result to the onResult callback
      jsonRpcCall(methodName, args).then(onResult);
    };

    return (
      <Flex
        flexDir={"column"}
        justifyContent={"flex-start"}
        width={"100%"}
      >
        <form onSubmit={handleSubmit}>
          {params.map((param, index) => (
            <Flex justifyContent={"flex-start"}
                  gap={10} key={index}>
              <HStack>
                <FormLabel
                  htmlFor={`${param.name}-key`}
                  fontWeight={"400"}
                  fontSize={"12px"}
                  w={"150px"}
                >{param.name} key :</FormLabel>
                <Input
                  fontSize={"12px"}
                  placeholder={"Leave empty if not required"}
                  padding={"8px"}
                  border={"1px solid #ccc"}
                  borderRadius={"4px"}
                  w={"250px"}
                  type="text" id={`${param.name}-key`} name={`${param.name}-key`}/>
              </HStack>
              <HStack>
                <FormLabel
                  htmlFor={`${param.name}-value`}
                  fontWeight={"400"}
                  fontSize={"12px"}
                  w={"150px"}
                >{param.name} value :</FormLabel>
                <Input
                  padding={"8px"}
                  border={"1px solid #ccc"}
                  borderRadius={"4px"}
                  w={"250px"}
                  fontSize={"12px"}
                  type="text" id={`${param.name}-value`} name={`${param.name}-value`}/>
              </HStack>
            </Flex>
          ))}
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
              type="submit">Call {props.methodName}</Button>
          </Box>
        </form>
      </Flex>
    );
  }
;

export default JsonRpcForm;
