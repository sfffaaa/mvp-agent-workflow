import { type PublicClient, type WalletClient, type Address, formatUnits } from "viem"
import { MOCK_ASSET_ABI, MOCK_SWAP_ABI } from "../types.js"
import { type LogFn, safeLog } from "../logger.js"

interface RebalanceConfig {
  usdcAddress: Address
  mockSwapAddress: Address
  workflowLogAddress: Address
  rebalanceThreshold: bigint
}

export async function runRebalance(
  publicClient: PublicClient,
  walletClient: WalletClient,
  config: RebalanceConfig,
  log: LogFn
): Promise<void> {
  const agentAddress = walletClient.account!.address

  const balance = await publicClient.readContract({
    address: config.usdcAddress,
    abi: MOCK_ASSET_ABI,
    functionName: "balanceOf",
    args: [agentAddress],
  }) as bigint

  const excess = balance - config.rebalanceThreshold

  if (excess <= 0n) {
    const msg = `balance: ${formatUnits(balance, 6)} USDC, threshold: ${formatUnits(config.rebalanceThreshold, 6)} → skip`
    console.log(`[rebalance] ${msg}`)
    await safeLog("rebalance", log, walletClient, publicClient, config.workflowLogAddress, "rebalance", msg, "skip")
    return
  }

  // wait for approve receipt before swap — allowance must be on-chain first
  const approveHash = await walletClient.writeContract({
    address: config.usdcAddress,
    abi: MOCK_ASSET_ABI,
    functionName: "approve",
    args: [config.mockSwapAddress, excess],
    chain: null,
    account: walletClient.account!,
  })
  await publicClient.waitForTransactionReceipt({ hash: approveHash, timeout: 60_000 })

  await walletClient.writeContract({
    address: config.mockSwapAddress,
    abi: MOCK_SWAP_ABI,
    functionName: "swap",
    args: [excess],
    chain: null,
    account: walletClient.account!,
  })

  const msg = `balance: ${formatUnits(balance, 6)} USDC → swap ${formatUnits(excess, 6)} USDC→ETH`
  console.log(`[rebalance] ${msg}`)
  await safeLog("rebalance", log, walletClient, publicClient, config.workflowLogAddress, "rebalance", msg, "success")
}
