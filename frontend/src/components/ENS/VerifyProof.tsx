import React, { useEffect, useState } from "react";
import { BigNumberish, Signer } from "ethers";
import { useContractRead } from "wagmi";
import {
  Box,
  Button,
  Divider,
  Flex,
  FormLabel,
  Heading,
  HStack,
  Input,
  Link,
  Select,
  Text,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import StarknetVerifier from "../../abi/SNResolverStub.json";
import { Spinner } from "@chakra-ui/react";

import { EnsProofCardState } from "./EnsProofCard";
import { L1_EXPLORER_BASE_URL, L2_EXPLORER_BASE_URL, L1_RESOLVER_VERIFIER_ADDRESS } from "../../constants";
import { ArrowDownIcon } from "@chakra-ui/icons";
import { StarknetContractData, StarknetCompositeStateProof, StarknetProof, parseStarknetProof } from "pathfinder_getproof_lib";

interface Props {
  state: EnsProofCardState;
}


interface IVerificationResult {
  type: "success" | "error";
  message: string;
  data?: any;
}

const VERIFIER_ADDRESS = L1_RESOLVER_VERIFIER_ADDRESS; // this is on goerli, plus update in the UI field to your custom deployment

const VerifyProof: React.FC<Props> = (props: Props) => {
  const {
    proof,
    contractAddress,
    ethereumBlockNumber,
    starknetCommitmentBlockNumber,
    storageAddress,
  } = props.state;

  const toast = useToast();

  // This hook manages verifier address on L1 Chain for verification purposes.
  const [verifierAddress, setVerifierAddress] =
    useState<string>(VERIFIER_ADDRESS);

  const availableVeriferAddresses = [
    VERIFIER_ADDRESS,
  ];

  // const [starknetStateRoot, setStarknetStateRoot] = useState('');
  const [storageProof, setStorageProof] = useState<StarknetProof[]>([]);
  const [contractProof, setContractProof] = useState<StarknetProof[]>([]);
  const [classCommitment, setClassCommitment] = useState<BigNumberish>('');

  const [isLoading, setIsLoading] = useState(false);
  // const [blockNumber, setBlockNumber] = useState<string>();

  const [verificationResult, setVerificationResult] =
    useState<IVerificationResult>();
  const [submit, setSubmit] = useState(false);
  const [contractData, setContractData] = useState<StarknetContractData>();

  const readContractVerifier = useContractRead({
    address: verifierAddress,
    abi: StarknetVerifier.abi,
    functionName: "verifiedStorageValue",
    args: [
      starknetCommitmentBlockNumber,
      classCommitment,
      contractData,
      contractProof,
      storageProof,
    ],
    overrides: { blockTag: parseInt(ethereumBlockNumber!) },
    enabled: !!proof?.contractData && !!contractData,
    onError: (error: Error) => {
      console.log(error);
      setVerificationResult({
        type: "error",
        message: error.message,
      });
    },
    onSettled(data, error: Error | null) {
      if (data) {
        toast({
          title: "Fetched Successfully.",
          description:
            "Successfully retrieved state from the verifier contract.",
          status: "success",
          isClosable: true,
          duration: 3000,
        });
        setVerificationResult({ type: "success", message: data.toString() });
      } else {
        console.log(error);
        toast({
          title: "Failed to fetch state!!",
          description: "Failed to verify state from the Verifier contract.",
          status: "error",
          isClosable: true,
          duration: 3000,
        });
        setVerificationResult({
          type: "error",
          message:
            error?.message ||
            "Some Error Occured in Fetching!! Check console Logs.",
        });
      }
    },
  });


  useEffect(() => {
    /// parse proof JSON
    console.log(!proof?.contract_data);
    if (!proof?.contract_data) {
      toast({
        title: "Contract doesn't Exists!!",
        description:
          "Failed to fetch contract data from L2. Make sure your contract exists on starknet L2.",
        status: "error",
        isClosable: true,
        duration: 3000,
      });
      return;
    }

    let parsedProof: StarknetCompositeStateProof = parseStarknetProof(proof, contractAddress, storageAddress, starknetCommitmentBlockNumber);
    setClassCommitment(parsedProof.classCommitment);
    setContractProof(parsedProof.contractProofArray);
    setStorageProof(parsedProof.storageProofArray);
    setContractData(parsedProof.contractData);
  }, [proof]);


  // refetch contractRead hook
  useEffect(() => {
    if (contractProof && contractData && storageProof) {
      fetchResult();
    }
  }, [contractData, contractProof, storageProof, verifierAddress]);

  const fetchResult = async () => {
    setIsLoading(true);
    try {
      console.log("block number", ethereumBlockNumber);
      if (!!contractData) {
        await readContractVerifier.refetch({
          throwOnError: true,
          cancelRefetch: false,
        });
        console.log("verifying proof...");
      }
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  };

  const handleSubmit = () => {
    setSubmit(!submit);
    fetchResult();
  };

  return (
    <Box w={"100%"} p={"20px"} border={"1px dashed"}>
      <Heading variant={"h3"} fontSize={"4xl"} textAlign={"center"}>
        Verification
      </Heading>
      <Box my={"20px"}>
        <Flex
          direction={{ base: "column", md: "row" }}
          w={"100%"}
          alignItems={{ base: "flex-start", md: "flex-start" }}
          justifyContent={"space-around"}
        >
          <FormLabel
            htmlFor={"verifier"}
            fontSize={"sm"}
            fontWeight={"bold"}
            margin={"0px"}
            w={{ base: "100%", md: "20%" }}
            mt={"10px"}
          >
            <Tooltip
              label={
                "Contract Address for the verifier contract deployed on L1 (Ethereum)."
              }
            >
              Verifier's Address
            </Tooltip>
          </FormLabel>
          <Box>
            <Select
              variant="outline"
              placeholder="Available Verifier Contract"
              icon={<ArrowDownIcon />}
              onChange={(e) => {
                setVerifierAddress(e.target.value);
              }}
              my={"5px"}
            >
              {availableVeriferAddresses.map((address: string) => {
                return (
                  <option key={address} value={address}>
                    {address}
                  </option>
                );
              })}
            </Select>
            <Input
              w={{ base: "100%", md: "100%" }}
              fontSize={"sm"}
              type="text"
              id={"verifier"}
              name={"verifier"}
              value={verifierAddress}
              placeholder={"Input verifier address on L1 or select"}
              onChange={(e) => {
                setVerifierAddress(e.target.value);
              }}
            />
          </Box>
          <Button
            my={"10px"}
            ml={{ base: "0px", md: "10px" }}
            fontWeight={"600"}
            cursor={"pointer"}
            colorScheme={"blue"}
            onClick={handleSubmit}
          >
            Verify proof
          </Button>
        </Flex>
        {/* <HStack>
          <FormLabel
            htmlFor={"state-root"}
            fontWeight={"400"}
            fontSize={"12px"}
            w={"150px"}
          > {"Starknet state root: "}</FormLabel>
          <Input
            padding={"8px"}
            border={"1px solid #ccc"}
            borderRadius={"4px"}
            w={"250px"}
            fontSize={"12px"}
            type="text" id={"state-root"} name={"state-root"} />
        </HStack> */}
      </Box>
      <Box w={"100%"}>
        <Heading as={"h5"} variant={"h5"} fontSize={"2xl"} textAlign={"center"}>
          Verified Storage Value
        </Heading>
        <Flex alignItems={"center"} justifyContent={"center"} w={"100%"}>
          {isLoading ? (
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="blue.500"
              size="xl"
            />
          ) : (
            <Box textAlign={"center"}>
              <Text my={"10px"}>
                Verified against ethereum block
                <Link
                  mx={"10px"}
                  colorScheme={"blue"}
                  fontWeight={"700"}
                  href={`${L1_EXPLORER_BASE_URL}/${ethereumBlockNumber}`}
                  target="_blank"
                  rel={"noopenner noreferer"}
                >
                  #{ethereumBlockNumber}
                </Link>
                and starknet block
                <Link
                  mx={"10px"}
                  colorScheme={"blue"}
                  fontWeight={"700"}
                  href={`${L2_EXPLORER_BASE_URL}/${starknetCommitmentBlockNumber}`}
                  target="_blank"
                  rel={"noopenner noreferer"}
                >
                  #{starknetCommitmentBlockNumber}
                </Link>
                .
              </Text>
              <Divider />
              <Text>Fetched Result:</Text>
              <Text
                wordBreak={"break-word"}
                fontWeight={"900"}
                color={verificationResult?.type === "error" ? "red" : "green"}
              >
                {verificationResult?.message}
              </Text>
            </Box>
          )}
        </Flex>
      </Box>
    </Box>
  );
};

export default VerifyProof;
