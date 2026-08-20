const { ethers } = require('ethers');

/**
 * Cross-chain tracker for the SCHWEPE Omnifungible Bridge.
 *
 * Watches OFTSent / OFTReceived on every chain in the mesh and pairs them by LayerZero guid,
 * so the frontend can show a transfer moving from "sent" to "delivered" — and so a transfer
 * that never lands becomes visible as "stuck" instead of silently disappearing.
 *
 * Also runs the bridge's solvency check: SCHWEPE locked in the Somnia vault must always be
 * at least the total mirror supply across all spokes. Drift there is an incident, not a metric.
 */

const CHAINS = {
  somnia: {
    role: 'home',
    chainId: 5031,
    eid: 30380,
    name: 'Somnia',
    rpc: process.env.SOMNIA_MAINNET_RPC || 'https://api.infra.mainnet.somnia.network/',
    explorer: 'https://explorer.somnia.network',
    bridge: process.env.BRIDGE_SOMNIA || ''
  },
  arbitrum: {
    role: 'spoke',
    chainId: 42161,
    eid: 30110,
    name: 'Arbitrum One',
    rpc: process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io',
    bridge: process.env.BRIDGE_ARBITRUM || ''
  },
  robinhood: {
    role: 'spoke',
    chainId: 4663,
    eid: 30416,
    name: 'Robinhood Chain',
    rpc: process.env.ROBINHOOD_RPC || 'https://rpc.robinhoodchain.com',
    explorer: 'https://explorer.robinhoodchain.com',
    bridge: process.env.BRIDGE_ROBINHOOD || ''
  }
};

const BRIDGE_ABI = [
  'event OFTSent(bytes32 indexed guid, uint32 dstEid, address indexed fromAddress, uint256 amountSentLD, uint256 amountReceivedLD)',
  'event OFTReceived(bytes32 indexed guid, uint32 srcEid, address indexed toAddress, uint256 amountReceivedLD)',
  'function totalLocked() view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function paused() view returns (bool)'
];

/** A transfer is considered stuck if it has not landed within this window. */
const STUCK_AFTER_MS = 30 * 60 * 1000;
const POLL_INTERVAL_MS = Number(process.env.BRIDGE_POLL_MS || 15_000);
const BLOCK_LOOKBACK = Number(process.env.BRIDGE_LOOKBACK || 2000);

const byEid = (eid) => Object.values(CHAINS).find((c) => c.eid === eid);

class BridgeIndexer {
  constructor() {
    /** guid => transfer record */
    this.transfers = new Map();
    this.backing = { locked: null, minted: null, solvent: null, checkedAt: null };
    this.cursors = {};
    this.errors = {};
    this.timer = null;
    this.providers = {};
  }

  /** Chains that are actually configured with a deployed bridge address. */
  activeChains() {
    return Object.entries(CHAINS).filter(([, c]) => ethers.isAddress(c.bridge));
  }

  provider(slug) {
    if (!this.providers[slug]) {
      const chain = CHAINS[slug];
      this.providers[slug] = new ethers.JsonRpcProvider(chain.rpc, chain.chainId, {
        staticNetwork: true
      });
    }
    return this.providers[slug];
  }

  async pollChain(slug, chain) {
    const provider = this.provider(slug);
    const contract = new ethers.Contract(chain.bridge, BRIDGE_ABI, provider);
    const head = await provider.getBlockNumber();
    const from = this.cursors[slug] ?? Math.max(0, head - BLOCK_LOOKBACK);
    if (from > head) return;

    const [sent, received] = await Promise.all([
      contract.queryFilter(contract.filters.OFTSent(), from, head),
      contract.queryFilter(contract.filters.OFTReceived(), from, head)
    ]);

    for (const log of sent) {
      const guid = log.args.guid;
      const dst = byEid(Number(log.args.dstEid));
      const existing = this.transfers.get(guid) || {};
      this.transfers.set(guid, {
        ...existing,
        guid,
        from: { chain: slug, name: chain.name, eid: chain.eid },
        to: dst ? { chain: dst.role === 'home' ? 'somnia' : dst.name, name: dst.name, eid: dst.eid } : null,
        sender: log.args.fromAddress,
        amountSent: log.args.amountSentLD.toString(),
        amountExpected: log.args.amountReceivedLD.toString(),
        sentTx: log.transactionHash,
        sentBlock: log.blockNumber,
        sentAt: existing.sentAt || Date.now(),
        status: existing.status === 'delivered' ? 'delivered' : 'in_transit'
      });
    }

    for (const log of received) {
      const guid = log.args.guid;
      const existing = this.transfers.get(guid) || { guid };
      this.transfers.set(guid, {
        ...existing,
        recipient: log.args.toAddress,
        amountReceived: log.args.amountReceivedLD.toString(),
        receivedTx: log.transactionHash,
        deliveredOn: slug,
        deliveredAt: Date.now(),
        status: 'delivered'
      });
    }

    this.cursors[slug] = head + 1;
    delete this.errors[slug];
  }

