// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./PrecomputedTable36x0.sol";
import "./PrecomputedTable36x1.sol";

contract PrecomputedTable36 {
  function get(uint8 n) external pure returns (uint256 x, uint256 y) {
    if (n >= 128) {
      return PrecomputedTable36x1.get(n - 128);
    } else {
      return PrecomputedTable36x0.get(n);
    }
  }
}
