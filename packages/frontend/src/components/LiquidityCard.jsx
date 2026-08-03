import React, { useState } from 'react';
import { Plus, Droplets, Layers } from 'lucide-react';
import { DEFAULT_TOKENS } from '../../../sdk/src/constants';

export default function LiquidityCard() {
  const [amountA, setAmountA] = useState('500');
  const [amountB, setAmountB] = useState('1242.5');

  return (
    <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', margin: '30px auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Droplets color="#06b6d4" /> Add Liquidity Pool
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Earn 0.25% of all Somnia network trade fees proportional to pool share</p>
        </div>
      </div>

      <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: '#94a3b8' }}>
          <span>Input Amount (Token A)</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <input
            type="number"
            value={amountA}
            onChange={(e) => setAmountA(e.target.value)}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', fontWeight: 700, width: '60%', outline: 'none' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '12px' }}>
            <img src={DEFAULT_TOKENS[0].logoURI} alt="SOMI" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
            <span style={{ fontWeight: 700 }}>SOMI</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
        <Plus size={20} color="#a855f7" />
      </div>

      <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: '#94a3b8' }}>
          <span>Input Amount (Token B)</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <input
            type="number"
            value={amountB}
            onChange={(e) => setAmountB(e.target.value)}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', fontWeight: 700, width: '60%', outline: 'none' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '12px' }}>
            <img src={DEFAULT_TOKENS[2].logoURI} alt="SCHWEPE" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
            <span style={{ fontWeight: 700 }}>SCHWEPE</span>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '14px', marginBottom: '20px', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '6px' }}>
          <span>Pool Share</span>
          <span style={{ color: '#a855f7', fontWeight: 700 }}>0.084%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
          <span>LP Tokens Received</span>
          <span style={{ color: '#fff' }}>788.94 SCHWEPE-LP</span>
        </div>
      </div>

      <button className="btn-gradient" style={{ width: '100%' }}>Supply Liquidity</button>
    </div>
  );
}
