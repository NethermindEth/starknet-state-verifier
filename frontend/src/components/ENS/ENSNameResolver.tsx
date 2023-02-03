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
} from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import { namehash } from "ethers/lib/utils.js";
import { BigNumber, Contract, ethers } from "ethers";
import { CopyIcon } from "@chakra-ui/icons";
import { useContract, useEnsResolver, useProvider } from "wagmi";
import resolverAbi from "../../abi/StarknetVerifier.json";
import StarknetContractInteraction from "../Starknet/ContractInteraction";

interface INameResolver {
  name: string;
  nameHash: string;
}

interface CoinType {
  name: string;
  id: number;
}

const NameResolver: React.FC<INameResolver> = ({ name, nameHash }) => {
  const provider = useProvider();
  const toast = useToast();

  const { data, isError, isLoading } = useEnsResolver({
    name: name,
    enabled: !!name,
  });

  // Make a contract provider to the resolver address.
  const contract = useContract({
    address: data?.address || ethers.constants.AddressZero,
    abi: resolverAbi.abi,
    signerOrProvider: provider,
  });

  const borderColor = useColorModeValue("gray.600", "whiteAlpha.600");
  const [coinNumbers, setCoinNumbers] = useState<Array<CoinType>>([
    {
      name: "starknet",
      id: 9004,
    },
    {
      name: "ethereum",
      id: 60,
    },
  ]);

  const [activeCoinNumber, setActiveCoinNumber] = useState(9004);

  const [ccipResolvedValue, setCcipResolvedValue] = useState<null | string>(
    null
  );
  const [ccipLoading, setCcipLoading] = useState(false);

  useEffect(() => {
    setCcipResolvedValue(null);
  }, [name]);

  const handleFetch = async () => {
    if (data?.address !== null && contract && activeCoinNumber) {
      setCcipLoading(true);
      try {
        const retrievedValue = await contract?.callStatic[
          "addr(bytes32,uint256)"
        ](nameHash, activeCoinNumber, {
          ccipReadEnabled: true,
        });
        console.log(`addr(bytes32,uint256)`, retrievedValue);
        setCcipResolvedValue(retrievedValue);
      } catch (e: any) {
        console.log("Errored", e.errorArgs);
        const { sender, urls, callData, callbackFunction, extraData } =
          e.errorArgs;
        console.log(1, { sender, urls, callData, callbackFunction, extraData });
        const url = urls[0]
          .replace(/{sender}/, sender)
          .replace(/{data}/, callData);
        console.log(2, { url });
        const fetched = await fetch(url);
        const responseData: any = await fetched.json();
        console.log({ responseData });
        if (responseData) {
          try {
            const encoded = ethers.utils.defaultAbiCoder.encode(
              ["bytes", "bytes"],
              [responseData.data, extraData]
            );
            const data = ethers.utils.hexConcat([callbackFunction, encoded]);
            const result = await provider.call({
              to: contract.address,
              data,
            });
            console.log(4, { result });
            const decodedResult = contract.interface.decodeFunctionResult(
              "bytesAddrWithProof",
              result
            );
            console.log(5, { decodedResult });
            setCcipResolvedValue(decodedResult.toString());
          } catch (ee) {
            console.log(6, { ee });
          }
        }
      }
      setCcipLoading(false);
    }
  };

  const resolveCcipValueMessage = (message: string | null | undefined) => {
    if (message === "0x" || message === null || message === "undefined") {
      return "No valid value returned from the resolver resolution.";
    } else {
      return `Value fetched : ${message}`;
    }
  };

  if (isLoading)
    return (
      <Box
        display={"flex"}
        alignItems={"center"}
        justifyContent={"center"}
        flexDirection={"column"}
      >
        <CircularProgress isIndeterminate={true} />{" "}
        <Text>Fetching resolver…</Text>
      </Box>
    );
  if (isError)
    return (
      <Box
        display={"flex"}
        alignItems={"center"}
        justifyContent={"center"}
        flexDirection={"column"}
      >
        <Text color={"red"}>Error in resolving ENS Name!!!</Text>
      </Box>
    );
  return data?.address ? (
    <Box
      p={"10px"}
      borderColor={borderColor}
      borderWidth={"1px"}
      borderStyle={"dashed"}
    >
      <VStack>
        <Text wordBreak={"break-all"}>
          Resolver for{" "}
          <Box display={"inline-block"} as={"span"}>
            <Link
              href={`https://app.ens.domains/name/${name}`}
              fontWeight={"bold"}
              color={"orange"}
              target="_blank"
              rel="noopener noreferer"
            >
              {name}
            </Link>
          </Box>{" "}
          is{" "}
          <Box display={"inline-block"} as={"span"}>
            <Link
              href={`https://goerli.etherscan.io/address/${data?.address}`}
              fontWeight={"bold"}
              color={"orange"}
              target="_blank"
              rel="noopener noreferer"
            >
              {data?.address}
            </Link>
          </Box>
        </Text>
        <Divider />
        <Flex>
          <Input
            placeholder="Your CoinType"
            value={activeCoinNumber}
            type="number"
            onChange={(e) => {
              try {
                const coinId = parseInt(e.target.value);
                if (Number.isNaN(coinId)) {
                  throw Error("Not a valid CoinId");
                }
                if (coinId < 0) {
                  throw Error("Coin Id's are non negative");
                }
                setActiveCoinNumber(coinId);
              } catch (e: any) {
                toast({
                  title: e?.message || "Coin Types are Integers Only!!",
                  isClosable: true,
                  duration: 2000,
                  status: "error",
                });
              }
            }}
            mr={"10px"}
          />
          <Select
            onChange={(e) => {
              setActiveCoinNumber(parseInt(e.target.value));
            }}
          >
            {coinNumbers.map((coinNumber) => {
              return (
                <option key={coinNumber.id} value={coinNumber.id}>
                  {coinNumber.name}
                </option>
              );
            })}
          </Select>
        </Flex>
        <Button onClick={handleFetch} disabled={ccipLoading}>
          {ccipLoading ? (
            <CircularProgress isIndeterminate size={"24px"} />
          ) : (
            "FETCH CCIP VALUE"
          )}
        </Button>
        <Text wordBreak={"break-all"}>
          {resolveCcipValueMessage(ccipResolvedValue)}
        </Text>
      </VStack>
    </Box>
  ) : (
    <Box
      p={"10px"}
      borderColor={borderColor}
      borderWidth={"1px"}
      borderStyle={"dashed"}
    >
      <Text color="red">This ENS Name resolved to no valid address!!</Text>
    </Box>
  );
};

