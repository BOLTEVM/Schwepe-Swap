const http = require('http');
const { BridgeIndexer } = require('./bridgeIndexer');

const PORT = process.env.PORT || 4000;

const bridge = new BridgeIndexer();

const indexedData = {
  network: {
    name: 'Somnia Mainnet',
    chainId: 5031,
    somiToken: '0xdd10620866c4f586b1213d3818811faf3718fce3',
    rpc: 'https://api.infra.mainnet.somnia.network/',
    explorer: 'https://explorer.somnia.network'
  },
  stats: {
    tvlUsd: 18450920,
    volume24hUsd: 4892010,
    totalSwaps: 149208,
    activePools: 42
  },
  pools: [
    {
      pair: 'SOMI / SCHWEPE',
      pairAddress: '0x1111111111111111111111111111111111111111',
      token0: '0xdd10620866c4f586b1213d3818811faf3718fce3',
      token1: '0x4444444444444444444444444444444444444444',
      reserve0: '1000000000000000000000000',
      reserve1: '2485000000000000000000000',
      apr: 142.8
    },
    {
      pair: 'SOMI / USDT',
      pairAddress: '0x2222222222222222222222222222222222222222',
      token0: '0xdd10620866c4f586b1213d3818811faf3718fce3',
      token1: '0x5555555555555555555555555555555555555555',
      reserve0: '5000000000000000000000000',
      reserve1: '3890200000000',
      apr: 88.4
    }
  ]
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // --- Omnifungible Bridge -------------------------------------------------

  // Mesh status: per-chain sync state, transfer counts, and the vault backing check.
  if (url.pathname === '/api/bridge/status') {
    res.writeHead(200);
    return res.end(JSON.stringify(bridge.status()));
  }

  // Track one transfer by its LayerZero guid.
  if (url.pathname.startsWith('/api/bridge/transfer/')) {
    const guid = url.pathname.split('/').pop();
    const transfer = bridge.getTransfer(guid);
    res.writeHead(transfer ? 200 : 404);
    return res.end(JSON.stringify(transfer || { error: 'Transfer not found', guid }));
  }

  // Transfer history, optionally filtered by wallet or status.
  if (url.pathname === '/api/bridge/transfers') {
    res.writeHead(200);
    return res.end(
      JSON.stringify(
        bridge.listTransfers({
          address: url.searchParams.get('address') || undefined,
          status: url.searchParams.get('status') || undefined,
          limit: Number(url.searchParams.get('limit') || 50)
        })
      )
    );
  }

  // Solvency endpoint kept separate so monitoring can alert on it directly.
  if (url.pathname === '/api/bridge/backing') {
    const backing = bridge.status().backing;
    res.writeHead(backing.solvent === false ? 500 : 200);
    return res.end(JSON.stringify(backing));
  }

  if (req.url === '/api/health') {
    res.writeHead(200);
    return res.end(JSON.stringify({ status: 'OK', message: 'SchwepeSwap Somnia Indexer operational' }));
  }

  if (req.url === '/api/summary') {
    res.writeHead(200);
    return res.end(JSON.stringify(indexedData));
  }

  if (req.url === '/api/pools') {
    res.writeHead(200);
    return res.end(JSON.stringify(indexedData.pools));
  }

  if (req.url === '/api/tokens') {
    res.writeHead(200);
    return res.end(JSON.stringify([
      { symbol: 'SOMI', address: '0xdd10620866c4f586b1213d3818811faf3718fce3', decimals: 18 },
      { symbol: 'SCHWEPE', address: '0x4444444444444444444444444444444444444444', decimals: 18 },
      { symbol: 'USDT', address: '0x5555555555555555555555555555555555555555', decimals: 6 }
    ]));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚀 SchwepeSwap Somnia Event Indexer listening on port ${PORT}`);
    bridge.start();
    // Auto shutdown after test verification tick if environment variable is set
    if (process.env.TEST_SHUTDOWN === 'true') {
      setTimeout(() => {
        console.log('Test shutdown complete.');
        server.close();
      }, 1000);
    }
  });
}

module.exports = server;
