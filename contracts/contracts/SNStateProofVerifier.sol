// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.2 <0.9.0;
import "./EllipticCurve.sol";
import "./PedersenHash.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

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

// includes contract proof and state/storage proof for a partciular starknet block
struct StarknetCompositeStateProof {
    int256 blockNumber;
    uint256 classCommitment;
    ContractData contractData;
    StarknetProof[] contractProofArray;
    StarknetProof[] storageProofArray;
}

interface PoseidonHash3 {
    // this is the hades permutation function. TODO update the name when goerli eth is not so expensive
    function poseidon(
        uint256[3] memory input
    ) external view returns (uint256[3] memory);
}

// Starknet Core Contract Minimal Interface
// Defining the parts of the core contract interface that we need. i.e. stateRoot and stateBlockNumber
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

// Starknet Proof Verifier. This contract verifies a Starknet proof for a contract and a storage address/value
contract SNStateProofVerifier is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    uint256 private constant BIG_PRIME =
        3618502788666131213697322783095070105623107215331596699973092056135872020481;
    uint256 private constant FELT_FOR_STARKNET_STATE_V0 =
        28355430774503553497671514844211693180464; // short_str_to_felt for "STARKNET_STATE_V0"
    PedersenHash public pedersen;
    PoseidonHash3 public poseidon;
    StarknetCoreContract public starknetCoreContract;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address pedersenAddress,
        address poseidonAddress,
        address _starknetCoreContractAddress
    ) public initializer {
        pedersen = PedersenHash(pedersenAddress);
        poseidon = PoseidonHash3(poseidonAddress);
        starknetCoreContract = StarknetCoreContract(
            _starknetCoreContractAddress
        );
        __Ownable_init();
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal virtual override onlyOwner {}

    function hashForSingleProofNode(
        StarknetProof memory proof
    ) private view returns (uint256) {
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

    // based on https://docs.starknet.io/documentation/architecture_and_concepts/Hashing/hash-functions/
    function poseidonHashMany(
        uint256[] memory elems
    ) public view returns (uint256) {
        uint256[3] memory state = [uint256(0), uint256(0), uint256(0)];

        for (uint256 i = 0; i < (elems.length - 1); i += 2) {
            state[0] = (state[0] + elems[i]) % BIG_PRIME;
            state[1] = (state[1] + elems[i + 1]) % BIG_PRIME;
            state = poseidon.poseidon(state);
        }

        uint256 rem = elems.length % 2;
        if (rem == 1) {
            state[0] = (state[0] + elems[elems.length - 1]) % BIG_PRIME;
        }
        state[rem] = (state[rem] + (1)) % BIG_PRIME;

        return poseidon.poseidon(state)[0];
    }

    // this functions connects the contract state root with value of leaf node in the contract proof.
    // state_hash = H(H(H(class_hash, contract_root), contract_nonce), RESERVED)
    function stateHash(
        uint256 classHash,
        uint256 contractStateRoot,
        uint256 nonce,
        uint256 hashVersion
    ) private view returns (uint256) {
        uint256 _stateHash = hash(
            hash(hash(classHash, contractStateRoot), nonce),
            hashVersion
        );
        return _stateHash;
    }

    function hash(uint256 a, uint256 b) public view returns (uint256) {
        // TO DO: check if this is correct, the zero index access is not cool
        uint256[] memory hashes = pedersen.hash(convertToBytes(a, b));

        require(hashes.length > 0, "hashes returned length is less than zero!");

        return hashes[0];
    }

    function convertToBytes(
        uint256 x,
        uint256 y
    ) private pure returns (bytes memory) {
        bytes memory b = new bytes(64);
        assembly {
            mstore(add(b, 32), x)
        }
        assembly {
            mstore(add(b, 64), y)
        }

        return b;
    }

    // Verify the proof and return the value of the storage variable value otherwise revert.
    // Non-membership proof is not supported.
    // Only supports verifiying a proof for a single storage variable value.
    function verifiedStorageValue(
        int256 blockNumber,
        uint256 classCommitment,
        ContractData calldata contractData,
        StarknetProof[] calldata contractProofArray,
        StarknetProof[] calldata storageProofArray
    ) public view returns (uint256 value) {
        // There are two parts of the proof.
        // First part verifies the storage proof against the contract stateroot
        // and H(H(H(class_hash, contract_root), contract_nonce), RESERVED) should be the value(value in the leaf node) for the path in the contract proof.
        // Second part verifies the contract proof against the state root committed on L1 in the Starknet Core Contract
        console.log("stateRoot", starknetCoreContract.stateRoot());
        int256 coreStateBlockNumber = starknetCoreContract.stateBlockNumber();

        // proof array must have atleast one element
        require(
            contractProofArray.length > 0,
            "contract proofs must have atleast one element!"
        );

        require(
            storageProofArray.length > 0,
            "storage proofs must have atleast one element!"
        );

        // This is a safe assumption.
        require(
            coreStateBlockNumber > 0,
            "failed to fetch starknet core contract state block!"
        );

        require(
            blockNumber == coreStateBlockNumber,
            "block number doesn't match with starknet core contract!"
        );

        uint256 _stateHash = stateHash(
            contractData.classHash,
            contractData.contractStateRoot,
            contractData.nonce,
            contractData.hashVersion
        );

        uint256 storageVarValue = verifyStorageProof(
            contractData.contractStateRoot,
            contractData.storageVarAddress,
            storageProofArray
        );

        require(
            _stateHash != 0,
            "stateroot hash is not fetched properly! revert"
        );

        // the contract proof has to be verified against the state root committed on L1 in the Starknet Core Contract
        uint256 expectedStateHash = verifyProof(
            starknetCoreContract.stateRoot(),
            contractData.contractAddress,
            contractProofArray,
            classCommitment
        );

        require(
            _stateHash == expectedStateHash,
            "hashes don't match. invalid states!"
        );
        return storageVarValue;
    }

    // takes in two uint256 (a,b) values and returns true if the bits in the range [bitIndex, bitIndex + length - 1] of 'a' is equal to 'b' are equal.
    function compareBitsWithStartIndexAndLength(
        uint256 a,
        uint256 b,
        uint256 bitIndex,
        uint256 length
    ) private pure returns (bool) {
        uint256 msbitsToChopOff = 255 - bitIndex;
        uint256 aExtracted = ((a << msbitsToChopOff) >> msbitsToChopOff) >>
            (bitIndex - (length - 1));
        return aExtracted == b;
    }

    // overloaded/wrapper function around verifyProof, used to verify storage proof array where the class commitment does not apply
    function verifyStorageProof(
        uint256 rootHash,
        uint256 path,
        StarknetProof[] calldata proofArray
    ) public view returns (uint256 value) {
        // classCommitment is 0 means we are verifying storage proof array
        return verifyProof(rootHash, path, proofArray, 0);
    }

    // A generic method to verify a proof against a root hash and a path.
    function verifyProof(
        uint256 rootHash,
        uint256 path,
        StarknetProof[] calldata proofArray,
        uint256 classCommitment // 0 means no class commitment
    ) public view returns (uint256 value) {
        require(
            proofArray.length > 0,
            "proof array must have atleast one element."
        );
        uint256 expectedHash = rootHash;
        int256 pathBitIndex = 250; // start from the MSB bit index
        if (classCommitment > 0) {
            // https://docs.starknet.io/documentation/architecture_and_concepts/State/starknet-state/
            uint256 calculatedContractStateRoot = hashForSingleProofNode(
                proofArray[0]
            ); // the hash of first element in the proof array is the contract state root
            uint256[] memory poseidonInput = new uint256[](3);
            poseidonInput[0] = FELT_FOR_STARKNET_STATE_V0;
            poseidonInput[1] = calculatedContractStateRoot;
            poseidonInput[2] = classCommitment;

            uint256 calculateStateCommitment = poseidonHashMany(poseidonInput);
            require(
                calculateStateCommitment == expectedHash,
                "calculated state commitment doesn't match with the expected state commitment!"
            );
            // since we have already verified the first element in the proof array correctly hashes up to the state commitment, we can assume the hash of first element in the proof array is correct.
            expectedHash = calculatedContractStateRoot;
        }

        bool isRight = true;
        for (uint256 i = 0; i < proofArray.length; i++) {
            if (pathBitIndex >= 0) {
                StarknetProof memory proof = proofArray[i];
                if (expectedHash != hashForSingleProofNode(proof)) {
                    revert(
                        "hash mismatch found!! invalid proof path reverting."
                    );
                }
                if (proof.nodeType == NodeType.BINARY) {
                    isRight = ((path >> uint256(pathBitIndex)) & 1) == 1;
                    // path = path & ~(1 << uint256(pathBitIndex));
                    // setting/clearing the bit as move through the path
                    if (isRight == true) {
                        expectedHash = proof.binaryProof.rightHash;
                    } else {
                        expectedHash = proof.binaryProof.leftHash;
                    }
                    pathBitIndex--;
                } else {
                    bool isPathEqual = compareBitsWithStartIndexAndLength(
                        path,
                        proof.edgeProof.path,
                        uint256(pathBitIndex),
                        proof.edgeProof.length
                    );
                    if (isPathEqual == false) {
                        revert(
                            "Invalid proof, potentially a proof for a different storage var/ non inclusion"
                        );
                    }
                    expectedHash = proof.edgeProof.childHash;
                    int256 edgePathLength = int256(proof.edgeProof.length);
                    pathBitIndex -= edgePathLength;
                }
            }
        }
        // if the loop is complete and pathBitIndex is equal to -1 otherwise the proof is invalid
        if (pathBitIndex == -1) {
            return expectedHash;
        }
        revert("length of proof mismatched, invalid proof size!!");
    }
}
