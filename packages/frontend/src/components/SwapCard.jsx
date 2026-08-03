import React, { useState } from 'react';
import { ArrowDownUp, Settings, Info, RefreshCw } from 'lucide-react';
import { DEFAULT_TOKENS } from '../../../sdk/src/constants';

export default function SwapCard({ walletAddress, onRunPipeline }) {
  const [tokenIn, setTokenIn] = useState(DEFAULT_TOKENS[0]); // SOMI (0xdd10620866c4f586b1213d3818811faf3718fce3)
  const [tokenOut, setTokenOut] = useState(DEFAULT_TOKENS[2]); // SCHWEPE
  const [amountIn, setAmountIn] = useState('100');
  const [slippage, setSlippage] = useState(0.5);

  const amountOut = (parseFloat(amountIn || '0') * 2.485).toFixed(4);

  const handleSwitchTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
  };

  const handleSwapClick = () => {
    if (onRunPipeline) {
      onRunPipeline({
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        amountIn: amountIn,
        slippageBps: slippage * 100
      });
    }
  };

  return (
    <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', margin: '30px auto', padding: '24px' }}>
      
      {/* Swap Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Swap Tokens</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <RefreshCw size={18} />
          </button>
          <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Pay Input Box */}
      <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: '#94a3b8' }}>
          <span>You Pay</span>
          <span>Balance: 1,500.00 {tokenIn.symbol}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <input
            type="number"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            placeholder="0.0"
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '1.8rem',
              fontWeight: 700,
              width: '60%',
              outline: 'none'
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '12px' }}>
            <img src={tokenIn.logoURI} alt={tokenIn.symbol} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
            <span style={{ fontWeight: 700 }}>{tokenIn.symbol}</span>
          </div>
        </div>
      </div>

      {/* Switch Arrow Button */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '-14px 0', zIndex: 10, position: 'relative' }}>
        <button
          onClick={handleSwitchTokens}
          style={{
            background: '#1e293b',
            border: '2px solid rgba(147, 51, 234, 0.5)',
            color: '#a855f7',
            padding: '8px',
            borderRadius: '50%',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }}
        >
          <ArrowDownUp size={18} />
        </button>
      </div>

      {/* Receive Input Box */}
      <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', marginTop: '8px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: '#94a3b8' }}>
          <span>You Receive (Estimated)</span>
          <span>Balance: 0.00 {tokenOut.symbol}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <input
            type="text"
            readOnly
            value={amountOut}
            placeholder="0.0"
            style={{
              background: 'none',
              border: 'none',
              color: '#38bdf8',
              fontSize: '1.8rem',
              fontWeight: 700,
              width: '60%',
              outline: 'none'
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '12px' }}>
            <img src={tokenOut.logoURI} alt={tokenOut.symbol} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
            <span style={{ fontWeight: 700 }}>{tokenOut.symbol}</span>
          </div>
        </div>
      </div>

      {/* Trade Details Panel */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '6px' }}>
          <span>Rate</span>
          <span>1 {tokenIn.symbol} ≈ 2.485 {tokenOut.symbol}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '6px' }}>
          <span>Slippage Tolerance</span>
          <span>{slippage}%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
          <span>Network Fee (Somnia EVM)</span>
          <span style={{ color: '#22c55e' }}>~0.0001 SOMI (&lt;$0.001)</span>
        </div>
      </div>

      {/* Swap Action Button */}
      <button onClick={handleSwapClick} className="btn-gradient" style={{ width: '100%', fontSize: '1rem' }}>
        {walletAddress ? 'Execute Swap via Web3 Pipeline' : 'Connect Wallet to Swap'}
      </button>

    </div>
  );
}
