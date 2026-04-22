import { type Address } from "viem"

export interface AgentConfig {
  agentPk: `0x${string}`
  usdcAddress: Address
  ethMockAddress: Address
  mockSwapAddress: Address
  mockStakingAddress: Address
  workflowLogAddress: Address
  rebalanceThreshold: bigint   // in USDC units (6 decimals)
  compoundThreshold: bigint    // in staking token units (6 decimals)
  bridgeThreshold: bigint      // in ETH mock units (6 decimals)
  pollIntervalMs: number
}

export const MOCK_ASSET_ABI = [
  { name: "balanceOf", type: "function", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { name: "approve", type: "function", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { name: "mint", type: "function", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
] as const

export const MOCK_SWAP_ABI = [
  { name: "swap", type: "function", inputs: [{ name: "amountIn", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
] as const

export const MOCK_STAKING_ABI = [
  { name: "stake", type: "function", inputs: [{ name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { name: "claim", type: "function", inputs: [], outputs: [{ name: "amount", type: "uint256" }], stateMutability: "nonpayable" },
  { name: "pendingReward", type: "function", inputs: [{ name: "user", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { name: "stakedBalance", type: "function", inputs: [{ name: "user", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const

export const WORKFLOW_LOG_ABI = [
  { name: "log", type: "function", inputs: [{ name: "workflowId", type: "string" }, { name: "action", type: "string" }, { name: "result", type: "string" }], outputs: [], stateMutability: "nonpayable" },
  { name: "recordCount", type: "function", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { name: "getRecord", type: "function", inputs: [{ name: "index", type: "uint256" }], outputs: [{ components: [{ name: "workflowId", type: "string" }, { name: "action", type: "string" }, { name: "result", type: "string" }, { name: "timestamp", type: "uint256" }], type: "tuple" }], stateMutability: "view" },
] as const
