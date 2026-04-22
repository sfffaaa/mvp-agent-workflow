import { runBridge } from "../src/workflows/bridge.js"
import { parseUnits } from "viem"

const makePublicClient = (balance: bigint) => ({
  readContract: jest.fn().mockResolvedValue(balance),
})

const makeWalletClient = () => ({
  writeContract: jest.fn().mockResolvedValue("0xabc"),
  account: { address: "0xagent" as `0x${string}` },
})

const makeLogger = () => jest.fn().mockResolvedValue(undefined)

describe("bridge", () => {
  const config = {
    ethMockAddress: "0xeth" as `0x${string}`,
    workflowLogAddress: "0xlog" as `0x${string}`,
    bridgeThreshold: parseUnits("50", 6),
  }

  it("emits bridge request when balance is below threshold", async () => {
    const publicClient = makePublicClient(parseUnits("30", 6))
    const walletClient = makeWalletClient()
    const logger = makeLogger()

    await runBridge(publicClient as any, walletClient as any, config, logger)

    expect(logger).toHaveBeenCalledWith(expect.anything(), expect.anything(), "0xlog", "bridge", expect.stringContaining("30"), "success")
  })

  it("skips when balance is at or above threshold", async () => {
    const publicClient = makePublicClient(parseUnits("60", 6))
    const walletClient = makeWalletClient()
    const logger = makeLogger()

    await runBridge(publicClient as any, walletClient as any, config, logger)

    expect(logger).toHaveBeenCalledWith(expect.anything(), expect.anything(), "0xlog", "bridge", expect.any(String), "skip")
  })
})
