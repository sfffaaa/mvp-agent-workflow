// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MockAsset.sol";

contract MockAssetTest is Test {
    MockAsset token;

    function setUp() public {
        token = new MockAsset("USDC Mock", "USDC");
    }

    function test_mint() public {
        token.mint(address(this), 1000e6);
        assertEq(token.balanceOf(address(this)), 1000e6);
    }

    function test_decimals() public {
        assertEq(token.decimals(), 6);
    }
}
