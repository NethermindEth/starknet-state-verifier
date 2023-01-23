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
  Text,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import StarknetVerifier from "../../abi/StarknetVerifier.json";
import { Spinner } from "@chakra-ui/react";

import { EnsProofCardState } from "./EnsProofCard";
import { L1_EXPLORER_BASE_URL, L2_EXPLORER_BASE_URL } from "../../constants";

interface Props {
  state: EnsProofCardState;
}

interface MyBinaryProof {
  leftHash: BigNumberish;
  rightHash: BigNumberish;
}

interface MyEdgeProof {
  childHash: BigNumberish;
  path: BigNumberish;
  length: BigNumberish;
}

interface MyStarknetProof {
  nodeType: BigNumberish;
  binaryProof: MyBinaryProof;
  edgeProof: MyEdgeProof;
}

interface MyContractData {
  contractStateRoot: BigNumberish;
  contractAddress: BigNumberish;
  storageVarAddress: BigNumberish;
  classHash: BigNumberish;
  hashVersion: BigNumberish;
  nonce: BigNumberish;
}

interface IVerificationResult {
  type: "success" | "error";
  message: string;
  data?: any;
}

const VERIFIER_ADDRESS = "0x995c2A07cd092AC5E4bCB655B9C0e58FFB952d70"; // this is on goerli, plus update in the UI field to your custom deployment

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

  // const [starknetStateRoot, setStarknetStateRoot] = useState('');
  const [storageProof, setStorageProof] = useState([]);
  const [contractProof, setContractProof] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  // const [blockNumber, setBlockNumber] = useState<string>();

  const [verificationResult, setVerificationResult] =
    useState<IVerificationResult>();
  const [submit, setSubmit] = useState(false);
  const [contractData, setContractData] = useState<MyContractData>();

  const readContractVerifier = useContractRead({
    address: verifierAddress,
    abi: StarknetVerifier.abi,
    functionName: "verifiedStorageValue",
    args: [
      starknetCommitmentBlockNumber,
      contractData,
      contractProof,
      storageProof[0],
    ],
    overrides: { blockTag: parseInt(ethereumBlockNumber!) },
    enabled: false,
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
          description: "Failed to fetch state from the Verifier contract.",
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

  function parseProofElement(element: any): MyStarknetProof {
    console.log(element);
    if (element.binary != undefined) {
      return {
        nodeType: 0,
        binaryProof: {
          leftHash: element.binary.left,
          rightHash: element.binary.right,
        },
        edgeProof: {
          childHash: 0,
          path: 0,
          length: 0,
        },
      };
    } else if (element.edge != undefined) {
      return {
        nodeType: 1,
        binaryProof: {
          leftHash: 0,
          rightHash: 0,
        },
        edgeProof: {
          childHash: element.edge.child,
          path: element.edge.path.value,
          length: element.edge.path.len,
        },
      };
    } else {
      throw new Error("Invalid proof element");
    }
  }

  useEffect(() => {
    /// parse proof JSON
    if (!proof) return;

    let myContractProofs: any = [];
    let myStorageproofs: any = [];
    proof.contract_proof.forEach((element: any) => {
      myContractProofs.push(parseProofElement(element));
    });

    if (proof.contract_data?.storage_proofs) {
      proof.contract_data?.storage_proofs.forEach((storage_proof: any) => {
        let myStorageProof: any = [];
        storage_proof.forEach((element: any) => {
          myStorageProof.push(parseProofElement(element));
        });
        myStorageproofs.push(myStorageProof);
      });
    }

    setContractProof(myContractProofs);
    setStorageProof(myStorageproofs);
  }, [proof]);

  // recompute contract data used with the contractRead hook
  useEffect(() => {
    if (!proof) {
      return;
    }
    const _contractData: MyContractData = {
      contractStateRoot: proof.contract_data?.root || "0x0",
      contractAddress: contractAddress!,
      storageVarAddress: storageAddress!,
      classHash: proof.contract_data?.class_hash || "0x0",
      hashVersion: proof.contract_data?.contract_state_hash_version || "0x0",
      nonce: proof.contract_data?.nonce || "0x0",
    };
    setContractData(_contractData);
  }, [proof]);

  // refetch contractRead hook
  useEffect(() => {
    if (contractProof && contractData && storageProof) {
      fetchResult();
    }
  }, [contractData, contractProof, storageProof, verifierAddress]);

  const fetchResult = async () => {
    try {
      setIsLoading(true);
      console.log("block number", ethereumBlockNumber);
      await readContractVerifier.refetch({
        throwOnError: true,
        cancelRefetch: false,
      });
      console.log("verifying proof...");
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      toast({
        title: "Failed to Refetch",
        description: "Failed to Refetch state from the Verifier contract.",
        status: "error",
        isClosable: true,
        duration: 3000,
      });
      setIsLoading(false);
    }
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
          alignItems={{ base: "flex-start", md: "center" }}
        >
          <FormLabel
            htmlFor={"verifier"}
            fontSize={"sm"}
            fontWeight={"bold"}
            margin={"0px"}
            w={{ base: "100%", md: "20%" }}
          >
            <Tooltip
              label={
                "Contract Address for the verifier contract deployed on L1 (Ethereum)."
              }
            >
              Verifier's Address
            </Tooltip>
          </FormLabel>
          <Input
            w={{ base: "100%", md: "80%" }}
            fontSize={"sm"}
            type="text"
            id={"verifier"}
            name={"verifier"}
            value={verifierAddress}
            onChange={(e) => {
              setVerifierAddress(e.target.value);
            }}
          />
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
