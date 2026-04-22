// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MockAsset.sol";
import "../src/MockSwap.sol";

contract MockSwapTest is Test {
    MockAsset usdc;
    MockAsset ethMock;
    MockSwap swap;

    function setUp() public {
        usdc = new MockAsset("USDC Mock", "USDC");
        ethMock = new MockAsset("ETH Mock", "ETH");
        swap = new MockSwap(address(usdc), address(ethMock));
        // Fund swap contract with ETH mock
        ethMock.mint(address(swap), 1_000_000e6);
        // Give this contract USDC
        usdc.mint(address(this), 100e6);
        usdc.approve(address(swap), type(uint256).max);
    }

    function test_swap() public {
        swap.swap(20e6); // swap 20 USDC → 20 ETH mock (1:1)
        assertEq(usdc.balanceOf(address(this)), 80e6);
        assertEq(ethMock.balanceOf(address(this)), 20e6);
    }

    function test_swapInsufficientBalance_reverts() public {
        vm.expectRevert();
        swap.swap(200e6); // more than balance
    }
}
