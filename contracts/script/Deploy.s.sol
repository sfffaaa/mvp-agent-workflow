// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MockAsset.sol";
import "../src/MockSwap.sol";
import "../src/MockStaking.sol";
import "../src/WorkflowLog.sol";

contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PK");
        vm.startBroadcast(pk);

        MockAsset usdc = new MockAsset("USDC Mock", "USDC");
        MockAsset ethMock = new MockAsset("ETH Mock", "ETHM");
        MockSwap swap = new MockSwap(address(usdc), address(ethMock));
        MockStaking staking = new MockStaking(address(usdc));
        WorkflowLog wlog = new WorkflowLog();

        // Fund swap with ETH mock liquidity
        ethMock.mint(address(swap), 1_000_000e6);
        // Fund staking reward reserve
        usdc.mint(address(staking), 1_000_000e6);

        vm.stopBroadcast();

        console.log("USDC_ADDRESS=", address(usdc));
        console.log("ETH_MOCK_ADDRESS=", address(ethMock));
        console.log("MOCK_SWAP_ADDRESS=", address(swap));
        console.log("MOCK_STAKING_ADDRESS=", address(staking));
        console.log("WORKFLOW_LOG_ADDRESS=", address(wlog));
    }
}
