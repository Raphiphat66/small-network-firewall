import React, { useState, useEffect } from 'react';

const API_URL = 'http://127.0.0.1:8000';

const SUGGESTED_BLOCKS = [
  { category: " เว็บพนัน", sites: ["bet911.com", "gclub.com", "ufabet.com", "vegus168.com"] },
  { category: " เว็บโป๊", sites: ["pornhub.com", "xvideos.com", "xnxx.com"] },
  { category: " เว็บอันตราย", sites: ["malware.com", "phishing.com"] }
];

function WebsiteBlock() {
  const [blockedSites, setBlockedSites] = useState([]);
  const [domain, setDomain] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchBlockedSites(); }, []);

  const fetchBlockedSites = async () => {
    try { setBlockedSites(await (await fetch(`${API_URL}/website-blocks`)).json()); }
    catch (e) { console.error(e); }
  };

  const handleBlock = async (site, r = '') => {
    setLoading(true);
    try {
      const data = await (await fetch(`${API_URL}/website-blocks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: site, reason: r || reason })
      })).json();
      alert(data.message || data.error);
      fetchBlockedSites(); setDomain(''); setReason('');
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleUnblock = async (id, domain) => {
    if (!window.confirm(`ต้องการปลดบล็อก ${domain} ไหม?`)) return;
    try {
      const data = await (await fetch(`${API_URL}/website-blocks/${id}`, { method: 'DELETE' })).json();
      alert(data.message || data.error); fetchBlockedSites();
    } catch (e) { console.error(e); }
  };

  const inputStyle = {
    backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)',
    borderRadius: '8px', color: 'var(--text-primary)',
    padding: '8px 12px', fontSize: '14px', outline: 'none'
  };

  const section = {
    backgroundColor: 'var(--surface-1)', borderRadius: '10px', padding: '20px',
    marginBottom: '20px', border: '1px solid var(--border)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
  };

  return (
    <div>
      <h2 style={{ color: 'var(--text-primary)', fontSize: '20px', marginBottom: '20px' }}>🚫 บล็อกเว็บไซต์</h2>

      <div style={section}>
        <h3 style={{ color: 'var(--text-danger)', fontSize: '16px', marginBottom: '16px' }}>บล็อกเว็บไซต์ด้วยตนเอง</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input placeholder="ชื่อเว็บ เช่น facebook.com" value={domain} onChange={e => setDomain(e.target.value)} style={{ ...inputStyle, width: '250px' }} />
          <input placeholder="เหตุผล" value={reason} onChange={e => setReason(e.target.value)} style={{ ...inputStyle, width: '200px' }} />
          <button onClick={() => handleBlock(domain)} disabled={loading} style={{
            backgroundColor: loading ? 'var(--text-muted)' : 'var(--fill-danger)',
            color: 'white', border: 'none', padding: '8px 20px',
            borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px', fontWeight: '500'
          }}>{loading ? 'กำลังบล็อก...' : 'บล็อก'}</button>
        </div>
      </div>

      <div style={section}>
        <h3 style={{ color: 'var(--text-warning)', fontSize: '16px', marginBottom: '16px' }}> บล็อกด่วน</h3>
        {SUGGESTED_BLOCKS.map((cat, i) => (
          <div key={i} style={{ marginBottom: '16px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>{cat.category}</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {cat.sites.map((site, j) => (
                <button key={j} onClick={() => handleBlock(site, cat.category)} style={{
                  backgroundColor: 'var(--surface-0)', color: 'var(--text-secondary)',
                  border: '1px solid var(--border-strong)', padding: '5px 14px',
                  borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500'
                }}>{site}</button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={section}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '16px', marginBottom: '16px' }}>เว็บที่บล็อกอยู่</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--table-head)' }}>
              {['#','เว็บไซต์','IP','จัดการ'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {blockedSites.map((site, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)', backgroundColor: i % 2 === 0 ? 'var(--surface-1)' : 'var(--table-row-alt)' }}>
                <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{site.id}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ backgroundColor: 'var(--bg-danger)', color: 'var(--text-danger)', padding: '3px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: '500' }}>🚫 {site.domain}</span>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{site.ip}</td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => handleUnblock(site.id, site.domain)} style={{ backgroundColor: 'var(--fill-success)', color: 'white', border: 'none', padding: '5px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>ปลดบล็อก</button>
                </td>
              </tr>
            ))}
            {blockedSites.length === 0 && (
              <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>ไม่มีเว็บที่บล็อก</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WebsiteBlock;