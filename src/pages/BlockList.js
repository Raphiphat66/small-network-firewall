import React, { useState, useEffect } from 'react';

const API_URL = 'http://127.0.0.1:8000';

function BlockList() {
  const [blockList, setBlockList] = useState([]);

  useEffect(() => {
    fetchBlockList();
    const interval = setInterval(fetchBlockList, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchBlockList = async () => {
    try {
      const res = await fetch(`${API_URL}/blocklist`);
      setBlockList(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleUnblock = async (ip) => {
    try {
      await fetch(`${API_URL}/blocklist/${ip}`, { method: 'DELETE' });
      fetchBlockList();
      alert(`ปลดบล็อก ${ip} สำเร็จ`);
    } catch (e) { console.error(e); }
  };

  const card = {
    backgroundColor: 'var(--surface-1)',
    borderRadius: '10px', padding: '20px',
    border: '1px solid var(--border)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
  };

  return (
    <div>
      <h2 style={{ color: 'var(--text-primary)', fontSize: '20px', marginBottom: '20px' }}>
         รายการ IP ที่ถูกบล็อก
      </h2>

      <div style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--table-head)' }}>
              {['#','IP Address','เหตุผล','เวลาที่บล็อก','สถานะ','จัดการ'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {blockList.map((b, i) => (
              <tr key={i} style={{
                borderBottom: '1px solid var(--border)',
                backgroundColor: i % 2 === 0 ? 'var(--surface-1)' : 'var(--table-row-alt)'
              }}>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{b.id}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: '500' }}>{b.ip_address}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ backgroundColor: 'var(--bg-danger)', color: 'var(--text-danger)', padding: '3px 10px', borderRadius: '4px', fontSize: '13px' }}>
                    {b.attack_name}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{b.start_time}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    backgroundColor: b.end_time ? 'var(--bg-success)' : 'var(--bg-danger)',
                    color: b.end_time ? 'var(--text-success)' : 'var(--text-danger)',
                    padding: '3px 10px', borderRadius: '4px', fontSize: '13px'
                  }}>
                    {b.end_time ? 'ปลดบล็อกแล้ว' : 'บล็อกอยู่'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {!b.end_time && (
                    <button onClick={() => handleUnblock(b.ip_address)} style={{
                      backgroundColor: 'var(--fill-danger)', color: 'white',
                      border: 'none', padding: '5px 14px', borderRadius: '6px',
                      cursor: 'pointer', fontSize: '13px'
                    }}>ปลดบล็อก</button>
                  )}
                </td>
              </tr>
            ))}
            {blockList.length === 0 && (
              <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>ไม่มี IP ที่ถูกบล็อก</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BlockList;