// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/WorkflowLog.sol";

contract WorkflowLogTest is Test {
    WorkflowLog wlog;

    function setUp() public {
        wlog = new WorkflowLog();
    }

    function test_logStoresRecord() public {
        wlog.log("rebalance", "swap 20 USDC->ETH", "success");
        WorkflowLog.Record memory r = wlog.getRecord(0);
        assertEq(r.workflowId, "rebalance");
        assertEq(r.action, "swap 20 USDC->ETH");
        assertEq(r.result, "success");
        assertEq(r.timestamp, block.timestamp);
    }

    function test_logEmitsEvent() public {
        vm.expectEmit(false, false, false, true);
        emit WorkflowLog.ExecutionLogged("rebalance", "swap 20 USDC->ETH", "success", block.timestamp);
        wlog.log("rebalance", "swap 20 USDC->ETH", "success");
    }

    function test_recordCount() public {
        wlog.log("rebalance", "a", "success");
        wlog.log("compound", "b", "skip");
        assertEq(wlog.recordCount(), 2);
    }
}
