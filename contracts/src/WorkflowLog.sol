// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract WorkflowLog {
    struct Record {
        string workflowId;
        string action;
        string result;
        uint256 timestamp;
    }

    Record[] private _records;

    event ExecutionLogged(
        string workflowId,
        string action,
        string result,
        uint256 timestamp
    );

    function log(
        string calldata workflowId,
        string calldata action,
        string calldata result
    ) external {
        _records.push(Record(workflowId, action, result, block.timestamp));
        emit ExecutionLogged(workflowId, action, result, block.timestamp);
    }

    function getRecord(uint256 index) external view returns (Record memory) {
        return _records[index];
    }

    function recordCount() external view returns (uint256) {
        return _records.length;
    }
}
