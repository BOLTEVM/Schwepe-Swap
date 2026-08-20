/**
 * LayerZero V2 deployment data for the SCHWEPE Omnifungible Bridge mesh.
 *
 * Verified against https://metadata.layerzero-api.com/v1/metadata/deployments
 * Somnia is the home chain (vault adapter); Arbitrum and Robinhood are spokes (OFT mirrors).
 */

const SCHWEPE_SOMNIA = "0xdd10620866c4f586b1213d3818811faf3718fce3";

const CHAINS = {
  somnia: {
    role: "home",
    chainId: 5031,
    eid: 30380,
    rpc: process.env.SOMNIA_MAINNET_RPC || "https://api.infra.mainnet.somnia.network/",
    explorer: "https://explorer.somnia.network",
    endpointV2: "0x6f475642a6e85809b1c36fa62763669b1b48dd5b",
    sendUln302: "0xc39161c743d0307eb9bcc9fef03eeb9dc4802de7",
    receiveUln302: "0xe1844c5d63a9543023008d332bd3d2e6f1fe1043",
    executor: "0x4208d6e27538189bb48e603d6123a94b8abe0a0b",
    innerToken: SCHWEPE_SOMNIA,
    dvns: {
      layerzero: "0x282b3386571f7f794450d5789911a9804fa346b4",
      nethermind: "0x5fa12ebc08e183c1f5d44678cf897edefe68738b",
      horizen: "0x5fddd320a1e29bb466fa635661b125d51d976f92"
    }
  },
  arbitrum: {
    role: "spoke",
    chainId: 42161,
    eid: 30110,
    rpc: process.env.ARBITRUM_RPC || "https://arb1.arbitrum.io/rpc",
    explorer: "https://arbiscan.io",
    endpointV2: "0x1a44076050125825900e736c501f859c50fe728c",
    sendUln302: "0x975bcd720be66659e3eb3c0e4f1866a3020e493a",
    receiveUln302: "0x7b9e184e07a6ee1ac23eae0fe8d6be2f663f05e6",
    executor: "0x31cae3b7fb82d847621859fb1585353c5720660d",
    dvns: {
      layerzero: "0x2f55c492897526677c5b68fb199ea31e2c126416",
      nethermind: "0xa7b5189bca84cd304d8553977c7c614329750d99",
      horizen: "0x19670df5e16bea2ba9b9e68b48c054c5baea06b8"
    }
  },
  robinhood: {
    role: "spoke",
    chainId: 4663,
    eid: 30416,
    rpc: process.env.ROBINHOOD_RPC || "https://rpc.robinhoodchain.com",
    explorer: "https://explorer.robinhoodchain.com",
    endpointV2: "0x6f475642a6e85809b1c36fa62763669b1b48dd5b",
    sendUln302: "0xc39161c743d0307eb9bcc9fef03eeb9dc4802de7",
    receiveUln302: "0xe1844c5d63a9543023008d332bd3d2e6f1fe1043",
    executor: "0x4208d6e27538189bb48e603d6123a94b8abe0a0b",
    dvns: {
      layerzero: "0xd01ae6905d48315f7be10c7330aecf8360ef5b12",
      nethermind: "0x0ffe02df012299a370d5dd69298a5826eacafdf8",
      horizen: "0x1258a278519c7f4bd997a9c3bfd4aa802a028d89"
    }
  }
};

/**
 * Security stack applied to every pathway.
 *
 * A 2-of-3 required-DVN set means no single verifier can forge a message. LayerZero Labs,
 * Nethermind, and Horizen are the three DVNs present on all three chains in this mesh.
 */
const DVN_CONFIG = {
  requiredDVNs: ["layerzero", "nethermind"],
  optionalDVNs: ["horizen"],
  optionalDVNThreshold: 1,
  confirmations: {
    somnia: 20,
    arbitrum: 20,
    robinhood: 20
  }
};

/**
 * Launch rate limits, deliberately conservative.
 * SCHWEPE total supply is 1,000,000,000 — 5M/hour is 0.5% of supply per hour per pathway.
 */
const RATE_LIMITS = {
  limit: "5000000",   // whole tokens per window, per destination
  windowSeconds: 3600
};

const bySlug = (slug) => {
  const chain = CHAINS[slug];
  if (!chain) throw new Error(`Unknown chain slug: ${slug}. Known: ${Object.keys(CHAINS).join(", ")}`);
  return chain;
};

const byEid = (eid) => Object.values(CHAINS).find((c) => c.eid === eid);

const spokes = () => Object.entries(CHAINS).filter(([, c]) => c.role === "spoke");

module.exports = { CHAINS, DVN_CONFIG, RATE_LIMITS, SCHWEPE_SOMNIA, bySlug, byEid, spokes };
