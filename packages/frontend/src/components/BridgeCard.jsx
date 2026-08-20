import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Loader2, ExternalLink, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';
import { BRIDGE_CHAINS, BRIDGE_CHAIN_LIST, BRIDGE_HOME_CHAIN_ID } from '../../../sdk/src/constants';
import {
  OFT_ABI,
  ERC20_ABI,
  buildSendParam,
  toBytes32,
  extractGuid
} from '../../../sdk/src/bridge';

const INDEXER_URL = import.meta.env.VITE_INDEXER_URL || 'http://localhost:4000';
const CHAIN_LIST = BRIDGE_CHAIN_LIST;

const fmt = (wei, digits = 4) => {
  try {
    return Number(ethers.formatEther(wei)).toLocaleString(undefined, {
      maximumFractionDigits: digits
    });
  } catch {
    return '0';
  }
};

export default function BridgeCard({ walletAddress }) {
  const [fromChainId, setFromChainId] = useState(BRIDGE_HOME_CHAIN_ID);
  const [toChainId, setToChainId] = useState(42161);
  const [amount, setAmount] = useState('1000');
  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [mesh, setMesh] = useState(null);

  const fromChain = BRIDGE_CHAINS[fromChainId];
  const toChain = BRIDGE_CHAINS[toChainId];
  const deployed = Boolean(fromChain?.bridge && toChain?.bridge);

  // Keep source and destination distinct.
  useEffect(() => {
    if (fromChainId === toChainId) {
      const next = CHAIN_LIST.find((c) => c.chainId !== fromChainId);
      if (next) setToChainId(next.chainId);
    }
  }, [fromChainId, toChainId]);

  // Mesh status and this wallet's transfer history come from the indexer.
  const refreshStatus = useCallback(async () => {
    try {
      const [statusRes, transfersRes] = await Promise.all([
        fetch(`${INDEXER_URL}/api/bridge/status`),
        walletAddress
          ? fetch(`${INDEXER_URL}/api/bridge/transfers?address=${walletAddress}&limit=10`)
          : Promise.resolve(null)
      ]);
      if (statusRes.ok) setMesh(await statusRes.json());
      if (transfersRes?.ok) setTransfers(await transfersRes.json());
    } catch {
      // Indexer being unreachable must not break the send path.
      setMesh(null);
    }
  }, [walletAddress]);

  useEffect(() => {
    refreshStatus();
    const timer = setInterval(refreshStatus, 15000);
    return () => clearInterval(timer);
  }, [refreshStatus]);

  // Quote the LayerZero delivery fee and the exact amount that will land.
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setError(null);
      const value = parseFloat(amount || '0');
      if (!deployed || value <= 0 || !walletAddress) {
        setQuote(null);
        return;
      }

      setQuoting(true);
      try {
        const provider = new ethers.JsonRpcProvider(fromChain.rpc, fromChain.chainId, {
          staticNetwork: true
        });
        const oft = new ethers.Contract(fromChain.bridge, OFT_ABI, provider);
        const amountWei = ethers.parseEther(amount);
        const sendParam = buildSendParam(
          { from: fromChainId, to: toChainId },
          walletAddress,
          amountWei
        );

        const [[, , receipt], fee, [, canBeSent]] = await Promise.all([
          oft.quoteOFT(sendParam),
          oft.quoteSend(sendParam, false),
          oft.getAmountCanBeSent(toChain.eid)
        ]);

        if (cancelled) return;
        setQuote({
          nativeFee: fee.nativeFee,
          amountSent: receipt.amountSentLD,
          amountReceived: receipt.amountReceivedLD,
          dust: amountWei - receipt.amountSentLD,
          canBeSent
        });
      } catch (err) {
        if (!cancelled) {
          setQuote(null);
          setError(err.shortMessage || err.message);
        }
      } finally {
        if (!cancelled) setQuoting(false);
      }
    }

    const debounce = setTimeout(run, 400);
    return () => {
      cancelled = true;
      clearTimeout(debounce);
    };
  }, [amount, fromChainId, toChainId, walletAddress, deployed, fromChain, toChain]);

  async function handleBridge() {
    if (!window.ethereum || !walletAddress || !quote) return;
    setSending(true);
    setError(null);

    try {
      // Make sure the wallet is on the source chain before signing.
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x' + fromChain.chainId.toString(16) }]
      });

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await browserProvider.getSigner();
      const amountWei = ethers.parseEther(amount);

      // Only the home vault pulls a separate ERC-20; spoke mirrors are the token themselves.
      if (fromChainId === BRIDGE_HOME_CHAIN_ID) {
        const token = new ethers.Contract(fromChain.token, ERC20_ABI, signer);
        const allowance = await token.allowance(walletAddress, fromChain.bridge);
        if (allowance < amountWei) {
          const approveTx = await token.approve(fromChain.bridge, amountWei);
          await approveTx.wait();
        }
      }

      const oft = new ethers.Contract(fromChain.bridge, OFT_ABI, signer);
      const sendParam = buildSendParam({ from: fromChainId, to: toChainId }, walletAddress, amountWei);
      const fee = { nativeFee: quote.nativeFee, lzTokenFee: 0n };

      const tx = await oft.send(sendParam, fee, walletAddress, { value: quote.nativeFee });
      const receipt = await tx.wait();
      const guid = extractGuid(receipt);

      setTransfers((prev) => [
        {
          guid,
          status: 'in_transit',
          sentTx: tx.hash,
          amountSent: amountWei.toString(),
          from: { name: fromChain.name },
          to: { name: toChain.name },
          sentAt: Date.now()
        },
        ...prev
      ]);
      setTimeout(refreshStatus, 3000);
    } catch (err) {
      setError(err.shortMessage || err.message || 'Bridge transfer failed');
    } finally {
      setSending(false);
    }
  }

  const backing = mesh?.backing;
  const overLimit = quote && quote.canBeSent < quote.amountSent;

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Omnifungible Bridge</h2>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '2px' }}>
              Move SCHWEPE across chains via LayerZero
            </p>
          </div>
          <button
            onClick={refreshStatus}
            title="Refresh bridge status"
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {!deployed && (
          <div
            style={{
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '16px',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start'
            }}
          >
            <AlertTriangle size={16} color="#eab308" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ color: '#fde68a', fontSize: '0.82rem' }}>
              Bridge contracts are not deployed on this route yet. Quotes and transfers stay disabled
              until the vault and mirror addresses are configured.
            </span>
          </div>
        )}

        {/* Route selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'center' }}>
          <ChainSelect label="From" value={fromChainId} onChange={setFromChainId} />
          <ArrowRight size={18} color="#64748b" style={{ marginTop: '18px' }} />
          <ChainSelect
            label="To"
            value={toChainId}
            onChange={setToChainId}
            exclude={fromChainId}
          />
        </div>

        {/* Amount */}
        <div style={{ marginTop: '16px' }}>
          <label style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}>Amount</label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              padding: '14px 16px',
              marginTop: '6px'
            }}
          >
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: '1.35rem',
                fontWeight: 600
              }}
            />
            <span style={{ color: '#94a3b8', fontWeight: 700 }}>SCHWEPE</span>
          </div>
        </div>

        {/* Quote */}
        {quoting && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.82rem', marginTop: '14px' }}>
            <Loader2 size={14} className="spin" /> Quoting delivery fee…
          </div>
        )}

        {quote && !quoting && (
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
            <Row label="You receive" value={`${fmt(quote.amountReceived)} SCHWEPE`} strong />
            <Row
              label="LayerZero fee"
              value={`${fmt(quote.nativeFee, 6)} ${fromChain.nativeCurrency.symbol}`}
            />
            {quote.dust > 0n && (
              <Row label="Rounded off" value={`${fmt(quote.dust, 8)} SCHWEPE`} muted />
            )}
            <Row
              label="Route capacity left"
              value={`${fmt(quote.canBeSent, 0)} SCHWEPE`}
              muted={!overLimit}
              warn={overLimit}
            />
          </div>
        )}

        {overLimit && (
          <p style={{ color: '#f59e0b', fontSize: '0.8rem', marginTop: '10px' }}>
            This transfer exceeds the current rate limit for {toChain.name}. Capacity refills
            continuously — try a smaller amount or wait.
          </p>
        )}

        {error && (
          <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '10px', wordBreak: 'break-word' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleBridge}
          disabled={!walletAddress || !quote || sending || overLimit || !deployed}
          style={{
            width: '100%',
            marginTop: '18px',
            padding: '15px',
            borderRadius: '14px',
            border: 'none',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: !walletAddress || !quote || sending || overLimit ? 'not-allowed' : 'pointer',
            opacity: !walletAddress || !quote || sending || overLimit ? 0.5 : 1,
            background: 'linear-gradient(135deg, #9333ea, #06b6d4)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {sending ? (
            <>
              <Loader2 size={16} className="spin" /> Bridging…
            </>
          ) : !walletAddress ? (
            'Connect wallet'
          ) : (
            `Bridge to ${toChain.name}`
          )}
        </button>
      </div>

      {/* Backing / solvency */}
      {backing?.locked != null && (
        <div
          className="glass-panel"
          style={{
            padding: '14px 18px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          {backing.solvent ? (
            <ShieldCheck size={16} color="#34d399" style={{ flexShrink: 0 }} />
          ) : (
            <AlertTriangle size={16} color="#f87171" style={{ flexShrink: 0 }} />
          )}
          <span style={{ fontSize: '0.8rem', color: backing.solvent ? '#94a3b8' : '#f87171' }}>
            {backing.solvent
              ? `${fmt(backing.locked, 0)} SCHWEPE locked on Somnia backs ${fmt(backing.minted, 0)} bridged`
              : `Backing shortfall of ${fmt(backing.shortfall, 0)} SCHWEPE — bridging is unsafe`}
          </span>
        </div>
      )}

      {/* Transfer tracker */}
      {transfers.length > 0 && (
        <div className="glass-panel" style={{ padding: '18px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
            Recent transfers
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {transfers.map((t) => (
              <TransferRow key={t.guid || t.sentTx} transfer={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChainSelect({ label, value, onChange, exclude }) {
  return (
    <div>
      <label style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          marginTop: '6px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '12px 14px',
          color: '#fff',
          fontWeight: 600,
          outline: 'none',
          cursor: 'pointer'
        }}
      >
        {CHAIN_LIST.filter((c) => c.chainId !== exclude).map((c) => (
          <option key={c.chainId} value={c.chainId} style={{ background: '#0f172a' }}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function Row({ label, value, strong, muted, warn }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span
        style={{
          color: warn ? '#f59e0b' : muted ? '#94a3b8' : '#fff',
          fontWeight: strong ? 700 : 500
        }}
      >
        {value}
      </span>
    </div>
  );
}

function TransferRow({ transfer }) {
  const tone = {
    delivered: { color: '#34d399', label: 'Delivered' },
    in_transit: { color: '#38bdf8', label: 'In transit' },
    stuck: { color: '#f87171', label: 'Stuck' }
  }[transfer.status] || { color: '#94a3b8', label: transfer.status };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.5)',
        borderRadius: '10px',
        padding: '10px 12px',
        fontSize: '0.8rem'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ color: '#fff', fontWeight: 600 }}>
          {fmt(transfer.amountSent || '0')} SCHWEPE
        </span>
        <span style={{ color: '#64748b' }}>
          {transfer.from?.name || '—'} → {transfer.to?.name || '—'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: tone.color, fontWeight: 600 }}>{tone.label}</span>
        {transfer.guid && (
          <a
            href={`https://layerzeroscan.com/tx/${transfer.sentTx}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: '#38bdf8', display: 'flex' }}
            title="View on LayerZero Scan"
          >
            <ExternalLink size={13} />
          </a>
        )}
      </div>
    </div>
  );
}
