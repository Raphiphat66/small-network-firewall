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
      const data = await res.json();
      setBlockList(data);
    } catch (error) {
      console.error('Error fetching blocklist:', error);
    }
  };

  const handleUnblock = async (ip) => {
    try {
      await fetch(`${API_URL}/blocklist/${ip}`, { method: 'DELETE' });
      fetchBlockList();
      alert(`ปลดบล็อก ${ip} สำเร็จ`);
    } catch (error) {
      console.error('Error unblocking IP:', error);
    }
  };

  return (
    <div>
      <h2 style={{ color: '#111827', fontSize: '20px', marginBottom: '20px' }}>
        🚫 รายการ IP ที่ถูกบล็อก
      </h2>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        padding: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>#</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>IP Address</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>เหตุผล</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>เวลาที่บล็อก</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>สถานะ</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {blockList.map((b, i) => (
              <tr key={i} style={{
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc'
              }}>
                <td style={{ padding: '12px 16px', color: '#374151' }}>{b.id}</td>
                <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '500' }}>{b.ip_address}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}>
                    {b.attack_name}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{b.start_time}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    backgroundColor: b.end_time ? '#dcfce7' : '#fee2e2',
                    color: b.end_time ? '#16a34a' : '#dc2626',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}>
                    {b.end_time ? 'ปลดบล็อกแล้ว' : 'บล็อกอยู่'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {!b.end_time && (
                    <button
                      onClick={() => handleUnblock(b.ip_address)}
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '5px 14px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      ปลดบล็อก
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {blockList.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#9ca3af' }}>
                  ไม่มี IP ที่ถูกบล็อก
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BlockList;