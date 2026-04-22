import { type PublicClient, type WalletClient, type Address, formatUnits } from "viem"
import { MOCK_ASSET_ABI, MOCK_SWAP_ABI } from "../types.js"

interface RebalanceConfig {
  usdcAddress: Address
  mockSwapAddress: Address
  workflowLogAddress: Address
  rebalanceThreshold: bigint
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogFn = (...args: any[]) => Promise<void>

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
    try {
      await log(walletClient, publicClient, config.workflowLogAddress, "rebalance", msg, "skip")
    } catch (e) {
      console.error("[rebalance] log failed:", e instanceof Error ? e.message : String(e))
    }
    return
  }

  // Approve swap — wait for receipt before proceeding
  const approveHash = await walletClient.writeContract({
    address: config.usdcAddress,
    abi: MOCK_ASSET_ABI,
    functionName: "approve",
    args: [config.mockSwapAddress, excess],
    chain: null,
    account: walletClient.account!,
  })
  await publicClient.waitForTransactionReceipt({ hash: approveHash, timeout: 60_000 })

  // Execute swap
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
  try {
    await log(walletClient, publicClient, config.workflowLogAddress, "rebalance", msg, "success")
  } catch (e) {
    console.error("[rebalance] log failed:", e instanceof Error ? e.message : String(e))
  }
}
