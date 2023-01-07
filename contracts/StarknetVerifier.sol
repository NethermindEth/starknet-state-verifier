pragma solidity >=0.6.2 <0.9.0;
pragma experimental ABIEncoderV2;
import "./EllipticCurve.sol";
import "./PedersenHash.sol";
import "hardhat/console.sol";

//import "./StarknetCoreImpl.json";

interface StarknetCoreContract {
    /**
        Returns the current state root.
        */
    function stateRoot() external view returns (uint256);

    /**
        Returns the current block number.
        */
    function stateBlockNumber() external view returns (int256);
}

contract StarknetVerifier {
    uint256 private constant BIG_PRIME =
        3618502788666131213697322783095070105623107215331596699973092056135872020481;

    enum NodeType {
        BINARY,
        EDGE
    }

    struct ContractData {
        uint256 contractStateRoot;
        uint256 contractAddress;
        uint256 storageVarAddress;
        uint256 classHash;
        uint256 hashVersion;
        uint256 nonce;
    }
    struct BinaryProof {
        uint256 leftHash;
        uint256 rightHash;
    }

    struct EdgeProof {
        uint256 childHash;
        uint256 path;
        uint256 length;
    }

    struct StarknetProof {
        NodeType nodeType;
        BinaryProof binaryProof;
        EdgeProof edgeProof;
    }

    PedersenHash pedersen;
    StarknetCoreContract starknetCoreContract;

    // address starknetCoreContractAddress =
    //     0xde29d060D45901Fb19ED6C6e959EB22d8626708e; // TODO pointing to address on goerli testnet, needs to be removed

    constructor(address pedersenAddress, address _starknetCoreContractAddress)
        public
    {
        pedersen = PedersenHash(pedersenAddress);
        starknetCoreContract = StarknetCoreContract(
            _starknetCoreContractAddress
        );
    }

    function hashForSingleProofNode(StarknetProof memory proof)
        public
        view
        returns (uint256)
    {
        uint256 hashvalue = 0;
        if (proof.nodeType == NodeType.BINARY) {
            hashvalue = hash(
                proof.binaryProof.leftHash,
                proof.binaryProof.rightHash
            );
        } else {
            hashvalue =
                (hash(proof.edgeProof.childHash, proof.edgeProof.path) +
                    uint256(proof.edgeProof.length)) %
                BIG_PRIME; // module big prime
        }
        return hashvalue;
    }

    // copied and modified from https://github.com/ethereum/solidity-examples/blob/master/src/bits/Bits.sol
    // Computes the index of the highest bit set in 'number'.
    // Returns the highest bit set as an 'uint'.
    // Requires that 'number != 0'.
    // function highestBitSet(uint256 number)
    //     public
    //     pure
    //     returns (uint256 highest)
    // {
    //     require(number != 0);
    //     uint256 val = number;
    //     uint256 ONE = uint256(1);

    //     for (uint256 i = 128; i >= 1; i >>= 1) {
    //         if (val & (((ONE << i) - 1) << i) != 0) {
    //             highest += i;
    //             val >>= i;
    //         }
    //     }
    // }

    // state_hash = H(H(H(class_hash, contract_root), contract_nonce), RESERVED)
    function stateHash(
        uint256 classHash,
        uint256 contractStateRoot,
        uint256 nonce,
        uint256 hashVersion
    ) public view returns (uint256) {
        uint256 stateHash = hash(
            hash(hash(classHash, contractStateRoot), nonce),
            hashVersion
        );
        return stateHash;
    }

    function hash(uint256 a, uint256 b) public view returns (uint256) {
        // TO DO: check if this is correct, the zero index access is not cool
        return pedersen.hash(convertToBytes(a, b))[0];
    }

    function convertToBytes(uint256 x, uint256 y)
        public
        view
        returns (bytes memory)
    {
        bytes memory b = new bytes(64);
        assembly {
            mstore(add(b, 32), x)
        }
        assembly {
            mstore(add(b, 64), y)
        }

        return b;
    }

    function verifiedStorageValue(
        int256 blockNumber,
        ContractData calldata contractData,
        StarknetProof[] calldata contractProofArray,
        StarknetProof[] calldata storageProofArray
    ) public view returns (uint256 value) {
        console.log("stateRoot", starknetCoreContract.stateRoot());
        require(
            blockNumber == starknetCoreContract.stateBlockNumber(),
            "Block number is invalid"
        );

        uint256 stateHash = stateHash(
            contractData.classHash,
            contractData.contractStateRoot,
            contractData.nonce,
            contractData.hashVersion
        );
        uint256 storageVarValue = verifyProof(
            contractData.contractStateRoot,
            contractData.storageVarAddress,
            storageProofArray
        );

        uint256 expectedStateHash = verifyProof(
            starknetCoreContract.stateRoot(),
            contractData.contractAddress,
            contractProofArray
        );

        require(stateHash == expectedStateHash, "State hash is invalid");
        return storageVarValue;
    }

    function verifyProof(
        uint256 rootHash,
        uint256 path,
        StarknetProof[] calldata proofArray
    ) public view returns (uint256 value) {
        uint256 expectedHash = rootHash;
        int256 pathBitIndex = 250; // start from the MSB bit index

        bool isRight = true;
        for (uint256 i = 0; i < proofArray.length; i++) {
            if (pathBitIndex >= 0) {
                StarknetProof memory proof = proofArray[i];
                if (expectedHash != hashForSingleProofNode(proof)) {
                    revert("Proof is invalid");
                }
                if (proof.nodeType == NodeType.BINARY) {
                    isRight = ((path >> uint256(pathBitIndex)) & 1) == 1;
                    // path = path & ~(1 << uint256(pathBitIndex)); // setting/clearing the bit as move through the path
                    if (isRight == true) {
                        expectedHash = proof.binaryProof.rightHash;
                    } else {
                        expectedHash = proof.binaryProof.leftHash;
                    }
                    pathBitIndex--;
                } else {
                    // if (path != proof.edgeProof.path) {
                    //     revert("Proof is invalid");
                    // }
                    expectedHash = proof.edgeProof.childHash;
                    int256 edgePathLength = int256(proof.edgeProof.length);
                    pathBitIndex -= edgePathLength;
                    console.log("pathBitIndex", uint256(pathBitIndex));
                }
            }
        }
        // if the loop is complete and pathBitIndex is equal to -1 otherwise the proof is invalid
        if (pathBitIndex == -1) {
            return expectedHash;
        }
        revert("Proof is invalid");
    }
}
