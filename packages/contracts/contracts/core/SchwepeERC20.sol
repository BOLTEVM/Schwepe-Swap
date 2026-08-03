// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SchwepeERC20 is ERC20 {
    uint256 public constant INITIAL_SUPPLY = 0;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function _mintLP(address to, uint256 value) internal {
        _mint(to, value);
    }

    function _burnLP(address from, uint256 value) internal {
        _burn(from, value);
    }
}
