import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Flex,
  FormLabel,
  IconButton,
  Input,
  Link,
  Select,
  Text,
  Tooltip,
  useColorModeValue,
  useToast,
  VStack,
  Image
} from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import { L1_RESOLVER_VERIFIER_ADDRESS } from "../../constants";
import { CopyIcon } from "@chakra-ui/icons";


const Steps = () => {
  const toast = useToast();
  const exampleDomain = "starknetiscool.eth"
  const exampleAddress = "5678"

  return (
    <Box
      display={"flex"}
      alignItems={"left"}
      justifyContent={"left"}
      flexDirection={"column"}
    >
      <Text fontSize={"lg"} fontWeight={"bold"} wordBreak={"break-all"}>
        Steps to resolve ENS name via Starknet
      </Text>
      <br />

      <Box
        display={"flex"}
        flexDirection={{ base: "column", md: "row" }}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Tooltip
          label={
            "Copy this resolver address to your clipboard."
          }
          placement={"top-start"}
        >
          <Text fontSize={"lg"} fontWeight={"bold"} wordBreak={"break-all"}>
            Custom resolver address on L1:{" "}
            <Box as="span" display={"inline-block"} color={"green"}>
              {L1_RESOLVER_VERIFIER_ADDRESS}
            </Box>
          </Text>
        </Tooltip>
        <IconButton
          onClick={(e) => {
            navigator.clipboard.writeText(L1_RESOLVER_VERIFIER_ADDRESS);
            toast({
              title: "Copied to Clipboard",
              status: "info",
              isClosable: true,
              duration: 1000,
            });
          }}
          aria-label="copy masked name hash"
          variant={"outline"}
        >
          <CopyIcon />
        </IconButton>
      </Box>
      <br />
      <Text fontSize={"lg"} fontWeight={"bold"}>1. Open your ens app, currently on Goerli supported.</Text>
      <Image src={"/accountsPage.png"} display={"inline"} />

      <br />
      <Text fontSize={"lg"} fontWeight={"bold"}>2. Select the domain name you want to resolve via starknet. On this page we have selected {exampleDomain}</Text>
      <Image src={"/domainPage.png"} display={"inline"} />

      <br />
      <Text fontSize={"lg"} fontWeight={"bold"}>3. Scroll down and in the advanced section, set the resolver to a custom resolver {L1_RESOLVER_VERIFIER_ADDRESS}</Text>
      <Image src={"/setResolver.png"} display={"inline"} />

      <br />
      <Text fontSize={"lg"} fontWeight={"bold"}>4. In the ens resolution tab of this app search the domain name {exampleDomain} </Text>
      <Image src={"/searchEnsName.png"} display={"inline"} />

      <br />
      <Text fontSize={"lg"} fontWeight={"bold"}>5. Set the starknet id field(proof is optional) and press 'set new value' button, this will be the value your address {exampleDomain} will resolver to, in the page we are setting it to {exampleAddress}</Text>
      <Image src={"/setStarknetID.png"} display={"inline"} />

      <br />
      <Text fontSize={"lg"} fontWeight={"bold"}>6. Tap on the voyager link and you should wait until the transaction is settled on L1. This is important, until it is settled on L1, this will not show up in the ENS APP</Text>
      <Image src={"/acceptedOnl1.png"} display={"inline"} />


      <br />
      <Text fontSize={"lg"} fontWeight={"bold"}>7. Back on the ens app, on the domain page for {exampleDomain} the eth address should resolve to {exampleAddress}</Text>
      <Image src={"/postSetEnsPage.png"} display={"inline"} />

    </Box>
  );
}

export default Steps;
