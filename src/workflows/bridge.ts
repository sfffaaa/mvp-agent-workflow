import { type PublicClient, type WalletClient, type Address, formatUnits } from "viem"
import { MOCK_ASSET_ABI } from "../types.js"

interface BridgeConfig {
  ethMockAddress: Address
  workflowLogAddress: Address
  bridgeThreshold: bigint
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogFn = (...args: any[]) => Promise<void>

export async function runBridge(
  publicClient: PublicClient,
  walletClient: WalletClient,
  config: BridgeConfig,
  log: LogFn
): Promise<void> {
  const agentAddress = walletClient.account!.address

  const balance = await publicClient.readContract({
    address: config.ethMockAddress,
    abi: MOCK_ASSET_ABI,
    functionName: "balanceOf",
    args: [agentAddress],
  }) as bigint

  if (balance >= config.bridgeThreshold) {
    const msg = `ETH balance: ${formatUnits(balance, 6)}, threshold: ${formatUnits(config.bridgeThreshold, 6)} → skip`
    console.log(`[bridge] ${msg}`)
    try {
      await log(walletClient, publicClient, config.workflowLogAddress, "bridge", msg, "skip")
    } catch (e) {
      console.error("[bridge] log failed:", e instanceof Error ? e.message : String(e))
    }
    return
  }

  const msg = `ETH balance: ${formatUnits(balance, 6)} below threshold ${formatUnits(config.bridgeThreshold, 6)} → bridge request`
  console.log(`[bridge] ${msg}`)
  try {
    await log(walletClient, publicClient, config.workflowLogAddress, "bridge", msg, "success")
  } catch (e) {
    console.error("[bridge] log failed:", e instanceof Error ? e.message : String(e))
  }
}
