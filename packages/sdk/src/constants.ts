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

export const SOMIA_SOMI_TOKEN_ADDRESS = '0xdd10620866c4f586b1213d3818811faf3718fce3';
export const SOMNIA_WSOMI_TOKEN_ADDRESS = '0x046ede9564a72571df6f5e44d0405360c0f4dcab';
export const SOMNIA_SOMNEX_LP_PAIR_ADDRESS = '0x8008595d869746E6D594d9EB52E8175714fff278';

export const SCHWEPESWAP_ADDRESSES = {
  5031: {
    factory: '0xafd71143fb155058e96527b07695d93223747ed1',
    router: '0x2222222222222222222222222222222222222222',
    wsomi: SOMNIA_WSOMI_TOKEN_ADDRESS,
    schwepe: '0xdd10620866c4f586b1213d3818811faf3718fce3', // SCHWEPE Token (deployed)
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
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png'
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
