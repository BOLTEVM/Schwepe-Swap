import React from 'react';
import { Waves, Wallet, ExternalLink, Zap } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, network, setNetwork, walletAddress, setWalletAddress }) {
  const handleConnectWallet = () => {
    if (!walletAddress) {
      setWalletAddress('0xdd10620866c4f586b1213d3818811faf3718fce3'); // Somnia $SOMI Address target
    } else {
      setWalletAddress('');
    }
  };

  return (
    <header className="glass-panel" style={{ margin: '16px 24px', padding: '16px 24px', borderRadius: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src="/schwemes/schwepelogov1.jpg"
            alt="Schwepe Logo"
            style={{ width: '42px', height: '42px', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(236, 72, 153, 0.6)', boxShadow: '0 0 16px rgba(147, 51, 234, 0.4)' }}
          />
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(90deg, #fff, #a855f7, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              SchwepeSwap
            </h1>
            <span className="badge-somnia">
              <span className="pulse-dot"></span> Somnia EVM ({network === 'mainnet' ? '5031' : '50312'})
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.6)', padding: '6px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {['swap', 'liquidity', 'farms', 'pipeline'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? 'linear-gradient(135deg, #9333ea, #06b6d4)' : 'transparent',
                color: activeTab === tab ? '#ffffff' : '#94a3b8',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '10px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s ease'
              }}
            >
              {tab === 'pipeline' ? '⚡ Web3 Pipeline' : tab}
            </button>
          ))}
        </nav>

        {/* Action Controls & Network Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* Somnia Explorer Link */}
          <a
            href="https://explorer.somnia.network/address/0xdd10620866c4f586b1213d3818811faf3718fce3"
            target="_blank"
            rel="noreferrer"
            style={{
              color: '#94a3b8',
              textDecoration: 'none',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 12px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.05)'
            }}
          >
            SOMI Contract <ExternalLink size={14} />
          </a>

          {/* Network Selector */}
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            style={{
              background: '#0f172a',
              color: '#38bdf8',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              padding: '8px 12px',
              borderRadius: '10px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="mainnet">Somnia Mainnet (5031)</option>
            <option value="testnet">Somnia Testnet (50312)</option>
          </select>

          {/* Wallet Connect Button */}
          <button onClick={handleConnectWallet} className="btn-gradient" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            <Wallet size={16} />
            {walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}` : 'Connect Wallet'}
          </button>
        </div>

      </div>
    </header>
  );
}
