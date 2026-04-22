import { jest } from "@jest/globals"
import { runRebalance } from "../src/workflows/rebalance.js"
import { parseUnits } from "viem"

const makePublicClient = (balance: bigint) => ({
  readContract: jest.fn().mockResolvedValue(balance),
  waitForTransactionReceipt: jest.fn().mockResolvedValue({ status: "success" }),
})

const makeWalletClient = () => ({
  writeContract: jest.fn().mockResolvedValue("0xabc"),
  account: { address: "0xagent" as `0x${string}` },
})

const makeLogger = () => jest.fn().mockResolvedValue(undefined)

describe("rebalance", () => {
  const config = {
    usdcAddress: "0xusdc" as `0x${string}`,
    mockSwapAddress: "0xswap" as `0x${string}`,
    workflowLogAddress: "0xlog" as `0x${string}`,
    rebalanceThreshold: parseUnits("100", 6),
  }

  it("swaps when balance exceeds threshold", async () => {
    const publicClient = makePublicClient(parseUnits("120", 6))
    const walletClient = makeWalletClient()
    const logger = makeLogger()

    await runRebalance(publicClient as any, walletClient as any, config, logger)

    expect(walletClient.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({ functionName: "swap", args: [parseUnits("20", 6)] })
    )
    expect(logger).toHaveBeenCalledWith(expect.anything(), expect.anything(), "0xlog", "rebalance", expect.stringContaining("20"), "success")
  })

  it("skips when balance is at or below threshold", async () => {
    const publicClient = makePublicClient(parseUnits("100", 6))
    const walletClient = makeWalletClient()
    const logger = makeLogger()

    await runRebalance(publicClient as any, walletClient as any, config, logger)

    expect(walletClient.writeContract).not.toHaveBeenCalled()
    expect(logger).toHaveBeenCalledWith(expect.anything(), expect.anything(), "0xlog", "rebalance", expect.any(String), "skip")
  })
})
