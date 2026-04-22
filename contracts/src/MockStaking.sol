// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Reward rate: 1% per day on staked balance
contract MockStaking {
    IERC20 public immutable token;

    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) private _stakeTimestamp;

    constructor(address token_) {
        token = IERC20(token_);
    }

    function stake(uint256 amount) external {
        require(amount > 0, "amount must be > 0");
        // Settle any pending reward first
        uint256 pending = pendingReward(msg.sender);
        if (pending > 0) _transferReward(msg.sender, pending);
        token.transferFrom(msg.sender, address(this), amount);
        stakedBalance[msg.sender] += amount;
        _stakeTimestamp[msg.sender] = block.timestamp;
    }

    function pendingReward(address user) public view returns (uint256) {
        if (stakedBalance[user] == 0) return 0;
        uint256 elapsed = block.timestamp - _stakeTimestamp[user];
        // 1% per day = stakedBalance * elapsed / 86400 / 100
        return stakedBalance[user] * elapsed / 86400 / 100;
    }

    function claim() external returns (uint256 amount) {
        amount = pendingReward(msg.sender);
        require(amount > 0, "nothing to claim");
        _stakeTimestamp[msg.sender] = block.timestamp;
        _transferReward(msg.sender, amount);
    }

    function _transferReward(address to, uint256 amount) internal {
        token.transfer(to, amount);
    }
}
