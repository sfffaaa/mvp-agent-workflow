import "dotenv/config"
import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  type PublicClient,
  type WalletClient,
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { fujiChain } from "./chain.js"
import { logExecution } from "./logger.js"
import { runRebalance } from "./workflows/rebalance.js"
import { runCompound } from "./workflows/compound.js"
import { runBridge } from "./workflows/bridge.js"
import type { AgentConfig } from "./types.js"

function requireEnv(name: string): string {
  const val = process.env[name]
  if (!val) { console.error(`Missing env var: ${name}`); process.exit(1) }
  return val
}

function requireAddr(name: string): `0x${string}` {
  const val = requireEnv(name)
  if (!val.startsWith("0x") || val.length !== 42) {
    console.error(`Invalid address env var: ${name}`)
    process.exit(1)
  }
  return val as `0x${string}`
}

const config: AgentConfig = {
  agentPk: requireEnv("AGENT_PK") as `0x${string}`,
  usdcAddress: requireAddr("USDC_ADDRESS"),
  ethMockAddress: requireAddr("ETH_MOCK_ADDRESS"),
  mockSwapAddress: requireAddr("MOCK_SWAP_ADDRESS"),
  mockStakingAddress: requireAddr("MOCK_STAKING_ADDRESS"),
  workflowLogAddress: requireAddr("WORKFLOW_LOG_ADDRESS"),
  rebalanceThreshold: parseUnits(requireEnv("REBALANCE_THRESHOLD"), 6),
  compoundThreshold: parseUnits(requireEnv("COMPOUND_THRESHOLD"), 6),
  bridgeThreshold: parseUnits(requireEnv("BRIDGE_THRESHOLD"), 6),
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS ?? 60000),
}

const RPC_URL = "https://avalanche-fuji-c-chain-rpc.publicnode.com"
const account = privateKeyToAccount(config.agentPk)
const transport = http(RPC_URL)
const publicClient = createPublicClient({ chain: fujiChain, transport }) as PublicClient
const walletClient = createWalletClient({ account, chain: fujiChain, transport }) as WalletClient

async function tick(): Promise<void> {
  const ts = new Date().toISOString()
  console.log(`\n[${ts}] polling...`)
  const workflows = [
    () => runRebalance(publicClient, walletClient,
      { usdcAddress: config.usdcAddress, mockSwapAddress: config.mockSwapAddress, workflowLogAddress: config.workflowLogAddress, rebalanceThreshold: config.rebalanceThreshold },
      logExecution),
    () => runCompound(publicClient, walletClient,
      { usdcAddress: config.usdcAddress, mockStakingAddress: config.mockStakingAddress, workflowLogAddress: config.workflowLogAddress, compoundThreshold: config.compoundThreshold },
      logExecution),
    () => runBridge(publicClient, walletClient,
      { ethMockAddress: config.ethMockAddress, workflowLogAddress: config.workflowLogAddress, bridgeThreshold: config.bridgeThreshold },
      logExecution),
  ]

  for (const workflow of workflows) {
    try {
      await workflow()
    } catch (e) {
      console.error("workflow error:", e instanceof Error ? e.message : String(e))
    }
  }
}

console.log("Agent started. Polling every", config.pollIntervalMs / 1000, "seconds.")
console.log("Agent address:", account.address)

tick()
setInterval(tick, config.pollIntervalMs)
