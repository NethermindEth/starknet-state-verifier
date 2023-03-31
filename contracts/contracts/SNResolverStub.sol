// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.2 <0.9.0;
import "./EllipticCurve.sol";
import "./PedersenHash.sol";
import "./SNStateProofVerifier.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

// Starknet Proof Verifier. This contract verifies a Starknet proof for a contract and a storage address/value
contract SNResolverStub is SNStateProofVerifier, ERC165 {
    string[] public gateways;
    uint256 public l2resolver;
    bytes4 private constant ADDR_INTERFACE_ID = 0x3b3b57de;
    bytes4 private constant ADDRESS_INTERFACE_ID = 0xf1cb7e06;

    error OffchainLookup(
        address sender,
        string[] urls,
        bytes callData,
        bytes4 callbackFunction,
        bytes extraData
    );

    uint256 constant MASK_250 = (2 ** 250) - 1; // to simulate sn_keccak
    uint256 constant storageVarName =
        0x29539a1d23af1810c48a07fe7fc66a3b34fbc8b37e9b3cdb97bb88ceab7e4bf; // sn_keccak of 'resolver' in https://github.com/starknet-id/ens_resolver/blob/3577d3bf3e309614dbec16aca56b7cade2bac949/src/main.cairo#L7

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address pedersenAddress,
        address poseidonAddress,
        address _starknetCoreContractAddress,
        string[] memory _gateways,
        uint256 _l2resolver
    ) public initializer {
        SNStateProofVerifier.initialize(
            pedersenAddress,
            poseidonAddress,
            _starknetCoreContractAddress
        );
        gateways = _gateways;
        l2resolver = _l2resolver;

        __Ownable_init();
        __UUPSUpgradeable_init();
    }

    function getl2Resolver() external view returns (uint256) {
        return l2resolver;
    }

    // returns the address of the storage within the starknet l2 resolver contract
    function calculateDomainStorageVarAddressFor(
        uint256 domain
    ) internal view returns (uint256) {
        return hash(storageVarName, domain);
    }

    function addr(bytes32 node) public view returns (address) {
        return
            address(
                uint160(_addr(node, SNResolverStub.bytesAddrWithProof.selector))
            );
    }

    function addr(
        bytes32 node,
        uint256 coinType
    ) public view returns (bytes memory) {
        if (coinType == 60) {
            // replicated logic to demonstrate CCIP reslution on the ens app, as starknet address will not resolve so we are just resolving eth address.
            // 60 for eth address
            return
                uint256ToBytes(
                    _addr(node, SNResolverStub.bytesAddrWithProof.selector)
                );
        } else if (coinType == 9004) {
            // 9004 for strk address
            return
                uint256ToBytes(
                    _addr(node, SNResolverStub.bytesAddrWithProof.selector)
                );
        } else {
            return addressToBytes(address(0));
        }
    }

    function _addr(
        bytes32 node,
        bytes4 selector
    ) private view returns (uint256) {
        uint256 starknetNode = uint256(node) & MASK_250;

        bytes memory callData = abi.encodeWithSelector(
            IStarknetResolverService.addr.selector,
            starknetNode
        );
        revert OffchainLookup(
            address(this),
            gateways,
            callData,
            selector,
            abi.encode(starknetNode)
        );
    }

    // function addrWithProof(bytes calldata response, bytes calldata extraData)
    //     external
    //     view
    //     returns (address)
    // {
    //     return _addrWithProof(response, extraData);
    // }

    function bytesAddrWithProof(
        bytes calldata response,
        bytes calldata extraData
    ) external view returns (bytes memory) {
        return uint256ToBytes(_addrWithProof(response, extraData));
    }

    function _addrWithProof(
        bytes calldata response,
        bytes calldata extraData
    ) internal view returns (uint256) {
        StarknetCompositeStateProof memory proof = abi.decode(
            response,
            (StarknetCompositeStateProof)
        );
        bytes32 node = abi.decode(extraData, (bytes32));
        uint256 storageVarAdress = calculateDomainStorageVarAddressFor(
            uint256(node)
        );

        // update the storageVarAddress with the one we calculate here to make sure gateway has not returned a random storage var address/proof
        proof.contractData.contractAddress = l2resolver;
        proof.contractData.storageVarAddress = storageVarAdress;
        uint256 starknetAddress = this.verifiedStorageValue(
            proof.blockNumber,
            proof.classCommitment,
            proof.contractData,
            proof.contractProofArray,
            proof.storageProofArray
        );

        return starknetAddress;
    }

    function supportsInterface(
        bytes4 interfaceID
    ) public pure override returns (bool) {
        return
            interfaceID == ADDR_INTERFACE_ID ||
            interfaceID == ADDRESS_INTERFACE_ID;
    }

    function addressToBytes(address a) internal pure returns (bytes memory b) {
        b = new bytes(20);
        assembly {
            mstore(add(b, 32), mul(a, exp(256, 12)))
        }
    }

    function uint256ToBytes(uint256 x) private pure returns (bytes memory b) {
        b = new bytes(32);
        assembly {
            mstore(add(b, 32), x)
        }
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
