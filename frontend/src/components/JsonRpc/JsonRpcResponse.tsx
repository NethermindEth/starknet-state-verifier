import React, {Key} from "react";
import {Box, Code, Flex} from "@chakra-ui/react";


const JsonRpcResponse = ({data}: { data: any }) => {

  return (
    <Flex
      flexDir={"column"}
      alignItems={"center"}
      justifyContent={"center"}
      w={"100%"}
      padding={"16px"}
    >
      {data && <Code maxHeight={"500px"} maxW={"800px"} overflowX={"scroll"} textAlign="left" whiteSpace={"pre"}
                     display={"block"} _hover={{backgroundColor: "gray.200"}}
                     onClick={(e) => navigator.clipboard.writeText(JSON.stringify(data))} cursor={"copy"}
      >
        {JSON.stringify(data, null, 2)}
      </Code>
      }
    </Flex>
  );
};

export default JsonRpcResponse;
