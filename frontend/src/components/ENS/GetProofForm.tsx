import React, { Key, useEffect, useMemo, useState } from "react";
import jsonRpcCall from "../../utils/RpcCall";
import {
  Box,
  Button,
  Flex,
  FormLabel,
  Heading,
  HStack,
  Input,
  Text,
  Tooltip,
  useColorModeValue,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useBlockNumber, useContractRead, useProvider } from "wagmi";
import StarknetCoreContract from "../../abi/StarknetCoreContract.json";
import { BigNumber, BigNumberish } from "ethers";
import { Spinner } from "@chakra-ui/react";
import { ethers } from "ethers";

import { useAccount, useConnect } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { EnsProofCardState, EnsProofCardStateKeys } from "./EnsProofCard";
import { CheckCircleIcon } from "@chakra-ui/icons";

interface Props {
  state: EnsProofCardState;
  setState: (newState: EnsProofCardState) => any;
  mutateProofCardState: (key: EnsProofCardStateKeys, value: string) => any;
}

interface StarknetCoreContractState {
  stateRoot: string;
  stateBlockNumber: BigNumberish;
}

interface IPathFinderSyncState {
  starting_block_num: BigNumber;
  current_block_num: BigNumber;
  highest_block_num: BigNumber;
  starting_block_hash: string;
  current_block_hash: string;
  highest_block_hash: string;
}

