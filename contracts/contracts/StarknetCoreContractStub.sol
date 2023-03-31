pragma solidity >=0.6.2 <0.9.0;

/// ONLY FOR TESTING PURPOSES TO SIMULATE STARKNET CORE CONTRACT
contract StarknetCoreContractStub {
    /**
        Returns the current state root.
        */
    function stateRoot() external view returns (uint256) {
        return
            3336983124068735130152324162879243910192520110528667358095747281397777550026;
    }

    /**
        Returns the current block number.
        */
    function stateBlockNumber() external view returns (int256) {
        return 787199;
    }
}
