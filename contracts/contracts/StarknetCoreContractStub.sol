pragma solidity >=0.6.2 <0.9.0;

/// ONLY FOR TESTING PURPOSES TO SIMULATE STARKNET CORE CONTRACT
contract StarknetCoreContractStub {
    /**
        Returns the current state root.
        */
    function stateRoot() external view returns (uint256) {
        return
            3321080970052968843805320357911538392446265524314601848332135665594593955343;
    }

    /**
        Returns the current block number.
        */
    function stateBlockNumber() external view returns (int256) {
        return 595364;
    }
}
