pragma solidity >=0.6.2 <0.9.0;

/// ONLY FOR TESTING PURPOSES TO SIMULATE STARKNET CORE CONTRACT
contract StarknetCoreContractStub {
    /**
        The stateroot is used by the tests. It is the stateroot of the starknet network at block 789146. All the sampleproofs in the test foldet should match up to this stateroot.
        */
    function stateRoot() external view returns (uint256) {
        return
            2793869633745137896926484933765493995916819896677591814984705621839603171245;
    }

    /**
        return the block number corresponding the stateroot above.
        */
    function stateBlockNumber() external view returns (int256) {
        return 789146;
    }
}
