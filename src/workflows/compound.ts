import { type PublicClient, type WalletClient, type Address, formatUnits } from "viem"
import { MOCK_ASSET_ABI, MOCK_STAKING_ABI } from "../types.js"
import { type LogFn, safeLog } from "../logger.js"

interface CompoundConfig {
  usdcAddress: Address
  mockStakingAddress: Address
  workflowLogAddress: Address
  compoundThreshold: bigint
}

export async function runCompound(
  publicClient: PublicClient,
  walletClient: WalletClient,
  config: CompoundConfig,
  log: LogFn
): Promise<void> {
  const agentAddress = walletClient.account!.address

  // parallel reads — independent view calls
  const [pendingReward, stakedBalance] = await Promise.all([
    publicClient.readContract({
      address: config.mockStakingAddress,
      abi: MOCK_STAKING_ABI,
      functionName: "pendingReward",
      args: [agentAddress],
    }) as Promise<bigint>,
    publicClient.readContract({
      address: config.mockStakingAddress,
      abi: MOCK_STAKING_ABI,
      functionName: "stakedBalance",
      args: [agentAddress],
    }) as Promise<bigint>,
  ])

  if (pendingReward < config.compoundThreshold) {
    const msg = `reward: ${formatUnits(pendingReward, 6)}, threshold: ${formatUnits(config.compoundThreshold, 6)} → skip`
    console.log(`[compound] ${msg}`)
    await safeLog("compound", log, walletClient, publicClient, config.workflowLogAddress, "compound", msg, "skip")
    return
  }

  // wait for claim receipt before reading balances
  const claimHash = await walletClient.writeContract({
    address: config.mockStakingAddress,
    abi: MOCK_STAKING_ABI,
    functionName: "claim",
    args: [],
    chain: null,
    account: walletClient.account!,
  })
  await publicClient.waitForTransactionReceipt({ hash: claimHash, timeout: 60_000 })

  // read post-claim balance — cap restake to what we actually received
  const actualBalance = await publicClient.readContract({
    address: config.usdcAddress,
    abi: MOCK_ASSET_ABI,
    functionName: "balanceOf",
    args: [agentAddress],
  }) as bigint
  const restakeAmount = actualBalance < pendingReward ? actualBalance : pendingReward

  // wait for approve receipt before stake — allowance must be on-chain first
  const approveHash = await walletClient.writeContract({
    address: config.usdcAddress,
    abi: MOCK_ASSET_ABI,
    functionName: "approve",
    args: [config.mockStakingAddress, restakeAmount],
    chain: null,
    account: walletClient.account!,
  })
  await publicClient.waitForTransactionReceipt({ hash: approveHash, timeout: 60_000 })

  const stakeHash = await walletClient.writeContract({
    address: config.mockStakingAddress,
    abi: MOCK_STAKING_ABI,
    functionName: "stake",
    args: [restakeAmount],
    chain: null,
    account: walletClient.account!,
  })
  await publicClient.waitForTransactionReceipt({ hash: stakeHash, timeout: 60_000 })

  const msg = `reward: ${formatUnits(pendingReward, 6)}, staked: ${formatUnits(stakedBalance, 6)} → claim+restake ${formatUnits(restakeAmount, 6)}`
  console.log(`[compound] ${msg}`)
  await safeLog("compound", log, walletClient, publicClient, config.workflowLogAddress, "compound", msg, "success")
}
