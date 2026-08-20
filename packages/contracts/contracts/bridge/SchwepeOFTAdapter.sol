// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { OFTAdapter } from "@layerzerolabs/oft-evm/contracts/OFTAdapter.sol";
import { RateLimiter } from "@layerzerolabs/oapp-evm/contracts/oapp/utils/RateLimiter.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SchwepeOFTAdapter
 * @notice Home-chain vault for the SCHWEPE Omnifungible Bridge. Deploys on Somnia only.
 *
 * The live SCHWEPE token (0xdd10620866c4f586b1213d3818811faf3718fce3) is immutable and has
 * no mint/burn hooks, so it cannot become a native OFT. This adapter is the standard answer:
 * real SCHWEPE is locked here, and a canonical SchwepeOFT mirror is minted on each spoke chain.
 *
 * INVARIANT: innerToken.balanceOf(address(this)) >= total SchwepeOFT supply across all spokes.
 * The indexer monitors this continuously; any drift is an incident.
 *
 * WARNING: exactly ONE adapter may exist across the entire mesh. A second adapter on any chain
 * would let the same mirror supply be backed twice.
 *
 * Owner must be a timelocked multisig, never an EOA.
 */
contract SchwepeOFTAdapter is OFTAdapter, RateLimiter, Pausable {
    using SafeERC20 for IERC20;

    /// @notice Total real SCHWEPE currently locked and backing mirrors on spoke chains.
    uint256 public totalLocked;

    event Locked(address indexed from, uint32 indexed dstEid, uint256 amount, uint256 totalLocked);
    event Unlocked(address indexed to, uint32 indexed srcEid, uint256 amount, uint256 totalLocked);

    error LossyTransfer(uint256 expected, uint256 actual);
    error InsufficientLocked(uint256 requested, uint256 available);

    /**
     * @param _token The live SCHWEPE ERC-20 on Somnia.
     * @param _lzEndpoint LayerZero EndpointV2 on Somnia (eid 30380).
     * @param _owner Timelocked multisig that owns and delegates this OApp.
     */
    constructor(
        address _token,
        address _lzEndpoint,
        address _owner
    ) OFTAdapter(_token, _lzEndpoint, _owner) Ownable(_owner) {}

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------

    /**
     * @notice Set outbound rate limits per destination chain.
     * @dev Launch posture is deliberately conservative; raise only after observing real volume.
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

    // ---------------------------------------------------------------------
    // Lock / unlock with balance-delta accounting
    // ---------------------------------------------------------------------

    /**
     * @dev Locks real SCHWEPE into the vault.
     *
     * The default OFTAdapter assumes lossless transfers. SCHWEPE was deployed from a
     * bonding-curve launch template that carries `transferable` and vesting hooks, so a
     * transfer is not guaranteed to be lossless forever. We measure the actual balance
     * delta and revert rather than mint a mirror that the vault cannot back.
     */
    function _debit(
        address _from,
        uint256 _amountLD,
        uint256 _minAmountLD,
        uint32 _dstEid
    ) internal virtual override whenNotPaused returns (uint256 amountSentLD, uint256 amountReceivedLD) {
        (amountSentLD, amountReceivedLD) = _debitView(_amountLD, _minAmountLD, _dstEid);

        _outflow(_dstEid, amountSentLD);

        uint256 balanceBefore = innerToken.balanceOf(address(this));
        innerToken.safeTransferFrom(_from, address(this), amountSentLD);
        uint256 received = innerToken.balanceOf(address(this)) - balanceBefore;

        // A short delta would mean minting unbacked mirror supply on the destination.
        if (received != amountSentLD) revert LossyTransfer(amountSentLD, received);

        totalLocked += received;
        emit Locked(_from, _dstEid, received, totalLocked);
    }

    /**
     * @dev Releases real SCHWEPE when mirrors are burned on a spoke chain.
     */
    function _credit(
        address _to,
        uint256 _amountLD,
        uint32 _srcEid
    ) internal virtual override whenNotPaused returns (uint256 amountReceivedLD) {
        if (_amountLD > totalLocked) revert InsufficientLocked(_amountLD, totalLocked);

        _inflow(_srcEid, _amountLD);
        totalLocked -= _amountLD;

        uint256 balanceBefore = innerToken.balanceOf(_to);
        innerToken.safeTransfer(_to, _amountLD);
        amountReceivedLD = innerToken.balanceOf(_to) - balanceBefore;

        emit Unlocked(_to, _srcEid, amountReceivedLD, totalLocked);
    }

    /**
     * @notice Real SCHWEPE held here in excess of what backs outstanding mirrors.
     * @dev Should be zero. A non-zero value means tokens were sent here directly by mistake.
     */
    function unaccountedBalance() external view returns (uint256) {
        uint256 balance = innerToken.balanceOf(address(this));
        return balance > totalLocked ? balance - totalLocked : 0;
    }

    /**
     * @notice Recover tokens sent to the vault by mistake.
     * @dev Cannot touch the backing balance: only the surplus above `totalLocked` is withdrawable,
     *      and for any other token the full balance is recoverable.
     */
    function sweep(address _token, address _to, uint256 _amount) external onlyOwner {
        if (_token == address(innerToken)) {
            uint256 surplus = innerToken.balanceOf(address(this)) - totalLocked;
            if (_amount > surplus) revert InsufficientLocked(_amount, surplus);
        }
        IERC20(_token).safeTransfer(_to, _amount);
    }
}
