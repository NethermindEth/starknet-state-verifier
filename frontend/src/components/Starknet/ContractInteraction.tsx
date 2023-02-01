import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  Divider,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  Input,
  Link,
  Slide,
  SlideFade,
  Text,
  Tooltip,
  useBreakpointValue,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { ProviderInterface, Contract } from "starknet";
import { connect, IStarknetWindowObject } from "@argent/get-starknet";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@chakra-ui/icons";
import { shortenHex } from "../../utils/helpers";
import { hexToDecimalString } from "starknet/utils/number";
import { useQuery } from "@tanstack/react-query";

// import starknetJson from "../../abi/StarknetCairo.json";
// import { Abi } from "starknet/types/lib";

interface IStarknetAccountCard {
  address?: string;
  baseUrl?: string;
  chainId?: string;
  feederGatewayUrl?: string;
  gatewayUrl?: string;
}

const StarknetAccountCard: React.FC<IStarknetAccountCard> = ({
  address,
  baseUrl,
  chainId,
  feederGatewayUrl,
  gatewayUrl,
}) => {
  const { isOpen, onToggle } = useDisclosure();
  const toast = useToast();
  return (
    <Box>
      <Flex display={"flex"} align={"center"} justify={"space-between"}>
        <Box
          display={"flex"}
          alignItems={"center"}
          justifyContent={"space-between"}
          onClick={() => {
            window.navigator.clipboard.writeText(
              address || "0x0000000000000000000000000000000"
            );
            toast({
              title: "Address copied to clipboard.",
              status: "success",
              isClosable: true,
            });
          }}
        >
          <CheckCircleIcon color={"green.500"} />
          <Tooltip label={address}>
            <Text color={"green.500"} ml={"2px"}>
              {shortenHex(address || "0x0000000000000000000000000000000", 5)}
            </Text>
          </Tooltip>
        </Box>
        <Tooltip label={"View Connected Account Details"}>
          <Button onClick={onToggle} variant={"outline"}>
            {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </Button>
        </Tooltip>
      </Flex>
      <Collapse in={isOpen} animateOpacity>
        <Box>
          <Flex>
            <Text>Address: </Text>
            <Text color={"blue.300"}>{address}</Text>
          </Flex>
          <Flex>
            <Text>Base URL: </Text>
            <Text color={"blue.300"}>{baseUrl}</Text>
          </Flex>
          <Flex>
            <Text>Feeder Gateway URL: </Text>
            <Text color={"blue.300"}>{feederGatewayUrl}</Text>
          </Flex>
          <Flex>
            <Text>Gateway URL: </Text>
            <Text color={"blue.300"}>{gatewayUrl}</Text>
          </Flex>
          <Flex>
            <Text>Chain Id: </Text>
            <Text color={"blue.300"}>{chainId}</Text>
          </Flex>
        </Box>
      </Collapse>
    </Box>
  );
};

interface IStarknetContractInteraction {
  parentRootHash: string;
}

const StarknetContractInteraction: React.FC<IStarknetContractInteraction> = ({
  parentRootHash,
}) => {
  const toast = useToast();
  const [walletState, setWalletState] = useState<{
    isConnected: boolean;
    starknet: IStarknetWindowObject | null;
  }>({
    isConnected: false,
    starknet: null,
  });

  const [contractAddress, setContractAddress] = useState<string>(
    "0x07412b9155cdb517c5d24e1c80f4af96f31f221151aab9a9a1b67f380a349ea3"
  );
  const [nameHash, setNameHash] = useState("0x00");

  useEffect(() => {
    setNameHash(parentRootHash);
  }, [parentRootHash]);

  const handleArgentConnect = async () => {
    // Let the user pick a wallet (on button click)
    try {
      const starknet = await connect();

      if (!starknet) {
        throw Error(
          "User rejected wallet selection or silent connect found nothing"
        );
      }

      // (optional) connect the wallet
      await starknet?.enable();

      // Check if connection was successful
      if (starknet.isConnected) {
        // If the extension was installed and successfully connected, you have access to a starknet.js Signer object to do all kinds of requests through the user's wallet contract.
        //   starknet.account.execute({});
        setWalletState({
          isConnected: true,
          starknet: starknet,
        });
      } else {
        // In case the extension wasn't successfully connected you still have access to a starknet.js Provider to read starknet states and sent anonymous transactions
        // starknet.provider.callContract( ... )
        setWalletState({
          isConnected: false,
          starknet: starknet,
        });
      }
    } catch (e) {
      switch (e) {
        default:
          toast({
            title: "Some Error Occured!!",
            isClosable: true,
            duration: 3000,
            status: "error",
          });
      }
    }
  };
  const borderColor = useColorModeValue("gray.600", "whiteAlpha.600");

  const gridCols = useBreakpointValue({
    base: "repeat(1, 1fr)",
    md: "repeat(2, 1fr)",
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["resolve"],
    queryFn: async () => {
      if (walletState?.starknet) {
        const starknet = walletState.starknet;
        const response = await starknet.provider.callContract({
          contractAddress: contractAddress,
          entrypoint: "resolve",
          calldata: [hexToDecimalString(nameHash)],
        });
        if (response.result.length > 0) {
          return response.result[0];
        }
        return "0x00";
      } else {
        return "none";
      }
    },

    enabled: !!nameHash && !!contractAddress,
    refetchInterval: 3000,
  });

  const [starknetFnParams, setStarknetFnParams] = useState({
    new_id: "",
    proofs: "",
  });

  const [resultTx, setResultTx] = useState("");

  const sendTransaction = async () => {
    if (walletState.isConnected && walletState.starknet) {
      const starknet = walletState.starknet;

      try {
        const result = await starknet.account.execute([
          {
            contractAddress: contractAddress,
            entrypoint: "set_starknet_id",
            calldata: [
              hexToDecimalString(nameHash),
              hexToDecimalString(starknetFnParams.new_id),
              hexToDecimalString("0x01"),
              hexToDecimalString("0x01"),
            ],
          },
        ]);
        toast({
          title: "Transaction sent successfully",
          description: `TxHash: ${result.transaction_hash}`,
          status: "success",
          isClosable: true,
          duration: 5000,
        });
        setResultTx(result.transaction_hash);
      } catch (e) {
        console.log(e);
        toast({
          title: "Some error occured. Check console for logs!!",
          isClosable: true,
          duration: 3000,
          status: "error",
        });
      }
    } else {
      toast({
        title: "wallet not connected. please connect wallet",
        status: "error",
      });
    }
  };

  return (
    <Box
      mt={"10px"}
      p={"10px"}
      borderColor={borderColor}
      borderWidth={"1px"}
      borderStyle={"dashed"}
    >
      <Heading variant={"h3"} fontSize={"xl"} textAlign={"center"}>
        Interact with Starknet Deployed Contract
      </Heading>
      <Box>
        {walletState.isConnected ? (
          <Box>
            <StarknetAccountCard {...walletState.starknet?.account} />
            <Box>
              <FormControl>
                <FormLabel fontWeight={"semibold"}>Contract Address</FormLabel>
                <Input
                  type="text"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                />
                <FormHelperText>
                  This is the L2 Deployed Contract on starknet.
                  <Link
                    href={`https://goerli.voyager.online/contract/${contractAddress}`}
                    target="_blank"
                    rel="noopenner noreferer"
                  >
                    View it on Voyager
                  </Link>
                </FormHelperText>
              </FormControl>
              <Divider my={"20px"} />
              <FormControl>
                <FormLabel fontWeight={"semibold"}>NameHash</FormLabel>
                <Input
                  type="text"
                  value={nameHash}
                  onChange={(e) => setNameHash(e.target.value)}
                />
                <FormHelperText>
                  This is the namehash you can calculate from above.
                </FormHelperText>
              </FormControl>
            </Box>
            <Divider my={"20px"} />
            <Grid templateColumns={gridCols} gap={"10px"}>
              <GridItem>
                <Box p={"10px"}>
                  <Box>
                    <Heading fontSize={"xl"}>Call Function</Heading>
                    <Text color={"purple.600"} wordBreak={"break-all"}>
                      resolve({nameHash})
                    </Text>
                  </Box>
                  <Box>
                    <Button onClick={() => refetch()} mb={"10px"}>
                      {isLoading ? <CircularProgress /> : "CALL"}
                    </Button>
                    <Text wordBreak={"break-all"}>
                      Value Fetched:{" "}
                      <Box as={"span"} color={"blue.300"}>
                        {data}
                      </Box>
                    </Text>
                  </Box>
                </Box>
              </GridItem>
              <GridItem>
                <Box
                  p={"10px"}
                  borderLeft={"1px solid rgba(255, 255, 255, 0.1)"}
                  w={{ base: "100%" }}
                >
                  <Heading variant={"h3"} fontSize={"xl"}>
                    Modify L2 Mapping
                  </Heading>
                  <Box>
                    <FormControl>
                      <FormLabel>Namehash</FormLabel>
                      <Input
                        type="text"
                        value={nameHash}
                        onChange={(e) => setNameHash(e.target.value)}
                      />
                      <FormHelperText>
                        The the namehash calulated above.
                      </FormHelperText>
                    </FormControl>
                    <Divider my={"10px"} />
                    <FormControl>
                      <FormLabel>New Starknet ID</FormLabel>
                      <Input
                        type="text"
                        value={starknetFnParams.new_id}
                        onChange={(e) =>
                          setStarknetFnParams({
                            ...starknetFnParams,
                            new_id: e.target.value,
                          })
                        }
                      />
                      <FormHelperText>
                        This the value you want to resolve to from L2. (Ideally
                        your address)
                      </FormHelperText>
                    </FormControl>
                    <Divider my={"10px"} />
                    <FormControl>
                      <FormLabel>Proofs</FormLabel>
                      <Input
                        type="text"
                        value={starknetFnParams.proofs}
                        onChange={(e) =>
                          setStarknetFnParams({
                            ...starknetFnParams,
                            proofs: e.target.value,
                          })
                        }
                      />
                      <FormHelperText>
                        Proofs for the function. (Enter them comma seperated)
                      </FormHelperText>
                    </FormControl>
                    <Text
                      wordBreak={"break-all"}
                      color={"purple.400"}
                    >{`call set_starknet_id(${nameHash}, ${
                      starknetFnParams.new_id
                    }, [${starknetFnParams.proofs.split(",")}])`}</Text>
                    <Button my={"10px"} onClick={sendTransaction}>
                      Set New Value
                    </Button>
                  </Box>
                  <Box>
                    {resultTx && (
                      <Link
                        href={`https://goerli.voyager.online/tx/${resultTx}`}
                        target="_blank"
                        rel="noopenner noreferer"
                        wordBreak={"break-all"}
                      >
                        View Transaction on Voayger: {resultTx}
                      </Link>
                    )}
                  </Box>
                </Box>
              </GridItem>
            </Grid>
          </Box>
        ) : (
          <Button onClick={handleArgentConnect}>Connect Argent Wallet</Button>
        )}
      </Box>
    </Box>
  );
};

export default StarknetContractInteraction;
