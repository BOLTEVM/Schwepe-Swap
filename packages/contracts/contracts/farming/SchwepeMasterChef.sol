// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../tokens/SchwepeToken.sol";

contract SchwepeMasterChef is Ownable {
    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
    }

    struct PoolInfo {
        IERC20 lpToken;
        uint256 allocPoint;
        uint256 lastRewardBlock;
        uint256 accSchwepePerShare;
    }

    SchwepeToken public schwepe;
    uint256 public schwepePerBlock = 10 * 1e18; // 10 SCHWEPE per block

    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    uint256 public totalAllocPoint = 0;
    uint256 public startBlock;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);

    constructor(SchwepeToken _schwepe, uint256 _startBlock) Ownable(msg.sender) {
        schwepe = _schwepe;
        startBlock = _startBlock;
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    function add(uint256 _allocPoint, IERC20 _lpToken, bool _withUpdate) external onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint += _allocPoint;
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardBlock: lastRewardBlock,
            accSchwepePerShare: 0
        }));
    }

    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = block.number - pool.lastRewardBlock;
        uint256 schwepeReward = (multiplier * schwepePerBlock * pool.allocPoint) / totalAllocPoint;
        schwepe.mint(address(this), schwepeReward);
        pool.accSchwepePerShare += (schwepeReward * 1e12) / lpSupply;
        pool.lastRewardBlock = block.number;
    }

    function deposit(uint256 _pid, uint256 _amount) external {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        if (user.amount > 0) {
            uint256 pending = (user.amount * pool.accSchwepePerShare / 1e12) - user.rewardDebt;
            if (pending > 0) {
                schwepe.transfer(msg.sender, pending);
            }
        }
        if (_amount > 0) {
            pool.lpToken.transferFrom(msg.sender, address(this), _amount);
            user.amount += _amount;
        }
        user.rewardDebt = (user.amount * pool.accSchwepePerShare) / 1e12;
        emit Deposit(msg.sender, _pid, _amount);
    }

    function withdraw(uint256 _pid, uint256 _amount) external {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        updatePool(_pid);
        uint256 pending = (user.amount * pool.accSchwepePerShare / 1e12) - user.rewardDebt;
        if (pending > 0) {
            schwepe.transfer(msg.sender, pending);
        }
        if (_amount > 0) {
            user.amount -= _amount;
            pool.lpToken.transfer(msg.sender, _amount);
        }
        user.rewardDebt = (user.amount * pool.accSchwepePerShare) / 1e12;
        emit Withdraw(msg.sender, _pid, _amount);
    }
}
