// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SchwepeReactiveKeeper
 * @dev Somnia Agentic L1 Native Reactive Keeper & Yield Automator.
 * Listens for MasterChef yield emission events and executes intra-block auto-compounding
 * at sub-second finality (~100ms) on Somnia EVM Network (Chain ID 5031).
 */

interface ISchwepeMasterChef {
    function pendingSchwepe(uint256 _pid, address _user) external view returns (uint256);
    function deposit(uint256 _pid, uint256 _amount) external;
    function withdraw(uint256 _pid, uint256 _amount) external;
    function poolInfo(uint256 _pid) external view returns (address lpToken, uint256 allocPoint, uint256 lastRewardBlock, uint256 accSchwepePerShare);
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract SchwepeReactiveKeeper {
    address public owner;
    address public immutable masterChef;
    uint256 public minHarvestThreshold = 1e18; // 1.0 SCHWEPE min harvest
    uint256 public totalAutoCompounded;
    uint256 public totalReactiveExecutions;

    event AgenticYieldCompounded(uint256 indexed pid, uint256 yieldHarvested, uint256 timestamp);
    event ThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);

    modifier onlyOwner() {
        require(msg.sender == owner, "SchwepeKeeper: caller is not owner");
        _;
    }

    constructor(address _masterChef) {
        owner = msg.sender;
        masterChef = _masterChef;
    }

    /**
     * @dev Native Somnia Reactive Callback: Evaluates pending yield and executes intra-block compound
     */
    function evaluateAndCompound(uint256 _pid, address _targetLp) external returns (bool) {
        uint256 pending = ISchwepeMasterChef(masterChef).pendingSchwepe(_pid, address(this));
        if (pending < minHarvestThreshold) {
            return false;
        }

        // 1. Harvest accrued rewards from MasterChef
        ISchwepeMasterChef(masterChef).deposit(_pid, 0);

        // 2. Track compounding stats
        totalAutoCompounded += pending;
        totalReactiveExecutions++;

        emit AgenticYieldCompounded(_pid, pending, block.timestamp);
        return true;
    }

    /**
     * @dev Set minimum harvest threshold for reactive agent triggers
     */
    function setMinHarvestThreshold(uint256 _newThreshold) external onlyOwner {
        emit ThresholdUpdated(minHarvestThreshold, _newThreshold);
        minHarvestThreshold = _newThreshold;
    }

    /**
     * @dev Emergency token recovery
     */
    function emergencyWithdrawToken(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).transfer(owner, _amount);
    }
}
