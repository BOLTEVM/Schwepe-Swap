require("@nomicfoundation/hardhat-toolbox");

const SOMNIA_MAINNET_RPC = process.env.SOMNIA_MAINNET_RPC || "https://api.infra.mainnet.somnia.network/";
const SOMNIA_TESTNET_RPC = process.env.SOMNIA_TESTNET_RPC || "https://dream-rpc.somnia.network/";
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {},
    somnia: {
      url: SOMNIA_MAINNET_RPC,
      chainId: 5031,
      accounts: [PRIVATE_KEY]
    },
    somniaTestnet: {
      url: SOMNIA_TESTNET_RPC,
      chainId: 50312,
      accounts: [PRIVATE_KEY]
    }
  },
  etherscan: {
    customChains: [
      {
        network: "somnia",
        chainId: 5031,
        urls: {
          apiURL: "https://explorer.somnia.network/api",
          browserURL: "https://explorer.somnia.network"
        }
      },
      {
        network: "somniaTestnet",
        chainId: 50312,
        urls: {
          apiURL: "https://shannon-explorer.somnia.network/api",
          browserURL: "https://shannon-explorer.somnia.network"
        }
      }
    ]
  }
};
