pragma solidity >=0.6.2 <0.9.0;
pragma experimental ABIEncoderV2;
import "./EllipticCurve.sol";
import "./PedersenHash.sol";
import "hardhat/console.sol";

contract StarknetVerifier {
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
            hashvalue = pedersen.hash(
                proof.binaryProof.leftHash,
                proof.binaryProof.rightHash
            );
        } else {
            hashvalue =
                (pedersen.hash(
                    proof.edgeProof.childHash,
                    proof.edgeProof.path
                ) + uint256(proof.edgeProof.length)) %
                3618502788666131213697322783095070105623107215331596699973092056135872020481; // module big prime
        }
        // console.log("fromBinaryArrayToUint n: %s", hashvalue);

        console.log("hashForSingleProofNode hashvalue: %s", hashvalue);
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
        uint256 contractRootClassHash = pedersen.hash(
            classHash,
            contractStateRoot
        );
        uint256 rootClassHashWithNonce = pedersen.hash(
            contractRootClassHash,
            nonce
        );
        uint256 stateHash = pedersen.hash(rootClassHashWithNonce, hashVersion);
        return stateHash;
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

        console.log("stateHash: %s", stateHash);
        return false;
    }

    function verify_proof(
        uint256 rootHash,
        uint256 path,
        uint256 value,
        StarknetProof[] calldata proofArray
    ) public view returns (bool) {
        uint256 expectedHash = rootHash;
        uint256 path_bits_index = highestBitSet(path);

        console.log("rootHash: %s", rootHash);
        bool isRight = true;
        for (uint256 i = 0; i < proofArray.length; i++) {
            console.log("i: %s", i);
            console.log("path_bits_index: %s", path_bits_index);
            StarknetProof memory proof = proofArray[i];
            if (expectedHash != hashForSingleProofNode(proof)) {
                console.log("we failed");
                return false;
            } else {
                console.log("yaay we passed");
            }
            if (proof.nodeType == NodeType.BINARY) {
                // console.log("rootHash: %s", rootHash);
                isRight = ((path >> path_bits_index) & 1) == 1;
                //isRight = (getValue(path, path_bits_index) == 1);
                path = path & ~(1 << path_bits_index);
                console.log("rem path: %s", path);
                if (isRight == true) {
                    console.log("isRight");
                    expectedHash = proof.binaryProof.rightHash;
                } else {
                    console.log("islLeft");
                    expectedHash = proof.binaryProof.leftHash;
                }
                path_bits_index--;
                console.log(
                    "Binary",
                    proof.binaryProof.leftHash,
                    proof.binaryProof.rightHash
                );
            } else {
                console.log("Edge");
                console.log("proof.edgeProof.path: %s", proof.edgeProof.path);
                if (path != proof.edgeProof.path) {
                    console.log("we failed ");
                    return false;
                } else {
                    uint256 length = proof.edgeProof.length;
                    console.log("we passed the comparePaths");
                    expectedHash = proof.edgeProof.childHash;
                    console.log("expectedHash: %s", expectedHash);
                    console.log("proof.edgeProof.length: %s", length);
                    // length - 1, because we have already progressed towards the LSB of the path
                    path_bits_index -= uint256(proof.edgeProof.length - 1);
                    console.log("path_bits_index: %s", path_bits_index);
                    console.log("expectedHash: %s", expectedHash);
                }
                console.log(
                    "Edge",
                    proof.edgeProof.path,
                    proof.edgeProof.childHash
                );
            }
        }

        if (expectedHash == value) {
            return true;
        } else {
            return false;
        }
    }
}