  /** Mark transfers that left but never landed. Surfaces stalls instead of hiding them. */
  markStuck() {
    const now = Date.now();
    for (const transfer of this.transfers.values()) {
      if (transfer.status === 'in_transit' && transfer.sentAt && now - transfer.sentAt > STUCK_AFTER_MS) {
        transfer.status = 'stuck';
      }
    }
  }

  /**
   * The invariant that makes mirrors real: vault-locked SCHWEPE >= total minted mirrors.
   */
  async checkBacking() {
    const home = CHAINS.somnia;
    if (!ethers.isAddress(home.bridge)) return;

    const vault = new ethers.Contract(home.bridge, BRIDGE_ABI, this.provider('somnia'));
    const locked = await vault.totalLocked();

    let minted = 0n;
    for (const [slug, chain] of this.activeChains()) {
      if (chain.role !== 'spoke') continue;
      const mirror = new ethers.Contract(chain.bridge, BRIDGE_ABI, this.provider(slug));
      minted += await mirror.totalSupply();
    }

    this.backing = {
      locked: locked.toString(),
      minted: minted.toString(),
      solvent: locked >= minted,
      shortfall: locked >= minted ? '0' : (minted - locked).toString(),
      checkedAt: new Date().toISOString()
    };

    if (!this.backing.solvent) {
      console.error(
        `[bridge] SOLVENCY ALERT: ${this.backing.shortfall} wei of mirror supply is unbacked`
      );
    }
  }

  async tick() {
    for (const [slug, chain] of this.activeChains()) {
      try {
        await this.pollChain(slug, chain);
      } catch (err) {
        this.errors[slug] = err.message;
        console.error(`[bridge] poll failed on ${slug}: ${err.message}`);
      }
    }
    this.markStuck();
    try {
      await this.checkBacking();
    } catch (err) {
      console.error(`[bridge] backing check failed: ${err.message}`);
    }
  }

  start() {
    const active = this.activeChains();
    if (active.length === 0) {
      console.log('[bridge] no bridge addresses configured — tracker idle');
      return this;
    }
    console.log(`[bridge] tracking ${active.map(([s]) => s).join(', ')} every ${POLL_INTERVAL_MS}ms`);
    this.tick();
    this.timer = setInterval(() => this.tick(), POLL_INTERVAL_MS);
    if (this.timer.unref) this.timer.unref();
    return this;
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  // -------------------------------------------------------------------
  // Read API
  // -------------------------------------------------------------------

  getTransfer(guid) {
    return this.transfers.get(guid) || null;
  }

  listTransfers({ address, status, limit = 50 } = {}) {
    let all = [...this.transfers.values()];
    if (address) {
      const target = address.toLowerCase();
      all = all.filter(
        (t) => t.sender?.toLowerCase() === target || t.recipient?.toLowerCase() === target
      );
    }
    if (status) all = all.filter((t) => t.status === status);
    return all.sort((a, b) => (b.sentAt || 0) - (a.sentAt || 0)).slice(0, limit);
  }

  status() {
    const all = [...this.transfers.values()];
    return {
      chains: Object.fromEntries(
        Object.entries(CHAINS).map(([slug, c]) => [
          slug,
          {
            name: c.name,
            chainId: c.chainId,
            eid: c.eid,
            role: c.role,
            bridge: c.bridge || null,
            configured: ethers.isAddress(c.bridge),
            lastBlock: this.cursors[slug] ? this.cursors[slug] - 1 : null,
            error: this.errors[slug] || null
          }
        ])
      ),
      transfers: {
        total: all.length,
        inTransit: all.filter((t) => t.status === 'in_transit').length,
        delivered: all.filter((t) => t.status === 'delivered').length,
        stuck: all.filter((t) => t.status === 'stuck').length
      },
      backing: this.backing
    };
  }
}

module.exports = { BridgeIndexer, CHAINS, BRIDGE_ABI };
