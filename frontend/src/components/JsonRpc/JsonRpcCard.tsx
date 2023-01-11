import JsonRpcForm from "./JsonRpcForm";
import { Box, Card, Collapse, Divider, Heading, HStack } from "@chakra-ui/react";
import React, { Key } from "react";
import JsonRpcResponse from "./JsonRpcResponse";
import { ChevronRightIcon, ChevronUpIcon } from '@chakra-ui/icons'

interface Props {
  // The name of the JSON-RPC method to call
  method: { name: string; params: string[] };
  // The parameters for the JSON-RPC method
}


const JsonRpcCard = (props: Props) => {

  const [result, setResult] = React.useState()
  const [folded, setFolded] = React.useState(true)

  const RpcCallCard = () => (
    <>
      <HStack
        onClick={() => setFolded(!folded)}
        cursor={"pointer"}
      >
        {folded ? <ChevronRightIcon /> : <ChevronUpIcon />}
        <Heading as={"h3"}
          fontSize={"18px"}
          fontWeight={"600"}
        >{props.method.name}
        </Heading>
      </HStack>
      <Collapse in={!folded}>
        <JsonRpcForm
          methodName={props.method.name}
          params={props.method.params}
          onResult={setResult}
        />
        <JsonRpcResponse data={result} onResult={(data: any) => { }} />
      </Collapse>
      <Divider />
    </>
  )

  return (
    <Box
      marginY={"8px"}
      borderRadius={"4px"}
    >
      <RpcCallCard />
    </Box>
  );
}

export default JsonRpcCard;