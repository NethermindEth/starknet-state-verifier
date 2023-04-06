pragma solidity >=0.6.2 <0.9.0;

/// ONLY FOR TESTING PURPOSES TO SIMULATE STARKNET CORE CONTRACT
contract StarknetCoreContractStub {
    /**
        Returns the current state root.
        */
    function stateRoot() external view returns (uint256) {
        return
            2793869633745137896926484933765493995916819896677591814984705621839603171245;
    }

    /**
        Returns the current block number.
        */
    function stateBlockNumber() external view returns (int256) {
        return 789146;
    }
}
