import React, { useState, useEffect } from 'react';

const API_URL = 'http://127.0.0.1:8000';

function Logs() {
  const [attacks, setAttacks] = useState([]);
  const [filter, setFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

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

  const filtered = attacks.filter(a => {
    const matchSearch = a.source_ip.includes(filter) || a.attack_type.includes(filter);
    const matchDate = selectedDate
      ? new Date(a.timestamp + '+07:00').toLocaleDateString('sv-SE') === selectedDate
      : true;
    return matchSearch && matchDate;
  });

  const warnCount  = filtered.filter(a => a.attack_type?.includes('[WARNING]')).length;
  const blockCount = filtered.filter(a => a.attack_type?.includes('[BLOCK]')).length;

  const getBadgeStyle = (type) => {
    const t = type?.replace('[WARNING] ', '').replace('[BLOCK] ', '');
    if (t === 'Port Scan')  return { bg: 'var(--bg-accent)',   color: 'var(--text-accent)' };
    if (t === 'SYN Flood')  return { bg: 'var(--bg-danger)',   color: 'var(--text-danger)' };
    if (t === 'UDP Flood')  return { bg: 'var(--bg-warning)',  color: 'var(--text-warning)' };
    if (t === 'ICMP Flood') return { bg: 'var(--bg-warning)',  color: 'var(--text-warning)' };
    return { bg: 'var(--bg-success)', color: 'var(--text-success)' };
  };

  // แสดงค่าและหน่วยตามประเภทการโจมตี
  const getValueLabel = (type, value) => {
    const t = type?.replace('[WARNING] ', '').replace('[BLOCK] ', '');
    if (t === 'Port Scan')  return `${value} ports`;
    if (t === 'Brute Force') return `${value} attempts`;
    return `${value} pkt/s`;
  };

  return (
    <div>
      <h2 style={{ color: 'var(--text-primary)', fontSize: '20px', marginBottom: '20px' }}>
        ประวัติการโจมตี
      </h2>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder=" ค้นหาด้วย IP หรือประเภทการโจมตี..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{
            flex: 1, padding: '10px 14px',
            backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)',
            borderRadius: '8px', color: 'var(--text-primary)',
            fontSize: '14px', boxSizing: 'border-box', outline: 'none'
          }}
        />
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)',
            borderRadius: '8px', color: 'var(--text-primary)',
            fontSize: '14px', outline: 'none', cursor: 'pointer'
          }}
        />
        {selectedDate && (
          <button
            onClick={() => setSelectedDate('')}
            style={{
              padding: '10px 14px', borderRadius: '8px',
              border: '1px solid var(--input-border)',
              backgroundColor: 'var(--input-bg)', color: 'var(--text-muted)',
              fontSize: '13px', cursor: 'pointer'
            }}
          >
            ล้าง
          </button>
        )}
      </div>

      {selectedDate && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            padding: '10px 16px', borderRadius: '8px',
            background: 'var(--surface-1)', border: '0.5px solid var(--border)',
            fontSize: '13px', color: 'var(--text-secondary)'
          }}>
            พบทั้งหมด <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> รายการ
          </div>
          <div style={{
            padding: '10px 16px', borderRadius: '8px',
            background: 'var(--bg-warning)', border: '0.5px solid var(--border)',
            fontSize: '13px', color: 'var(--text-warning)'
          }}>
            WARNING <strong>{warnCount}</strong>
          </div>
          <div style={{
            padding: '10px 16px', borderRadius: '8px',
            background: 'var(--bg-danger)', border: '0.5px solid var(--border)',
            fontSize: '13px', color: 'var(--text-danger)'
          }}>
            BLOCK <strong>{blockCount}</strong>
          </div>
        </div>
      )}

      <div style={{
        backgroundColor: 'var(--surface-1)', borderRadius: '10px', padding: '20px',
        border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--table-head)' }}>
              {['#', 'Source IP', 'ประเภทการโจมตี', 'ค่าที่ตรวจจับได้', 'เวลา'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => {
              const badge = getBadgeStyle(a.attack_type);
              const cleanType = a.attack_type?.replace('[WARNING] ', '').replace('[BLOCK] ', '');
              const level = a.attack_type?.includes('[WARNING]') ? 'WARN' : 'BLOCK';
              return (
                <tr key={i} style={{
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: i % 2 === 0 ? 'var(--surface-1)' : 'var(--table-row-alt)'
                }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{a.id}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: '500' }}>{a.source_ip}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '10px', padding: '1px 5px', borderRadius: '3px', fontWeight: 600,
                        background: level === 'WARN' ? 'var(--bg-warning)' : 'var(--bg-danger)',
                        color: level === 'WARN' ? 'var(--text-warning)' : 'var(--text-danger)'
                      }}>{level}</span>
                      <span style={{ backgroundColor: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: '500' }}>
                        {cleanType}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {getValueLabel(a.attack_type, a.packetpersec)}
                  </td>
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