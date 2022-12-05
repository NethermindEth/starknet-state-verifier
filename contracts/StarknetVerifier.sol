pragma solidity >=0.6.2 <0.9.0;
pragma experimental ABIEncoderV2;
import "./EllipticCurve.sol";
import "./PedersenHashNaive.sol";
import "hardhat/console.sol";

contract StarknetVerifier {
    enum NodeType {
        BINARY,
        EDGE
    }

    struct BinaryProof {
        uint256 leftHash;
        uint256 rightHash;
    }

    struct EdgeProof {
        uint256 childHash;
        uint256 path;
        int256 length;
    }

    struct StarknetProof {
        NodeType nodeType;
        BinaryProof binaryProof;
        EdgeProof edgeProof;
    }

    function uint256ToBinaryArray(uint256 input)
        internal
        pure
        returns (uint256[] memory)
    {
        uint256 integer = input;
        uint256[] memory array = new uint256[](251);
        uint256 i = 0;
        while (integer > 0) {
            uint256 bit = integer % 2;
            uint256 quotient = integer / 2;
            array[i] = bit;
            integer = quotient;
            i++;
        }
        return array;
    }

    function comparePaths(
        uint256[] memory path1Array,
        uint256[] memory path2Array,
        uint256 start,
        uint256 length
    ) internal pure returns (bool) {
        for (uint256 i = start; i < start + length; i++) {
            if (path1Array[i] != path2Array[i]) {
                return false;
            }
        }
        return true;
    }

    function hashForSingleProofNode(StarknetProof memory proof)
        public
        view
        returns (uint256)
    {
        uint256 hashvalue = 0;
        if (proof.nodeType == NodeType.BINARY) {
            hashvalue = PedersenHashNaive.hash(
                proof.binaryProof.leftHash,
                proof.binaryProof.rightHash
            );
        } else {
            hashvalue =
                (PedersenHashNaive.hash(
                    proof.edgeProof.childHash,
                    proof.edgeProof.path
                ) + uint256(proof.edgeProof.length)) %
                3618502788666131213697322783095070105623107215331596699973092056135872020481; // module big prime
        }
        console.log("hashForSingleProofNode hashvalue: %s", hashvalue);
        return hashvalue;
    }

    function fromBinaryArrayToUint(uint256[] memory input)
        public
        view
        returns (uint256)
    {
        uint256 n = 0;

        for (int256 i = 250; i >= 0; i--) {
            n *= 2;
            uint256 index = uint256(i);
            if (input[index] == 1) {
                n += 1;
            } else {
                // revert on malformed input
                require(input[index] == 0);
            }
        }
        console.log("fromBinaryArrayToUint n: %s", n);
        return n;
    }

    function verify_proof(
        uint256 rootHash,
        uint256 path,
        uint256 value,
        StarknetProof[] calldata proofArray
    ) public view returns (bool) {
        uint256 expectedHash = rootHash;
        // uint256 i = 0;
        uint256[] memory path_bits = uint256ToBinaryArray(path);
        uint256 originalValue = fromBinaryArrayToUint(path_bits);
        console.log("verify_proof originalValue: %s", originalValue);
        require(originalValue == path, "path and paths_bits are not equal");
        uint256 path_bits_index = path_bits.length - 1;

        // 1 is right
        // 0 is left

        console.log("rootHash: %s", rootHash);
        for (uint256 i = 0; i < proofArray.length; i++) {
            StarknetProof memory proof = proofArray[i];
            if (expectedHash != hashForSingleProofNode(proof)) {
                console.log("we failed");
                return false;
            } else {
                console.log("yaay we passed");
            }
            if (proof.nodeType == NodeType.BINARY) {
                bool isRight = (path_bits[path_bits_index] == 0);
                if (isRight == true) {
                    expectedHash = proof.binaryProof.rightHash;
                } else {
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
                if (
                    false ==
                    comparePaths(
                        path_bits,
                        uint256ToBinaryArray(proof.edgeProof.path),
                        path_bits_index,
                        uint256(proof.edgeProof.length)
                    )
                ) {
                    return false;
                } else {
                    console.log("we passed the comparePaths");
                    expectedHash = proof.edgeProof.childHash;
                    path_bits_index += uint256(proof.edgeProof.length);
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
