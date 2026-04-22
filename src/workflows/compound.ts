import { type PublicClient, type WalletClient, type Address, formatUnits } from "viem"
import { MOCK_ASSET_ABI, MOCK_STAKING_ABI } from "../types.js"

interface CompoundConfig {
  usdcAddress: Address
  mockStakingAddress: Address
  workflowLogAddress: Address
  compoundThreshold: bigint
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogFn = (...args: any[]) => Promise<void>

export async function runCompound(
  publicClient: PublicClient,
  walletClient: WalletClient,
  config: CompoundConfig,
  log: LogFn
): Promise<void> {
  const agentAddress = walletClient.account!.address

  const pendingReward = await publicClient.readContract({
    address: config.mockStakingAddress,
    abi: MOCK_STAKING_ABI,
    functionName: "pendingReward",
    args: [agentAddress],
  }) as bigint

  const stakedBalance = await publicClient.readContract({
    address: config.mockStakingAddress,
    abi: MOCK_STAKING_ABI,
    functionName: "stakedBalance",
    args: [agentAddress],
  }) as bigint

  if (pendingReward < config.compoundThreshold) {
    const msg = `reward: ${formatUnits(pendingReward, 6)}, threshold: ${formatUnits(config.compoundThreshold, 6)} → skip`
    console.log(`[compound] ${msg}`)
    try {
      await log(walletClient, publicClient, config.workflowLogAddress, "compound", msg, "skip")
    } catch (e) {
      console.error("[compound] log failed:", e instanceof Error ? e.message : String(e))
    }
    return
  }

  // Claim reward — wait for receipt before reading balances
  const claimHash = await walletClient.writeContract({
    address: config.mockStakingAddress,
    abi: MOCK_STAKING_ABI,
    functionName: "claim",
    args: [],
    chain: null,
    account: walletClient.account!,
  })
  await publicClient.waitForTransactionReceipt({ hash: claimHash, timeout: 60_000 })

  // Read actual received balance (may differ slightly from pre-tx pendingReward)
  const actualBalance = await publicClient.readContract({
    address: config.usdcAddress,
    abi: MOCK_ASSET_ABI,
    functionName: "balanceOf",
    args: [agentAddress],
  }) as bigint
  const restakeAmount = actualBalance > pendingReward ? pendingReward : actualBalance

  // Approve staking contract — wait for receipt
  const approveHash = await walletClient.writeContract({
    address: config.usdcAddress,
    abi: MOCK_ASSET_ABI,
    functionName: "approve",
    args: [config.mockStakingAddress, restakeAmount],
    chain: null,
    account: walletClient.account!,
  })
  await publicClient.waitForTransactionReceipt({ hash: approveHash, timeout: 60_000 })

  // Restake the claimed reward
  await walletClient.writeContract({
    address: config.mockStakingAddress,
    abi: MOCK_STAKING_ABI,
    functionName: "stake",
    args: [restakeAmount],
    chain: null,
    account: walletClient.account!,
  })

  const msg = `reward: ${formatUnits(pendingReward, 6)}, staked: ${formatUnits(stakedBalance, 6)} → claim+restake ${formatUnits(restakeAmount, 6)}`
  console.log(`[compound] ${msg}`)
  try {
    await log(walletClient, publicClient, config.workflowLogAddress, "compound", msg, "success")
  } catch (e) {
    console.error("[compound] log failed:", e instanceof Error ? e.message : String(e))
  }
}
