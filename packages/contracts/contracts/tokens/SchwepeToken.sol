// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SchwepeToken is ERC20, Ownable {
    constructor() ERC20("Schwepe Governance Token", "SCHWEPE") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 10**decimals()); // Initial 1M SCHWEPE supply
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
