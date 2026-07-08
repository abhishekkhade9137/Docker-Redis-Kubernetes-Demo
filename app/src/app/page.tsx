'use client';

import { useState, useEffect, useCallback } from 'react';

interface CacheResult {
  source: 'cache' | 'database';
  key: string;
  value: string;
  latencyMs: number;
  ttl: number;
}

interface Stats {
  visits: number;
  cachedKeys: number;
  keys: string[];
  redis: {
    version: string;
    uptimeSeconds: string;
    connectedClients: string;
    usedMemory: string;
    totalCommandsProcessed: string;
    keyspaceHits: string;
    keyspaceMisses: string;
  };
}

function Badge({ type }: { type: 'cache' | 'database' }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 14px',
        borderRadius: '999px',
        fontSize: '0.78rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        background: type === 'cache' ? '#ffffff' : 'transparent',
        color: type === 'cache' ? '#000000' : '#ffffff',
        border: `1px solid #ffffff`,
      }}
    >
      <span style={{ fontSize: '0.6rem' }}>{type === 'cache' ? '●' : '○'}</span>
      {type === 'cache' ? 'CACHE HIT' : 'DB MISS → CACHED'}
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '14px',
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    }}>
      <span style={{ fontSize: '0.72rem', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.1 }}>{value}</span>
      {sub && <span style={{ fontSize: '0.72rem', color: '#666666' }}>{sub}</span>}
    </div>
  );
}

