// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Pulled in so Hardhat compiles the LayerZero endpoint mock for the bridge test suite.
import { EndpointV2Mock } from "@layerzerolabs/test-devtools-evm-foundry/contracts/mocks/EndpointV2Mock.sol";

/**
 * @title MockSchwepe
 * @notice Stands in for the live SCHWEPE token in tests.
 *
 * Mirrors the properties that matter to the vault adapter: fixed 1B supply, 18 decimals,
 * no mint path, plus togglable `transferable` and fee behaviour so the adapter's
 * balance-delta accounting can be exercised against a non-lossless token.
 */
contract MockSchwepe is ERC20 {
    uint256 public feeBps;
    bool public transferable = true;

    constructor() ERC20("schwepe", "SCHWEPE") {
        _mint(msg.sender, 1_000_000_000 ether);
    }

    function setFeeBps(uint256 _feeBps) external {
        feeBps = _feeBps;
    }

    function setTransferable(bool _transferable) external {
        transferable = _transferable;
    }

    function _update(address from, address to, uint256 value) internal override {
        require(transferable || from == address(0), "SCHWEPE: NOT_TRANSFERABLE");
        if (feeBps > 0 && from != address(0) && to != address(0)) {
            uint256 fee = (value * feeBps) / 10_000;
            super._update(from, address(0xdead), fee);
            super._update(from, to, value - fee);
        } else {
            super._update(from, to, value);
        }
    }
}
