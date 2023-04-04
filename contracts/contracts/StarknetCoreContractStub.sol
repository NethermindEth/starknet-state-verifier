pragma solidity >=0.6.2 <0.9.0;

/// ONLY FOR TESTING PURPOSES TO SIMULATE STARKNET CORE CONTRACT
contract StarknetCoreContractStub {
    /**
        Returns the current state root.
        */
    function stateRoot() external view returns (uint256) {
        return
            0x23e33e5a51995decf498722d12551830825c9c57ca1db2104e2217f954308a6;
    }

    /**
        Returns the current block number.
        */
    function stateBlockNumber() external view returns (int256) {
        return 787199;
    }
}