export default function Home() {
  const [key, setKey] = useState('product:42');
  const [result, setResult] = useState<CacheResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<CacheResult[]>([]);
  const [busting, setBusting] = useState(false);
  const [pulse, setPulse] = useState(false);

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/stats');
    if (res.ok) setStats(await res.json());
  }, []);

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, 5000);
    return () => clearInterval(id);
  }, [fetchStats]);

  const handleFetch = async () => {
    if (!key.trim()) return;
    setLoading(true);
    setPulse(false);
    try {
      const res = await fetch(`/api/cache?key=${encodeURIComponent(key)}`);
      const data: CacheResult = await res.json();
      setResult(data);
      setHistory((h) => [data, ...h].slice(0, 6));
      await fetchStats();
      setTimeout(() => setPulse(true), 50);
    } finally {
      setLoading(false);
    }
  };

  const handleBust = async () => {
    setBusting(true);
    await fetch(`/api/cache?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
    setResult(null);
    await fetchStats();
    setBusting(false);
  };

  const hitRate = stats
    ? (() => {
        const hits = parseInt(stats.redis.keyspaceHits) || 0;
        const misses = parseInt(stats.redis.keyspaceMisses) || 0;
        const total = hits + misses;
        return total > 0 ? ((hits / total) * 100).toFixed(1) : '—';
      })()
    : '—';

  return (
    <main style={{ minHeight: '100vh', background: '#000000', fontFamily: "'Inter', sans-serif", color: '#ffffff' }}>
      {/* Grid background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Glow blobs (subtle white) */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-120px', left: '-120px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['#ffffff', '#bbbbbb', '#777777'].map((c, i) => (
                <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />
              ))}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#888888', fontFamily: 'monospace', letterSpacing: '0.1em' }}>CLOUD-NATIVE DEMO</span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
            Redis · Docker · Kubernetes
          </h1>
          <p style={{ color: '#aaaaaa', marginTop: '8px', fontSize: '0.95rem' }}>
            Live cache hit/miss demo with real Redis metrics
          </p>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
          <StatCard label="Total Visits" value={stats?.visits ?? '—'} sub="Redis INCR" />
          <StatCard label="Cached Keys" value={stats?.cachedKeys ?? '—'} sub="Active in Redis" />
          <StatCard label="Hit Rate" value={hitRate === '—' ? '—' : `${hitRate}%`} sub="Hits / Total" />
          <StatCard label="Memory" value={stats?.redis.usedMemory ?? '—'} sub="Redis used" />
        </div>

        {/* Cache Demo */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '28px',
          marginBottom: '20px',
        }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 600, color: '#cccccc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Cache Lookup
          </h2>

          {/* Input row */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input
              id="cache-key-input"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
              placeholder="Cache key, e.g. user:1"
              style={{
                flex: 1, minWidth: '200px', padding: '12px 16px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px', color: '#ffffff', fontSize: '0.95rem',
                outline: 'none', fontFamily: 'monospace',
              }}
            />
            <button
              id="fetch-btn"
              onClick={handleFetch}
              disabled={loading}
              style={{
                padding: '12px 24px', borderRadius: '10px', border: '1px solid #ffffff',
                background: loading ? '#333333' : '#ffffff',
                color: loading ? '#aaaaaa' : '#000000', fontWeight: 700, fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', letterSpacing: '0.02em',
              }}
            >
              {loading ? 'Fetching…' : 'GET'}
            </button>
            <button
              id="bust-btn"
              onClick={handleBust}
              disabled={busting}
              style={{
                padding: '12px 20px', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'transparent', color: '#ffffff',
                fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {busting ? '…' : 'BUST'}
            </button>
          </div>

          {/* Preset keys */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {['product:42', 'user:7', 'session:abc', 'order:99'].map((k) => (
              <button
                key={k}
                onClick={() => setKey(k)}
                style={{
                  padding: '4px 12px', borderRadius: '6px', fontSize: '0.78rem',
                  background: key === k ? '#ffffff' : 'transparent',
                  border: `1px solid ${key === k ? '#ffffff' : 'rgba(255,255,255,0.2)'}`,
                  color: key === k ? '#000000' : '#aaaaaa', cursor: 'pointer', fontFamily: 'monospace',
                  transition: 'all 0.15s',
                }}
              >
                {k}
              </button>
            ))}
          </div>

          {/* Result card */}
          {result && (
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid rgba(255,255,255,0.2)`,
              borderRadius: '12px',
              padding: '20px',
              animation: pulse ? 'fadeIn 0.3s ease' : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <Badge type={result.source} />
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', color: '#aaaaaa' }}>
                  <span>⚡ {result.latencyMs}ms</span>
                  <span>⏱ TTL: {result.ttl}s</span>
                </div>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#888888', marginBottom: '6px' }}>key: <span style={{ color: '#ffffff' }}>{result.key}</span></div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#888888', wordBreak: 'break-all' }}>
                value: <span style={{ color: '#ffffff' }}>{result.value}</span>
              </div>
              {result.source === 'database' && (
                <div style={{ marginTop: '12px', fontSize: '0.78rem', color: '#888888', fontStyle: 'italic' }}>
                  ↑ Next request for this key will be a cache hit (30s TTL)
                </div>
              )}
            </div>
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '20px',
          }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '0.85rem', fontWeight: 600, color: '#cccccc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Request History
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {history.map((h, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                }}>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                    background: h.source === 'cache' ? '#ffffff' : 'transparent',
                    border: '1px solid #ffffff'
                  }} />
                  <span style={{ fontFamily: 'monospace', color: '#eeeeee', minWidth: '130px' }}>{h.key}</span>
                  <span style={{ color: '#ffffff', fontSize: '0.75rem', fontWeight: 700 }}>
                    {h.source === 'cache' ? 'HIT' : 'MISS'}
                  </span>
                  <span style={{ color: '#888888', marginLeft: 'auto' }}>{h.latencyMs}ms</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Redis Info */}
        {stats && (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '20px',
          }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '0.85rem', fontWeight: 600, color: '#cccccc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Redis Live Info
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
              {[
                ['Version', stats.redis.version],
                ['Uptime', `${Math.floor(parseInt(stats.redis.uptimeSeconds || '0') / 60)}m`],
                ['Clients', stats.redis.connectedClients],
                ['Commands', stats.redis.totalCommandsProcessed],
                ['Hits', stats.redis.keyspaceHits],
                ['Misses', stats.redis.keyspaceMisses],
              ].map(([label, val]) => (
                <div key={label} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>{label}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '1rem', color: '#ffffff', fontWeight: 600 }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Architecture callout */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
        }}>
          {[
            { icon: '🐳', title: 'Docker', desc: 'Multi-stage build, standalone output, minimal image size' },
            { icon: '☸️', title: 'Kubernetes', desc: 'HPA autoscaling, 3 replicas, Redis service, Ingress' },
            { icon: '⚡', title: 'Redis', desc: 'Cache layer, visit counter via INCR, 30s TTL' },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{
              padding: '18px', borderRadius: '14px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '8px', filter: 'grayscale(100%)' }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px', color: '#ffffff' }}>{title}</div>
              <div style={{ fontSize: '0.75rem', color: '#aaaaaa', lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', color: '#555555', fontSize: '0.75rem', marginTop: '40px' }}>
          Auto-refreshes every 5s · Visit counter stored in Redis
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        input:focus { border-color: #ffffff !important; box-shadow: 0 0 0 3px rgba(255,255,255,0.2); }
        button:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
      `}</style>
    </main>
  );
}
