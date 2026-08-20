export const SOMNIA_CHAINS = {
  MAINNET: {
    chainId: 5031,
    name: 'Somnia Mainnet',
    rpc: 'https://api.infra.mainnet.somnia.network/',
    nativeCurrency: {
      name: 'Somnia Token',
      symbol: 'SOMI',
      decimals: 18
    },
    explorer: 'https://explorer.somnia.network'
  },
  TESTNET: {
    chainId: 50312,
    name: 'Somnia Shannon Testnet',
    rpc: 'https://dream-rpc.somnia.network/',
    nativeCurrency: {
      name: 'Somnia Testnet Token',
      symbol: 'STT',
      decimals: 18
    },
    explorer: 'https://shannon-explorer.somnia.network'
  }
};

export const SOMIA_SOMI_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';
export const SOMNIA_SCHWEPE_TOKEN_ADDRESS = '0xdd10620866c4f586b1213d3818811faf3718fce3';
export const SOMNIA_WSOMI_TOKEN_ADDRESS = '0x046ede9564a72571df6f5e44d0405360c0f4dcab';
export const SOMNIA_SOMNEX_LP_PAIR_ADDRESS = '0x8008595d869746E6D594d9EB52E8175714fff278';

export const SCHWEPESWAP_ADDRESSES = {
  5031: {
    factory: '0xafd71143fb155058e96527b07695d93223747ed1',
    router: '0x2222222222222222222222222222222222222222',
    wsomi: SOMNIA_WSOMI_TOKEN_ADDRESS,
    schwepe: SOMNIA_SCHWEPE_TOKEN_ADDRESS, // SCHWEPE Token (deployed)
    masterChef: '0x5555555555555555555555555555555555555555',
    somiToken: SOMIA_SOMI_TOKEN_ADDRESS,
    somnexLp: SOMNIA_SOMNEX_LP_PAIR_ADDRESS
  },
  50312: {
    factory: '0x6666666666666666666666666666666666666666',
    router: '0x7777777777777777777777777777777777777777',
    wsomi: '0x8888888888888888888888888888888888888888',
    schwepe: '0x9999999999999999999999999999999999999999',
    masterChef: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    somiToken: SOMIA_SOMI_TOKEN_ADDRESS,
    somnexLp: SOMNIA_SOMNEX_LP_PAIR_ADDRESS
  }
};

/**
 * Chains in the SCHWEPE Omnifungible Bridge mesh.
 *
 * Somnia is the home chain: the live SCHWEPE is locked in SchwepeOFTAdapter there.
 * Every spoke runs a SchwepeOFT mirror whose supply is backed 1:1 by that vault.
 *
 * `eid` is the LayerZero V2 endpoint id, which is NOT the EVM chainId.
 * Addresses verified against https://metadata.layerzero-api.com/v1/metadata/deployments
 */
export const BRIDGE_CHAINS = {
  5031: {
    slug: 'somnia',
    role: 'home' as const,
    chainId: 5031,
    eid: 30380,
    name: 'Somnia',
    rpc: 'https://api.infra.mainnet.somnia.network/',
    explorer: 'https://explorer.somnia.network',
    nativeCurrency: { name: 'Somnia Token', symbol: 'SOMI', decimals: 18 },
    endpointV2: '0x6f475642a6e85809b1c36fa62763669b1b48dd5b',
    // The live SCHWEPE token that the vault locks.
    token: SOMNIA_SCHWEPE_TOKEN_ADDRESS,
    // SchwepeOFTAdapter — populated by scripts/deployBridge.js
    bridge: ''
  },
  42161: {
    slug: 'arbitrum',
    role: 'spoke' as const,
    chainId: 42161,
    eid: 30110,
    name: 'Arbitrum One',
    rpc: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    endpointV2: '0x1a44076050125825900e736c501f859c50fe728c',
    // On spokes the OFT mirror IS the token, so both fields hold the same address.
    token: '',
    bridge: ''
  },
  4663: {
    slug: 'robinhood',
    role: 'spoke' as const,
    chainId: 4663,
    eid: 30416,
    name: 'Robinhood Chain',
    rpc: 'https://rpc.robinhoodchain.com',
    explorer: 'https://explorer.robinhoodchain.com',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    endpointV2: '0x6f475642a6e85809b1c36fa62763669b1b48dd5b',
    token: '',
    bridge: ''
  }
};

export type BridgeChainId = keyof typeof BRIDGE_CHAINS;

export const BRIDGE_HOME_CHAIN_ID = 5031;

/**
 * Chains in display order — home first, then spokes alphabetically.
 * Object.values() alone would order by numeric key, putting Robinhood (4663) ahead of Somnia.
 */
export const BRIDGE_CHAIN_LIST = Object.values(BRIDGE_CHAINS).sort((a, b) =>
  a.role === b.role ? a.name.localeCompare(b.name) : a.role === 'home' ? -1 : 1
);

export const bridgeChainByEid = (eid: number) =>
  Object.values(BRIDGE_CHAINS).find((c) => c.eid === eid);

export const bridgeChain = (chainId: number) =>
  (BRIDGE_CHAINS as Record<number, typeof BRIDGE_CHAINS[5031]>)[chainId];

export const DEFAULT_TOKENS = [
  {
    symbol: 'SOMI',
    name: 'Somnia Token',
    address: SOMIA_SOMI_TOKEN_ADDRESS,
    decimals: 18,
    logoURI: 'https://explorer.somnia.network/assets/favicon/apple-touch-icon-180x180.png',
    isNative: true
  },
  {
    symbol: 'WSOMI',
    name: 'Wrapped SOMI',
    address: SOMNIA_WSOMI_TOKEN_ADDRESS,
    decimals: 18,
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png'
  },
  {
    symbol: 'SALP',
    name: 'Somnex AMM LP Token',
    address: SOMNIA_SOMNEX_LP_PAIR_ADDRESS,
    decimals: 18,
    logoURI: 'https://explorer.somnia.network/assets/favicon/apple-touch-icon-180x180.png'
  },
  {
    symbol: 'SCHWEPE',
    name: 'Schwepe Governance',
    address: '0xdd10620866c4f586b1213d3818811faf3718fce3',
    decimals: 18,
    logoURI: '/schwemes/schwepelogov1.jpg'
  },
  {
    symbol: 'USDT',
    name: 'Tether USD (Somnia)',
    address: '0x5555555555555555555555555555555555555555',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png'
  },
  {
    symbol: 'USDC',
    name: 'USD Coin (Somnia)',
    address: '0x6666666666666666666666666666666666666666',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
  }
];
