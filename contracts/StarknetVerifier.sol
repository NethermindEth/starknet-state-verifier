pragma solidity >=0.6.2 <0.9.0;
pragma experimental ABIEncoderV2;
import "./EllipticCurve.sol";
import "./PedersenHash.sol";
import "hardhat/console.sol";

contract StarknetVerifier {
    uint256 private constant BIG_PRIME =
        3618502788666131213697322783095070105623107215331596699973092056135872020481;

    enum NodeType {
        BINARY,
        EDGE
    }

    struct ContractData {
        uint256 stateRoot;
        uint256 contractStateRoot;
        uint256 contractAddress;
        uint256 storageVarAddress;
        uint256 storageVarValue;
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

    constructor(address pedersenAddress) public {
        pedersen = PedersenHash(pedersenAddress);
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
    function highestBitSet(uint256 number)
        public
        pure
        returns (uint256 highest)
    {
        require(number != 0);
        uint256 val = number;
        uint256 ONE = uint256(1);

        for (uint256 i = 128; i >= 1; i >>= 1) {
            if (val & (((ONE << i) - 1) << i) != 0) {
                highest += i;
                val >>= i;
            }
        }
    }

    // state_hash = H(H(H(class_hash, contract_root), contract_nonce), RESERVED)
    function stateHash(
        uint256 classHash,
        uint256 contractStateRoot,
        uint256 nonce,
        uint256 hashVersion
    ) public view returns (uint256) {
        // uint256 contractRootClassHash = ;
        // uint256 rootClassHashWithNonce = ;
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

    function verifyCompleteProof(
        ContractData calldata contractData,
        StarknetProof[] calldata contractProofArray,
        StarknetProof[] calldata storageProofArray
    ) public view returns (bool) {
        uint256 stateHash = stateHash(
            contractData.classHash,
            contractData.contractStateRoot,
            contractData.nonce,
            contractData.hashVersion
        );
        bool isStorageProofValid = verify_proof(
            contractData.contractStateRoot,
            contractData.storageVarAddress,
            contractData.storageVarValue,
            storageProofArray
        );

        if (isStorageProofValid == false) {
            return false;
        }

        bool isContractProofValid = verify_proof(
            contractData.stateRoot,
            contractData.contractAddress,
            stateHash,
            contractProofArray
        );

        return isContractProofValid;
    }

    function verify_proof(
        uint256 rootHash,
        uint256 path,
        uint256 value,
        StarknetProof[] calldata proofArray
    ) public view returns (bool) {
        uint256 expectedHash = rootHash;
        uint256 path_bits_index = highestBitSet(path);

        bool isRight = true;
        for (uint256 i = 0; i < proofArray.length; i++) {
            StarknetProof memory proof = proofArray[i];
            if (expectedHash != hashForSingleProofNode(proof)) {
                return false;
            }
            if (proof.nodeType == NodeType.BINARY) {
                isRight = ((path >> path_bits_index) & 1) == 1;
                path = path & ~(1 << path_bits_index); // setting/clearing the bit as move through the path
                if (isRight == true) {
                    expectedHash = proof.binaryProof.rightHash;
                } else {
                    expectedHash = proof.binaryProof.leftHash;
                }
                path_bits_index--;
                // console.log(
                //     "Binary",
                //     proof.binaryProof.leftHash,
                //     proof.binaryProof.rightHash
                // );
            } else {
                // console.log("Edge");
                // console.log("proof.edgeProof.path: %s", proof.edgeProof.path);
                if (path != proof.edgeProof.path) {
                    return false;
                } else {
                    uint256 length = proof.edgeProof.length;
                    expectedHash = proof.edgeProof.childHash;
                    path_bits_index -= uint256(
                        highestBitSet(proof.edgeProof.path)
                    );
                }
            }
        }

        if (expectedHash == value) {
            return true;
        } else {
            return false;
        }
    }
}
