import React, { useState } from 'react';
import { ArrowDownUp, Settings, Info, RefreshCw } from 'lucide-react';
import { DEFAULT_TOKENS } from '../../../sdk/src/constants';

export default function SwapCard({ walletAddress, onRunPipeline }) {
  const [tokenIn, setTokenIn] = useState(DEFAULT_TOKENS[0]); // SOMI (0xdd10620866c4f586b1213d3818811faf3718fce3)
  const [tokenOut, setTokenOut] = useState(DEFAULT_TOKENS[3] || DEFAULT_TOKENS[2]); // SCHWEPE
  const [amountIn, setAmountIn] = useState('100');
  const [slippage, setSlippage] = useState(0.5);
  const [amountOut, setAmountOut] = useState('0.0000');
  const [exchangeRate, setExchangeRate] = useState('2.485');

  React.useEffect(() => {
    async function updateQuote() {
      const val = parseFloat(amountIn || '0');
      if (val <= 0) {
        setAmountOut('0.0000');
        setExchangeRate('0.0000');
        return;
      }

      const rpcUrl = 'https://api.infra.mainnet.somnia.network/';
      const factory = '0xafd71143fb155058e96527b07695d93223747ed1';
      const wsomi = '0x046ede9564a72571df6f5e44d0405360c0f4dcab';
      const somiToken = '0xdd10620866c4f586b1213d3818811faf3718fce3';

      const addrIn = (tokenIn.address.toLowerCase() === somiToken || tokenIn.isNative) ? wsomi : tokenIn.address;
      const addrOut = (tokenOut.address.toLowerCase() === somiToken || tokenOut.isNative) ? wsomi : tokenOut.address;

      if (addrIn.toLowerCase() === addrOut.toLowerCase()) {
        setAmountOut(val.toFixed(4));
        setExchangeRate('1.0000');
        return;
      }

      try {
        const getPairData = '0xe6a43905' + 
          addrIn.substring(2).toLowerCase().padStart(64, '0') + 
          addrOut.substring(2).toLowerCase().padStart(64, '0');

        const pairRes = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: 2, method: 'eth_call',
            params: [{ to: factory, data: getPairData }, 'latest']
          })
        });
        const pairJson = await pairRes.json();
        if (pairJson.result && pairJson.result !== '0x' && pairJson.result !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
          const pairAddress = '0x' + pairJson.result.substring(pairJson.result.length - 40).toLowerCase();

          const reservesRes = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0', id: 3, method: 'eth_call',
              params: [{ to: pairAddress, data: '0x0902f1fe' }, 'latest']
            })
          });
          const reservesJson = await reservesRes.json();
          if (reservesJson.result && reservesJson.result.length >= 130) {
            const r0 = BigInt('0x' + reservesJson.result.substring(2, 66));
            const r1 = BigInt('0x' + reservesJson.result.substring(66, 130));
            const isSorted = addrIn.toLowerCase() < addrOut.toLowerCase();
            const reserveIn = isSorted ? r0 : r1;
            const reserveOut = isSorted ? r1 : r0;

            const amountInWei = BigInt(Math.floor(val * 1e18));
            const amountInWithFee = amountInWei * 997n;
            const numerator = amountInWithFee * reserveOut;
            const denominator = (reserveIn * 1000n) + amountInWithFee;
            if (denominator !== 0n) {
              const outWei = numerator / denominator;
              setAmountOut((Number(outWei) / 1e18).toFixed(4));
              setExchangeRate((Number(outWei) / Number(amountInWei)).toFixed(4));
              return;
            }
          }
        }
      } catch (e) {
        console.error('Error in SwapCard quote fetch:', e);
      }

      // Fallback calculations based on mock symbols if RPC call fails or pair doesn't exist
      const mockRates = {
        'SOMI-SCHWEPE': 2.4852,
        'SCHWEPE-SOMI': 0.4024,
        'SOMI-WSOMI': 1.0000,
        'WSOMI-SOMI': 1.0000,
        'SOMI-USDT': 4.5800,
        'SCHWEPE-USDC': 0.8901
      };
      const key = `${tokenIn.symbol}-${tokenOut.symbol}`;
      const rate = mockRates[key] || 2.4852;
      setAmountOut((val * rate).toFixed(4));
      setExchangeRate(rate.toFixed(4));
    }

    updateQuote();
  }, [tokenIn, tokenOut, amountIn]);

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
          <span>1 {tokenIn.symbol} ≈ {exchangeRate} {tokenOut.symbol}</span>
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
      <button onClick={handleSwapClick} className="btn-gradient" style={{ width: '100%', fontSize: '1.1rem', padding: '14px' }}>
        {walletAddress ? 'Swap' : 'Connect Wallet'}
      </button>

    </div>
  );
}
