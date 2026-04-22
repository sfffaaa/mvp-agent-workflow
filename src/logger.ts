import {
  type PublicClient,
  type WalletClient,
  type Address,
} from "viem"
import { WORKFLOW_LOG_ABI } from "./types.js"

export async function logExecution(
  walletClient: WalletClient,
  publicClient: PublicClient,
  workflowLogAddress: Address,
  workflowId: string,
  action: string,
  result: "success" | "skip" | "failed"
): Promise<void> {
  const hash = await walletClient.writeContract({
    address: workflowLogAddress,
    abi: WORKFLOW_LOG_ABI,
    functionName: "log",
    args: [workflowId, action, result],
    chain: null,
    account: walletClient.account!,
  })
  await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 })
}

export type LogFn = typeof logExecution

/** Calls log() and swallows errors so a failed log never masks a successful workflow action. */
export async function safeLog(tag: string, log: LogFn, ...args: Parameters<LogFn>): Promise<void> {
  try {
    await log(...args)
  } catch (e) {
    console.error(`[${tag}] log failed:`, e instanceof Error ? e.message : String(e))
  }
}
