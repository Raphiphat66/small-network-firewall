import React, { useState, useEffect } from 'react';

const API_URL = 'http://127.0.0.1:8000';

function Logs() {
  const [attacks, setAttacks] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchAttacks();
    const interval = setInterval(fetchAttacks, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAttacks = async () => {
    try {
      const res = await fetch(`${API_URL}/attacks`);
      setAttacks(await res.json());
    } catch (e) { console.error(e); }
  };

  const filtered = attacks.filter(a =>
    a.source_ip.includes(filter) || a.attack_type.includes(filter)
  );

  const getBadgeStyle = (type) => {
    const t = type?.replace('[WARNING] ', '').replace('[BLOCK] ', '');
    if (t === 'Port Scan')  return { bg: 'var(--bg-accent)',   color: 'var(--text-accent)' };
    if (t === 'SYN Flood')  return { bg: 'var(--bg-danger)',   color: 'var(--text-danger)' };
    if (t === 'UDP Flood')  return { bg: 'var(--bg-warning)',  color: 'var(--text-warning)' };
    if (t === 'ICMP Flood') return { bg: 'var(--bg-warning)',  color: 'var(--text-warning)' };
    return { bg: 'var(--bg-success)', color: 'var(--text-success)' };
  };

  return (
    <div>
      <h2 style={{ color: 'var(--text-primary)', fontSize: '20px', marginBottom: '20px' }}>
         ประวัติการโจมตี
      </h2>

      <input
        type="text"
        placeholder=" ค้นหาด้วย IP หรือประเภทการโจมตี..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px', marginBottom: '20px',
          backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)',
          borderRadius: '8px', color: 'var(--text-primary)',
          fontSize: '14px', boxSizing: 'border-box', outline: 'none'
        }}
      />

      <div style={{
        backgroundColor: 'var(--surface-1)', borderRadius: '10px', padding: '20px',
        border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--table-head)' }}>
              {['#','Source IP','ประเภทการโจมตี','Packets/sec','เวลา'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => {
              const badge = getBadgeStyle(a.attack_type);
              const cleanType = a.attack_type?.replace('[WARNING] ', '').replace('[BLOCK] ', '');
              return (
                <tr key={i} style={{
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: i % 2 === 0 ? 'var(--surface-1)' : 'var(--table-row-alt)'
                }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{a.id}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: '500' }}>{a.source_ip}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ backgroundColor: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: '500' }}>
                      {cleanType}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{a.packetpersec}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{a.timestamp}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>ไม่พบข้อมูล</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Logs;