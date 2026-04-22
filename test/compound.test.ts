import { jest } from "@jest/globals"
import { runCompound } from "../src/workflows/compound.js"
import { parseUnits } from "viem"

const makePublicClient = (pendingReward: bigint, stakedBalance: bigint) => ({
  readContract: jest.fn()
    .mockResolvedValueOnce(pendingReward)
    .mockResolvedValueOnce(stakedBalance)
    .mockResolvedValue(pendingReward), // actualBalance read after claim
  waitForTransactionReceipt: jest.fn().mockResolvedValue({ status: "success" }),
})

const makeWalletClient = () => ({
  writeContract: jest.fn().mockResolvedValue("0xabc"),
  account: { address: "0xagent" as `0x${string}` },
})

const makeLogger = () => jest.fn().mockResolvedValue(undefined)

describe("compound", () => {
  const config = {
    usdcAddress: "0xusdc" as `0x${string}`,
    mockStakingAddress: "0xstaking" as `0x${string}`,
    workflowLogAddress: "0xlog" as `0x${string}`,
    compoundThreshold: parseUnits("5", 6),
  }

  it("claims and stakes when reward exceeds threshold", async () => {
    const publicClient = makePublicClient(parseUnits("10", 6), parseUnits("100", 6))
    const walletClient = makeWalletClient()
    const logger = makeLogger()

    await runCompound(publicClient as any, walletClient as any, config, logger)

    expect(walletClient.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({ functionName: "claim" })
    )
    expect(walletClient.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({ functionName: "stake" })
    )
    expect(logger).toHaveBeenCalledWith(expect.anything(), expect.anything(), "0xlog", "compound", expect.any(String), "success")
  })

  it("skips when reward is below threshold", async () => {
    const publicClient = makePublicClient(parseUnits("2", 6), parseUnits("100", 6))
    const walletClient = makeWalletClient()
    const logger = makeLogger()

    await runCompound(publicClient as any, walletClient as any, config, logger)

    expect(walletClient.writeContract).not.toHaveBeenCalled()
    expect(logger).toHaveBeenCalledWith(expect.anything(), expect.anything(), "0xlog", "compound", expect.any(String), "skip")
  })
})
