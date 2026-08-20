// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { SchwepeOFTAdapter } from "../bridge/SchwepeOFTAdapter.sol";
import { SchwepeOFT } from "../bridge/SchwepeOFT.sol";

/**
 * @notice Test-only harnesses exposing the internal debit/credit paths.
 *
 * These let the suite exercise SchwepeSwap's own vault accounting, rate limiting and pause
 * guards without standing up LayerZero's full message-library stack, which is vendor-tested
 * separately. NEVER deploy these — they bypass endpoint authentication.
 */
contract SchwepeOFTAdapterHarness is SchwepeOFTAdapter {
    constructor(
        address _token,
        address _lzEndpoint,
        address _owner
    ) SchwepeOFTAdapter(_token, _lzEndpoint, _owner) {}

    function debit(
        address _from,
        uint256 _amountLD,
        uint256 _minAmountLD,
        uint32 _dstEid
    ) external returns (uint256 amountSentLD, uint256 amountReceivedLD) {
        return _debit(_from, _amountLD, _minAmountLD, _dstEid);
    }

    function credit(address _to, uint256 _amountLD, uint32 _srcEid) external returns (uint256) {
        return _credit(_to, _amountLD, _srcEid);
    }
}

contract SchwepeOFTHarness is SchwepeOFT {
    constructor(address _lzEndpoint, address _owner) SchwepeOFT(_lzEndpoint, _owner) {}

    function debit(
        address _from,
        uint256 _amountLD,
        uint256 _minAmountLD,
        uint32 _dstEid
    ) external returns (uint256 amountSentLD, uint256 amountReceivedLD) {
        return _debit(_from, _amountLD, _minAmountLD, _dstEid);
    }

    function credit(address _to, uint256 _amountLD, uint32 _srcEid) external returns (uint256) {
        return _credit(_to, _amountLD, _srcEid);
    }
}
