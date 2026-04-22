import { type PublicClient, type WalletClient, type Address, formatUnits } from "viem"
import { MOCK_ASSET_ABI } from "../types.js"
import { logExecution } from "../logger.js"

interface BridgeConfig {
  ethMockAddress: Address
  workflowLogAddress: Address
  bridgeThreshold: bigint
}

type LogFn = typeof logExecution

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
    await log(walletClient, publicClient, config.workflowLogAddress, "bridge", msg, "skip")
    return
  }

  const msg = `ETH balance: ${formatUnits(balance, 6)} below threshold ${formatUnits(config.bridgeThreshold, 6)} → bridge request`
  console.log(`[bridge] ${msg}`)
  await log(walletClient, publicClient, config.workflowLogAddress, "bridge", msg, "success")
}
