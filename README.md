# On-Chain AI Agent Workflow

A Node.js agent that runs three DeFi workflows automatically, logging every execution on-chain to Avalanche Fuji.

## What It Does

Every 60 seconds the agent reads chain state, checks three conditions, and executes transactions if needed. Every run — success, skip, or failure — is written to a `WorkflowLog` contract on-chain.

| Workflow | Condition | Action |
|---|---|---|
| **Rebalance** | USDC mock balance > threshold (default: 100) | Swap excess USDC → ETH mock |
| **Compound** | Pending staking reward > threshold (default: 5) | Claim rewards + restake |
| **Bridge** | ETH mock balance < threshold (default: 50) | Log bridge request on-chain |

## Architecture

```
Agent (Node.js, setInterval 60s)
  │
  ├─ rebalance → reads USDC balance → MockSwap.swap() → WorkflowLog.log()
  ├─ compound  → reads pendingReward → MockStaking.claim()+stake() → WorkflowLog.log()
  └─ bridge    → reads ETH balance → WorkflowLog.log() (mock bridge)
```

## Contracts (Avalanche Fuji)

| Contract | Description |
|---|---|
| `MockAsset.sol` | ERC-20 with `mint()`, 6 decimals — used as USDC mock and ETH mock |
| `MockSwap.sol` | Fixed 1:1 rate swap |
| `MockStaking.sol` | Stake tokens, earn 1% per day, claim rewards |
| `WorkflowLog.sol` | On-chain execution log — stores records + emits `ExecutionLogged` events |

## Quick Start

### Prerequisites
- [Foundry](https://getfoundry.sh/)
- Node.js 18+
- Avalanche Fuji AVAX: https://faucet.avax.network/

### Install

```bash
npm install
cd contracts && forge install OpenZeppelin/openzeppelin-contracts --no-commit && cd ..
```

### Deploy Contracts

```bash
export DEPLOYER_PK=0x<your-deployer-private-key>
cd contracts
forge script script/Deploy.s.sol \
  --rpc-url https://avalanche-fuji-c-chain-rpc.publicnode.com \
  --broadcast --legacy
```

Copy the logged addresses into `.env`:

```bash
cp .env.example .env
# fill in addresses from deploy output + set AGENT_PK
```

### Mint Test Tokens to Agent Wallet

```bash
export RPC=https://avalanche-fuji-c-chain-rpc.publicnode.com
# Mint 500 USDC mock (above rebalance threshold)
cast send --rpc-url $RPC --private-key $DEPLOYER_PK $USDC_ADDRESS \
  "mint(address,uint256)" $AGENT_ADDRESS 500000000 --legacy
# Mint 30 ETH mock (below bridge threshold)
cast send --rpc-url $RPC --private-key $DEPLOYER_PK $ETH_MOCK_ADDRESS \
  "mint(address,uint256)" $AGENT_ADDRESS 30000000 --legacy
```

### Run Agent

```bash
npm run agent
```

Expected output:
```
Agent started. Polling every 60 seconds.
Agent address: 0x...

[2026-04-22T...] polling...
[rebalance] balance: 500.000000 USDC → swap 400.000000 USDC→ETH
[compound] reward: 0.000000, threshold: 5.000000 → skip
[bridge] ETH balance: 30.000000 below threshold 50.000000 → bridge request
```

### Run Tests

```bash
npm test                              # Jest workflow tests (6 tests)
cd contracts && forge test -v         # Foundry contract tests
```

## Tech Stack

| Layer | Tool |
|---|---|
| Contracts | Solidity ^0.8.24, Foundry |
| OZ deps | `@openzeppelin/contracts` v5 |
| TypeScript | ESM, NodeNext, viem v2, Jest |
| Chain | Avalanche Fuji C-Chain (chainId 43113) |
