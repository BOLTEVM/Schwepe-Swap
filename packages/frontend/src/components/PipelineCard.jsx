import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, ExternalLink, Play } from 'lucide-react';

export default function PipelineCard({ pipelineLogs, isRunning, onTriggerPipeline }) {
  return (
    <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', margin: '30px auto', padding: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚡ Somnia Web3 Async Pipeline
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Sequential <code style={{ color: '#a855f7' }}>await</code> execution pipeline connecting Thirdweb SDK &amp; SchwepeRouter
          </p>
        </div>
        <button
          onClick={onTriggerPipeline}
          disabled={isRunning}
          className="btn-gradient"
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <Play size={14} /> {isRunning ? 'Running Pipeline...' : 'Run Pipeline'}
        </button>
      </div>

      {/* Stage Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {pipelineLogs.length === 0 ? (
          <div style={{ padding: '30px', textAlignment: 'center', color: '#64748b', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '14px' }}>
            Click <strong>"Run Pipeline"</strong> or execute a swap to observe the asynchronous Web3 pipeline in real-time.
          </div>
        ) : (
          pipelineLogs.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid ' + (item.status === 'SUCCESS' ? 'rgba(34, 197, 94, 0.3)' : item.status === 'FAILED' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(147, 51, 234, 0.3)'),
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}
            >
              <div>
                {item.status === 'SUCCESS' && <CheckCircle2 color="#22c55e" size={20} />}
                {item.status === 'PENDING' && <Clock color="#a855f7" size={20} className="pulse" />}
                {item.status === 'FAILED' && <AlertTriangle color="#ef4444" size={20} />}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>{item.stage}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{item.message}</p>
                
                {item.data?.explorerUrl && (
                  <a
                    href={item.data.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#38bdf8', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}
                  >
                    View on Somnia Explorer <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
