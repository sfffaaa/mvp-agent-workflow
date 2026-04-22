import { type PublicClient, type WalletClient, type Address, formatUnits } from "viem"
import { MOCK_ASSET_ABI, MOCK_STAKING_ABI } from "../types.js"
import { logExecution } from "../logger.js"

interface CompoundConfig {
  usdcAddress: Address
  mockStakingAddress: Address
  workflowLogAddress: Address
  compoundThreshold: bigint
}

type LogFn = typeof logExecution

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
    await log(walletClient, publicClient, config.workflowLogAddress, "compound", msg, "skip")
    return
  }

  // Claim reward
  await walletClient.writeContract({
    address: config.mockStakingAddress,
    abi: MOCK_STAKING_ABI,
    functionName: "claim",
    args: [],
    chain: null,
    account: walletClient.account!,
  })

  // Approve staking contract to take reward tokens back
  await walletClient.writeContract({
    address: config.usdcAddress,
    abi: MOCK_ASSET_ABI,
    functionName: "approve",
    args: [config.mockStakingAddress, pendingReward],
    chain: null,
    account: walletClient.account!,
  })

  // Restake the claimed reward
  await walletClient.writeContract({
    address: config.mockStakingAddress,
    abi: MOCK_STAKING_ABI,
    functionName: "stake",
    args: [pendingReward],
    chain: null,
    account: walletClient.account!,
  })

  const msg = `reward: ${formatUnits(pendingReward, 6)}, staked: ${formatUnits(stakedBalance, 6)} → claim+restake ${formatUnits(pendingReward, 6)}`
  console.log(`[compound] ${msg}`)
  await log(walletClient, publicClient, config.workflowLogAddress, "compound", msg, "success")
}
