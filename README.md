# SchwepeSwap Monorepo 🌊⚡

SchwepeSwap is a next-generation Decentralized Automated Market Maker (AMM), Liquidity Hub, and Yield Farming dApp custom-built for the high-throughput **Somnia Network**.

## 🚀 Key Highlights & Somnia Integration

- **Explorer Address Research Target**: [0xdd10620866c4f586b1213d3818811faf3718fce3](https://explorer.somnia.network/address/0xdd10620866c4f586b1213d3818811faf3718fce3) ($SOMI Token)
- **Somnia Mainnet**: Chain ID `5031` | RPC `https://api.infra.mainnet.somnia.network/`
- **Somnia Testnet (Shannon)**: Chain ID `50312` | RPC `https://dream-rpc.somnia.network/`
- **Thirdweb SDK Integration**: Uses `@thirdweb-dev/sdk` / `thirdweb` for seamless Web3 wallet login, contract deployment, transaction pipelines, and network switching.
- **Async Web3 Pipeline**: Features an asynchronous pipeline powered by `await` workflows for auto-approvals, route discovery, swap simulation, LP staking, and real-time state fetching.

## 📁 Repository Structure (`pnpm` Workspaces)

```
bSS/
├── packages/
│   ├── contracts/   # Solidity Smart Contracts (Factory, Pair, Router, WSOMI, MasterChef, Tests)
│   ├── sdk/         # TypeScript Web3 SDK & Async Pipeline Engine with Thirdweb integration
│   ├── frontend/    # Luxury Web3 Swap dApp UI (Vite + React + Glassmorphism CSS)
│   └── indexer/     # Node.js Event Indexer & REST API for Somnia Network stats
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

## 🛠️ Quick Start

```bash
# Install dependencies across all packages
pnpm install

# Compile Smart Contracts
pnpm compile:contracts

# Run Automated Smart Contract & Pipeline Tests
pnpm test

# Launch Web Application Frontend
pnpm dev:frontend

# Run Indexer Service
pnpm start:indexer
```

## ⚡ Web3 Async Pipeline (`await` Execution Workflow)

The SDK features a pipeline executor:
1. `await pipeline.validateNetwork()` - Verifies connection to Somnia Chain ID `5031` or `50312`.
2. `await pipeline.checkAllowance()` - Queries ERC-20 allowances for $SOMI (`0xdd10620866c4f586b1213d3818811faf3718fce3`) & pairs.
3. `await pipeline.executeApproval()` - Executes atomic approval transaction if required.
4. `await pipeline.simulateSwap()` - Computes exact amounts out using constant product AMM formula (`x * y = k`).
5. `await pipeline.executeSwap()` - Submits swap transaction through `SchwepeRouter` to Somnia EVM.
