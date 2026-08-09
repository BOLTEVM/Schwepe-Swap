import React, { useState } from 'react';
import { ArrowRightLeft, RefreshCw, ShieldCheck } from 'lucide-react';

export default function WrapUnwrapCard({ walletAddress, nativeBalance, wsomiBalance, onRunUnwrap }) {
  const [mode, setMode] = useState('unwrap'); // 'unwrap' (WSOMI -> SOMI) or 'wrap' (SOMI -> WSOMI)
  const [amount, setAmount] = useState('3.3596');

  const handleMaxClick = () => {
    if (mode === 'unwrap') {
      setAmount(wsomiBalance || '0.0000');
    } else {
      const nat = parseFloat(nativeBalance || '0');
      const safeMax = nat > 0.005 ? (nat - 0.005).toFixed(4) : nat.toFixed(4);
      setAmount(safeMax);
    }
  };

  const handlePresetClick = (pct) => {
    const total = parseFloat(mode === 'unwrap' ? (wsomiBalance || '0') : (nativeBalance || '0'));
    const calc = (total * pct).toFixed(4);
    setAmount(calc);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onRunUnwrap) {
      onRunUnwrap(mode, amount);
    }
  };

  return (
    <div className="glass-panel card-glow" style={{ padding: '28px', width: '100%', maxWidth: '480px', margin: '0 auto', borderRadius: '24px' }}>
      
      {/* Header & Mode Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowRightLeft size={20} color="#ec4899" />
          Segregated Wrap / Unwrap
        </h2>
        <span style={{ fontSize: '0.75rem', background: 'rgba(236,72,153,0.15)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.3)', padding: '3px 10px', borderRadius: '20px', fontWeight: 700 }}>
          1:1 Zero-Fee Convert
        </span>
      </div>

      {/* Mode Selector Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => setMode('unwrap')}
          style={{
            padding: '10px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: mode === 'unwrap' ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'transparent',
            color: mode === 'unwrap' ? '#fff' : '#94a3b8',
            transition: 'all 0.2s ease'
          }}
        >
          🔄 Unwrap (WSOMI ➔ SOMI)
        </button>
        <button
          type="button"
          onClick={() => setMode('wrap')}
          style={{
            padding: '10px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: mode === 'wrap' ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'transparent',
            color: mode === 'wrap' ? '#fff' : '#94a3b8',
            transition: 'all 0.2s ease'
          }}
        >
          ⚡ Wrap (SOMI ➔ WSOMI)
        </button>
      </div>

      {/* Input Box */}
      <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '18px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.85rem', color: '#94a3b8' }}>
          <span>You Convert ({mode === 'unwrap' ? 'WSOMI' : 'Native SOMI'})</span>
          <span>Balance: {mode === 'unwrap' ? (wsomiBalance || '0.0000') + ' WSOMI' : (nativeBalance || '0.0000') + ' SOMI'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            style={{
              background: 'none',
              border: 'none',
              color: '#f8fafc',
              fontSize: '1.9rem',
              fontWeight: 700,
              width: '55%',
              outline: 'none'
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleMaxClick}
              style={{
                background: 'rgba(236,72,153,0.2)',
                border: '1px solid rgba(236,72,153,0.4)',
                color: '#ec4899',
                fontWeight: 700,
                fontSize: '0.75rem',
                padding: '4px 8px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              MAX
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '12px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{mode === 'unwrap' ? 'WSOMI' : 'SOMI'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Fill Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[0.25, 0.5, 0.75, 1.0].map((pct) => (
          <button
            key={pct}
            type="button"
            onClick={() => handlePresetClick(pct)}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#94a3b8',
              borderRadius: '8px',
              padding: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {pct * 100}%
          </button>
        ))}
      </div>

      {/* Output Display */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '14px 16px', marginBottom: '24px', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '8px' }}>
          <span>You Receive (1:1 Guaranteed)</span>
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>{amount || '0.0000'} {mode === 'unwrap' ? 'Native SOMI' : 'WSOMI'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
          <span>Rate</span>
          <span>1 WSOMI = 1.0000 SOMI</span>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleSubmit}
        className="btn-gradient"
        style={{ width: '100%', fontSize: '1.1rem', padding: '14px', fontWeight: 800 }}
      >
        {!walletAddress ? 'Connect Wallet' : mode === 'unwrap' ? 'Unwrap WSOMI into Native SOMI' : 'Wrap Native SOMI into WSOMI'}
      </button>

    </div>
  );
}
