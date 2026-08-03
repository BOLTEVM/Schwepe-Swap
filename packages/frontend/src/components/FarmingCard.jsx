import React from 'react';
import { Coins, Sparkles } from 'lucide-react';

export default function FarmingCard() {
  const pools = [
    { name: 'SOMI / SCHWEPE LP', apr: '142.8%', tvl: '$1,248,500', earned: '14.82 SCHWEPE' },
    { name: 'SOMI / USDT LP', apr: '88.4%', tvl: '$3,890,200', earned: '0.00 SCHWEPE' },
    { name: 'SCHWEPE / USDC LP', apr: '112.5%', tvl: '$890,100', earned: '5.20 SCHWEPE' }
  ];

  return (
    <div className="glass-panel" style={{ width: '100%', maxWidth: '780px', margin: '30px auto', padding: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Coins color="#ec4899" /> SchwepeMasterChef Farms
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Stake LP tokens to earn high-yield $SCHWEPE block rewards on Somnia EVM</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {pools.map((p, i) => (
          <div key={i} style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</span>
              <span className="badge-somnia" style={{ color: '#ec4899', borderColor: 'rgba(236,72,153,0.3)', background: 'rgba(236,72,153,0.1)' }}>
                <Sparkles size={12} /> {p.apr} APR
              </span>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px' }}>
              <div>TVL: <strong style={{ color: '#fff' }}>{p.tvl}</strong></div>
              <div>Earned: <strong style={{ color: '#38bdf8' }}>{p.earned}</strong></div>
            </div>

            <button className="btn-gradient" style={{ width: '100%', padding: '8px 12px', fontSize: '0.8rem', marginTop: '8px' }}>
              Stake LP Tokens
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
