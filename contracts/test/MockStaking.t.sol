// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MockAsset.sol";
import "../src/MockStaking.sol";

contract MockStakingTest is Test {
    MockAsset token;
    MockStaking staking;

    function setUp() public {
        token = new MockAsset("Reward Token", "RWD");
        staking = new MockStaking(address(token));
        token.mint(address(this), 1000e6);
        token.approve(address(staking), type(uint256).max);
        // Fund staking contract as reward reserve
        token.mint(address(staking), 10_000e6);
    }

    function test_stakeAndPendingReward() public {
        staking.stake(100e6);
        assertEq(staking.stakedBalance(address(this)), 100e6);
        // Warp 1 day forward — accrues 1% per day = 1e6
        vm.warp(block.timestamp + 1 days);
        assertEq(staking.pendingReward(address(this)), 1e6);
    }

    function test_claimReward() public {
        staking.stake(100e6);
        vm.warp(block.timestamp + 1 days);
        uint256 claimed = staking.claim();
        assertEq(claimed, 1e6);
        assertEq(token.balanceOf(address(this)), 901e6); // 1000 - 100 staked + 1 claimed
    }
}
