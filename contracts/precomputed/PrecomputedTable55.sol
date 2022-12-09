// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./PrecomputedTable55x0.sol";
import "./PrecomputedTable55x1.sol";

contract PrecomputedTable55 {
  function get(uint8 n) external pure returns (uint256 x, uint256 y) {
    if (n >= 128) {
      return PrecomputedTable55x1.get(n - 128);
    } else {
      return PrecomputedTable55x0.get(n);
    }
  }
}
