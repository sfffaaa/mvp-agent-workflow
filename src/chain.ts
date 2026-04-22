import { defineChain } from "viem"

export const fujiChain = defineChain({
  id: 43113,
  name: "Avalanche Fuji",
  nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
  rpcUrls: { default: { http: ["https://avalanche-fuji-c-chain-rpc.publicnode.com"] } },
  fees: { defaultPriorityFee: 1_000_000_000n },
})
