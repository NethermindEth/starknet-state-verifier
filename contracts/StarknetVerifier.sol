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

    PedersenHash pedersen;

    constructor(address pedersenAddress) public {
        pedersen = PedersenHash(pedersenAddress);
    }

    function uint256ToBinaryArray(uint256 input)
        public
        view
        returns (uint256[] memory)
    {
        uint256 integer = input;
        uint256[] memory array = new uint256[](251);
        uint256 i = 0;
        console.log("uint256ToBinaryArray array: ");
        while (integer > 0) {
            uint256 bit = integer % 2;
            uint256 quotient = integer / 2;
            array[i] = bit;
            integer = quotient;
            i++;
            console.log(bit);
        }
        return array;
    }

    function comparePaths(
        uint256[] memory path1Array,
        uint256[] memory path2Array,
        uint256 start,
        uint256 length
    ) internal pure returns (bool) {
        for (uint256 i = start - length; i < start; i++) {
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

    function getValue(uint256 four_nibbles, uint256 index)
        public
        pure
        returns (uint256)
    {
        return (four_nibbles << (255 - index)) >> 255;
    }

    function getValueShifted(uint256 four_nibbles, uint256 shiftedBy)
        public
        pure
        returns (uint256)
    {
        return (four_nibbles << (255 - shiftedBy));
    }

    function verify_proof(
        uint256 rootHash,
        uint256 path,
        uint256 value,
        StarknetProof[] calldata proofArray
    ) public view returns (bool) {
        uint256 expectedHash = rootHash;
        uint256 alternateHash = rootHash;

        // uint256 i = 0;
        uint256[] memory path_bits = uint256ToBinaryArray(path);

        // uint256[] memory path_bits = [
        //     001000000110111100111000111101111110010011110001010111101000011101010110011100110110000100100001001111000010100011110010001101011100110011001101101010100001110101111111110100110100110010011101101100011101111111101001010010001001110001101010000010010001
        // ];
        uint256 originalValue = fromBinaryArrayToUint(path_bits);
        console.log("verify_proof originalValue: %s", originalValue);
        require(originalValue == path, "path and paths_bits are not equal");
        uint256 path_bits_index_length = path_bits.length;
        uint256 path_bits_index = path_bits.length - 1;

        // 1 is right
        // 0 is left

        for (uint256 i = 0; i < proofArray.length; i++) {
            StarknetProof memory proof = proofArray[i];
            if (proof.nodeType == NodeType.BINARY) {
                console.log(
                    "proof.binaryProof.leftHash: %s",
                    proof.binaryProof.leftHash
                );
                console.log(
                    "proof.binaryProof.rightHash: %s",
                    proof.binaryProof.rightHash
                );

                console.log(
                    "PEDERSEN HASH: %s",
                    pedersen.hash(
                        proof.binaryProof.leftHash,
                        proof.binaryProof.rightHash
                    )
                );
            } else {}
        }

        console.log("rootHash: %s", rootHash);
        for (uint256 i = 0; i < proofArray.length; i++) {
            StarknetProof memory proof = proofArray[i];
            if (expectedHash != hashForSingleProofNode(proof)) {
                console.log("we failed");
                if (alternateHash != hashForSingleProofNode(proof)) {
                    console.log("alternate also failed");
                    return false;
                } else {
                    console.log("alternate passed");
                }
                return false;
            } else {
                console.log("yaay we passed");
            }
            if (proof.nodeType == NodeType.BINARY) {
                console.log("rootHash: %s", rootHash);
                // bool isRight = (path_bits[path_bits_index] == 1);
                bool isRight = (getValue(path, path_bits_index) == 1);
                if (isRight == true) {
                    console.log("isRight");
                    expectedHash = proof.binaryProof.rightHash;
                    alternateHash = proof.binaryProof.leftHash;
                } else {
                    console.log("islLeft");
                    expectedHash = proof.binaryProof.leftHash;
                    alternateHash = proof.binaryProof.rightHash;
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
                    path_bits_index -= uint256(proof.edgeProof.length);
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
