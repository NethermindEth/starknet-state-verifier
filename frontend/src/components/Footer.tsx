import { Box, Divider, Flex, Image, Link, Text } from "@chakra-ui/react";
import React from "react";

const Footer = () => {
  return (
    <Box w={"100%"} mt={"100px"}>
      <Divider />
      <Flex dir="column" p={"20px"} justify={"center"}>
        <Text fontSize={"20px"}>
          Made with ❤️ at
          <Link href={"http://nethermind.io/"} target={"_blank"} rel={"noopener noreferer"}> Nethermind</Link>{" "}
          <Image src="/logo.svg" h={"20px"} display={"inline"} />
        </Text>
      </Flex>
    </Box>
  );
};

export default Footer;