const GetProofForm: React.FC<Props> = ({
  state,
  setState,
  mutateProofCardState,
}) => {
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [starknetCoreContractAddress, setStarknetCoreContractAddress] =
    useState<string>("0xde29d060D45901Fb19ED6C6e959EB22d8626708e");

  const [coreContractRootState, setContractRootState] =
    useState<StarknetCoreContractState>({
      stateBlockNumber: BigNumber.from("0"),
      stateRoot: "",
    });
  const [pathFinderSyncState, setPathFinderSyncState] =
    useState<IPathFinderSyncState>({
      starting_block_num: BigNumber.from(0),
      current_block_num: BigNumber.from(0),
      highest_block_num: BigNumber.from(0),
      starting_block_hash: "",
      current_block_hash: "",
      highest_block_hash: "",
    });

  const provider = useProvider();
  // const provider = ethers.providers.getDefaultProvider("goerli");

  const getLatestEthereumBlockNumber = async (): Promise<number> => {
    return await provider.getBlockNumber();
  };

  const makeCoreContractInstance = () => {
    return new ethers.Contract(
      starknetCoreContractAddress,
      StarknetCoreContract.abi,
      // Changed to default ethers provider since not using any signature or transaction (Change to wallet one if transaction required.)
      provider
    );
  };

  const getStarknetCommittedBlockNumber = async (
    ethereumBlockNumber: number
  ): Promise<number> => {
    const readCoreContract = makeCoreContractInstance();
    const starknetCommittedBlock = await readCoreContract.stateBlockNumber({
      blockTag: ethereumBlockNumber,
    });
    return BigNumber.from(starknetCommittedBlock).toNumber();
  };

  const getRootState = async () => {
    const readCoreContract = makeCoreContractInstance();
    const stateRoot: BigNumberish = await readCoreContract.stateRoot();
    const stateBlockNumber: BigNumberish =
      await readCoreContract.stateBlockNumber();
    setContractRootState({
      ...coreContractRootState,
      stateRoot: stateRoot.toString(),
      stateBlockNumber: stateBlockNumber,
    });
  };

  const getRPCSyncState = async () => {
    try {
      const result = await jsonRpcCall("starknet_syncing", []);
      setPathFinderSyncState({
        ...result,
        starting_block_num: BigNumber.from(result.starting_block_num),
        current_block_num: BigNumber.from(result.current_block_num),
        highest_block_num: BigNumber.from(result.highest_block_num),
      } as unknown as IPathFinderSyncState);
    } catch (e) {
      toast({
        title: "Failed to get RPC",
        description: "Failed to fetch RPC from Pathfinder",
        duration: 3000,
        isClosable: true,
        status: "error",
      });
    }
  };

  const [currentCount, setCount] = useState(1);

  const timer = () => {
    getRootState();
    getRPCSyncState();
    setCount(currentCount + 1);
  };

  // Required for First Load Trigger
  useEffect(() => {
    getRootState();
    getRPCSyncState();
  }, []);

  // This calls as per interval timer
  useEffect(() => {
    const id = setInterval(timer, 10000);

    return () => clearInterval(id);
  }, [coreContractRootState]);

  
  const { connector: activeConnector, isConnected } = useAccount();

  const { connect, connectors, error, pendingConnector } = useConnect({
    connector: new InjectedConnector(),
  });

  // Handle the form submission
  const handleSubmit = async () => {
    // Not necessary to connect.
    // if (!isConnected) {
    //   connect();
    // }

    // const formData = new FormData(event.currentTarget);
    const contractAddress = state.contractAddress;
    const storageAddress = state.storageAddress;
    // setStarknetCoreContractAddress(formData.get('corecontract-address') as string);
    // setStorageAddress(storageAddress);
    // setContractAddress(contractAddress);

    if (!contractAddress?.trim()) {
      toast({
        title: "Invalid Contract Address",
        description: "Enter a valid Contract Address for L2",
        duration: 3000,
        isClosable: true,
        status: "error",
      });
      return;
    }

    setIsLoading(true);

    // Fetch and update Ethereum Block Number
    const ethereumBlockNumber = await getLatestEthereumBlockNumber();
    // Fetch and update Starknet Commited Block Number
    const committedBlockNumber = await getStarknetCommittedBlockNumber(
      ethereumBlockNumber
    );

    console.log("readCoreContract block #", committedBlockNumber);

    let blockArg = { block_number: committedBlockNumber };
    const args = [blockArg, contractAddress, [storageAddress]];
    console.log(args);
    // Call the JSON-RPC method with the given params
    // and pass the result to the onResult callback
    const result = await jsonRpcCall("pathfinder_getProof", args);
    console.log(result);

    setState({
      ...state,
      ethereumBlockNumber: ethereumBlockNumber.toString(),
      starknetCommitmentBlockNumber: committedBlockNumber.toString(),
      proof: result,
    });

    setIsLoading(false);
  };

  const stateRootColor = useColorModeValue("green", "palegreen");
  const stateRootBlockNumberColor = useColorModeValue("blue", "lightblue");

  return (
    <Flex flexDir={"column"} justifyContent={"flex-start"} width={"100%"}>
      <Flex
        direction={{ base: "column", md: "row" }}
        my={"10px"}
        alignItems={{ base: "flex-start", md: "center" }}
      >
        <FormLabel
          htmlFor={"contract-address"}
          fontSize={"sm"}
          fontWeight={"bold"}
          margin={"0px"}
          w={{ base: "100%", md: "20%" }}
        >
          <Tooltip
            label={
              "Contract Address for which you want to verify storage variable on L2 (Starknet)."
            }
          >
            Contract Address
          </Tooltip>
        </FormLabel>
        <Input
          w={{ base: "100%", md: "80%" }}
          fontSize={"sm"}
          type="text"
          id={"contract-address"}
          name={"contract-address"}
          onChange={(e) =>
            mutateProofCardState("contractAddress", e.target.value)
          }
          value={state?.contractAddress}
        />
      </Flex>
      <Flex
        direction={{ base: "column", md: "row" }}
        my={"10px"}
        alignItems={{ base: "flex-start", md: "center" }}
      >
        <FormLabel
          htmlFor={"storagevar-address"}
          fontSize={"sm"}
          fontWeight={"bold"}
          margin={"0px"}
          w={{ base: "100%", md: "20%" }}
        >
          <Tooltip label={"This is calculated from above storage inputs"}>
            Storage variable address
          </Tooltip>
        </FormLabel>
        <Input
          padding={"8px"}
          border={"1px solid #ccc"}
          borderRadius={"4px"}
          w={{ base: "100%", md: "80%" }}
          fontSize={"sm"}
          value={state?.storageAddress}
          readOnly
          type="text"
          id={"storagevar-address"}
          name={"storagevar-address"}
        />
      </Flex>
      <Flex
        direction={{ base: "column", md: "row" }}
        my={"10px"}
        alignItems={{ base: "flex-start", md: "center" }}
      >
        <FormLabel
          htmlFor={"block-tag"}
          fontSize={"sm"}
          fontWeight={"bold"}
          margin={"0px"}
          w={{ base: "100%", md: "20%" }}
        >
          <Tooltip
            label={
              "This is main starknet rollup contract deployed on L1 Ethereum."
            }
          >
            StarknetCoreContract Address
          </Tooltip>
        </FormLabel>
        <Input
          value={starknetCoreContractAddress}
          onChange={(e) => {
            setStarknetCoreContractAddress(e.target.value);
          }}
          w={{ base: "100%", md: "80%" }}
          fontSize={"sm"}
          type="text"
          id={"corecontract-address"}
          name={"corecontract-address"}
        />
      </Flex>
      <Text my={"10px"}>
        Core Contract State Root:{" "}
        <Text as={"span"} fontWeight={"900"} color={stateRootColor}>
          {coreContractRootState.stateRoot}
        </Text>
      </Text>
      <Flex direction={{ base: "column", md: "row" }}>
        <Box>
          <Tooltip
            label={"This represent the sycned block number of Starknet on L1"}
            placement="top-start"
          >
            <Text mb={"10px"}>
              Core contract state synced block number:{" "}
              <Text
                as={"span"}
                fontWeight={"900"}
                color={stateRootBlockNumberColor}
              >
                {coreContractRootState.stateBlockNumber.toString()}
              </Text>
            </Text>
          </Tooltip>
          <Tooltip
            label={
              "This represents the synced block number on starknet with pathfinder node of starknet on L2"
            }
            placement="top-start"
          >
            <Text mb={"10px"}>
              Pathfinder Synced Current Block:{" "}
              <Text
                as={"span"}
                fontWeight={"900"}
                color={stateRootBlockNumberColor}
              >
                {pathFinderSyncState.current_block_num.toString()}
              </Text>
            </Text>
          </Tooltip>
        </Box>
        <Box
          ml={{ base: "0px", md: "10px" }}
          mb={{ base: "10px" }}
          border={`1px dashed`}
          p={"10px"}
        >
          {pathFinderSyncState.current_block_num.gt(
            coreContractRootState.stateBlockNumber
          ) ? (
            <Tooltip
              label={"Pathfinder is synced upto L1 core starknet contract."}
            >
              <Box
                display={"flex"}
                flexDir={"column"}
                alignItems={"center"}
                justifyContent={"center"}
              >
                <CheckCircleIcon fontSize={40} color={stateRootColor} />
                <Text>synced</Text>
              </Box>
            </Tooltip>
          ) : (
            <Tooltip
              label={"Pathfinder is not synced upto L1 core starknet contract."}
              color={"red"}
            >
              <Box
                display={"flex"}
                flexDir={"column"}
                alignItems={"center"}
                justifyContent={"center"}
              >
                <CheckCircleIcon fontSize={40} color={"red"} />
                <Text>unsynced</Text>
              </Box>
            </Tooltip>
          )}
        </Box>
      </Flex>
      <Box>
        <Button
          variant={"solid"}
          colorScheme={"blue"}
          cursor={"pointer"}
          disabled={isLoading}
          onClick={handleSubmit}
        >
          {isLoading ? <Spinner /> : "Call pathfinder_getProof"}
        </Button>
      </Box>
    </Flex>
  );
};
export default GetProofForm;
