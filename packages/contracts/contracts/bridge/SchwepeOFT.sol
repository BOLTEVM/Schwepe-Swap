// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { OFT } from "@layerzerolabs/oft-evm/contracts/OFT.sol";
import { RateLimiter } from "@layerzerolabs/oapp-evm/contracts/oapp/utils/RateLimiter.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SchwepeOFT
 * @notice Canonical SCHWEPE mirror for spoke chains — Arbitrum One (eid 30110) and
 *         Robinhood Chain (eid 30416).
 *
 * Supply here is entirely bridge-controlled: minted only when SchwepeOFTAdapter locks real
 * SCHWEPE on Somnia, burned when it is sent home. There is no owner mint path by design —
 * total mirror supply across all spokes is always backed 1:1 by the Somnia vault.
 *
 * Owner must be a timelocked multisig, never an EOA. Note that the owner can still set peers
 * and LayerZero configs, which is the remaining trust assumption on this contract.
 */
contract SchwepeOFT is OFT, RateLimiter, Pausable {
    /**
     * @param _lzEndpoint LayerZero EndpointV2 on this spoke chain.
     * @param _owner Timelocked multisig that owns and delegates this OApp.
     */
    constructor(
        address _lzEndpoint,
        address _owner
    ) OFT("Schwepe", "SCHWEPE", _lzEndpoint, _owner) Ownable(_owner) {}

    /**
     * @notice Set outbound rate limits per destination chain.
     */
    function setRateLimits(RateLimitConfig[] calldata _configs) external onlyOwner {
        _setRateLimits(_configs);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Burns mirror supply on the way out, after consuming rate-limit capacity.
     */
    function _debit(
        address _from,
        uint256 _amountLD,
        uint256 _minAmountLD,
        uint32 _dstEid
    ) internal virtual override whenNotPaused returns (uint256 amountSentLD, uint256 amountReceivedLD) {
        _outflow(_dstEid, _amountLD);
        return super._debit(_from, _amountLD, _minAmountLD, _dstEid);
    }

    /**
     * @dev Mints mirror supply on arrival.
     */
    function _credit(
        address _to,
        uint256 _amountLD,
        uint32 _srcEid
    ) internal virtual override whenNotPaused returns (uint256 amountReceivedLD) {
        _inflow(_srcEid, _amountLD);
        return super._credit(_to, _amountLD, _srcEid);
    }
}
