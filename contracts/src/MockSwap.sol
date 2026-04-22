// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockSwap {
    IERC20 public immutable tokenIn;   // USDC mock
    IERC20 public immutable tokenOut;  // ETH mock

    constructor(address tokenIn_, address tokenOut_) {
        tokenIn = IERC20(tokenIn_);
        tokenOut = IERC20(tokenOut_);
    }

    // 1:1 fixed rate swap
    function swap(uint256 amountIn) external {
        tokenIn.transferFrom(msg.sender, address(this), amountIn);
        tokenOut.transfer(msg.sender, amountIn);
    }
}