const ENSNameResolver = () => {
  const [ensName, setEnsName] = useState({
    name: "",
    nameHash: "0x0",
    isValidNameHash: false,
  });

  const toast = useToast();

  useEffect(() => {
    try {
      const nameHash = namehash(ensName.name);
      setEnsName({
        ...ensName,
        nameHash,
        isValidNameHash: true,
      });
    } catch (e: any) {
      setEnsName({
        ...ensName,
        isValidNameHash: false,
      });
      toast({
        title: "Invalid ENS Name",
        description: e?.message || "Some Error Occured",
        colorScheme: "red",
        status: "error",
        isClosable: true,
        duration: 3000,
      });
    }
  }, [ensName.name]);

  const maskedNameHash = useMemo(() => {
    return BigNumber.from(ensName.nameHash).mask(250).toHexString();
  }, [ensName.nameHash]);

  return (
    <Box>
      <Flex direction={{ base: "column" }} alignItems={"center"} mb={"35px"}>
        <FormLabel
          htmlFor="ensName"
          display={"block"}
          w={{ base: "100%" }}
          fontWeight="bold"
          fontSize={"lg"}
        >
          ENS Name
        </FormLabel>
        <Input
          id="ensName"
          placeholder="Your ENS Name Here..."
          value={ensName.name}
          onChange={(e) => {
            setEnsName({
              ...ensName,
              name: e.target.value,
            });
          }}
          outlineColor={ensName.isValidNameHash ? "green" : "red"}
        />
      </Flex>
      <Box my={"10px"}>
        <Text wordBreak={"break-all"}>
          Calculated namehash: {ensName.nameHash}
        </Text>
        <Box
          display={"flex"}
          flexDirection={{ base: "column", md: "row" }}
          alignItems={"center"}
          justifyContent={"space-between"}
        >
          <Tooltip
            label={
              "We need to mask nameHash as starknet works on 251 bits only."
            }
            placement={"top-start"}
          >
            <Text fontSize={"lg"} fontWeight={"bold"} wordBreak={"break-all"}>
              250 bit namehash:{" "}
              <Box as="span" display={"inline-block"} color={"green"}>
                {maskedNameHash}
              </Box>
            </Text>
          </Tooltip>
          <IconButton
            onClick={(e) => {
              navigator.clipboard.writeText(maskedNameHash);
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
      </Box>
      <Box>
        <NameResolver name={ensName.name} nameHash={ensName.nameHash} />
      </Box>
      <Box>
        <StarknetContractInteraction parentRootHash={maskedNameHash} />
      </Box>
    </Box>
  );
};

export default ENSNameResolver;
