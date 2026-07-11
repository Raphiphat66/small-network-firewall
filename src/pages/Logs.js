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
      const data = await res.json();
      setAttacks(data);
    } catch (error) {
      console.error('Error fetching attacks:', error);
    }
  };

  const filtered = attacks.filter(a =>
    a.source_ip.includes(filter) ||
    a.attack_type.includes(filter)
  );

  const getBadgeStyle = (type) => {
    if (type === 'Port Scan')  return { backgroundColor: '#dbeafe', color: '#1d4ed8' };
    if (type === 'SYN Flood')  return { backgroundColor: '#fee2e2', color: '#dc2626' };
    if (type === 'UDP Flood')  return { backgroundColor: '#fef3c7', color: '#b45309' };
    if (type === 'ICMP Flood') return { backgroundColor: '#ffedd5', color: '#c2410c' };
    return { backgroundColor: '#dcfce7', color: '#16a34a' };
  };

  return (
    <div>
      <h2 style={{ color: '#111827', fontSize: '20px', marginBottom: '20px' }}>
        📋 ประวัติการโจมตี
      </h2>

      {/* Search */}
      <input
        type="text"
        placeholder="🔍 ค้นหาด้วย IP หรือประเภทการโจมตี..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 14px',
          marginBottom: '20px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          color: '#111827',
          fontSize: '14px',
          boxSizing: 'border-box',
          outline: 'none'
        }}
      />

      {/* Table */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        padding: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>#</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>Source IP</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>ประเภทการโจมตี</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>Packets/sec</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>เวลา</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => (
              <tr key={i} style={{
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc'
              }}>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{a.id}</td>
                <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '500' }}>{a.source_ip}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    ...getBadgeStyle(a.attack_type),
                    padding: '3px 10px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    {a.attack_type}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#374151' }}>{a.packetpersec}</td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{a.timestamp}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#9ca3af' }}>
                  ไม่พบข้อมูล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Logs;