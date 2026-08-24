import React, { useState, useEffect } from 'react';

const API_URL = 'http://127.0.0.1:8000';

function Whitelist() {
  const [whitelist, setWhitelist] = useState([]);
  const [ip, setIp] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWhitelist();
    const interval = setInterval(fetchWhitelist, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchWhitelist = async () => {
    try {
      const res = await fetch(`${API_URL}/whitelist`);
      setWhitelist(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleAdd = async () => {
    if (!ip.trim()) return alert('กรุณากรอก IP Address');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/whitelist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip_address: ip.trim(), description: description.trim() })
      });
      const data = await res.json();
      if (data.error) return alert(data.error);
      setIp('');
      setDescription('');
      fetchWhitelist();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id, ip_address) => {
    if (!window.confirm(`ลบ ${ip_address} ออกจาก Whitelist?`)) return;
    try {
      await fetch(`${API_URL}/whitelist/${id}`, { method: 'DELETE' });
      fetchWhitelist();
    } catch (e) { console.error(e); }
  };

  const card = {
    backgroundColor: 'var(--surface-1)',
    borderRadius: '10px', padding: '20px',
    border: '1px solid var(--border)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
  };

  const inputStyle = {
    padding: '10px 14px',
    backgroundColor: 'var(--input-bg)',
    border: '1px solid var(--input-border)',
    borderRadius: '8px', color: 'var(--text-primary)',
    fontSize: '14px', outline: 'none'
  };

  return (
    <div>
      <h2 style={{ color: 'var(--text-primary)', fontSize: '20px', marginBottom: '8px' }}>
       Whitelist
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
        IP ที่อยู่ใน Whitelist จะไม่ถูกบล็อกอัตโนมัติ แม้พฤติกรรมจะเกิน Threshold
      </p>

      {/* ฟอร์มเพิ่ม IP */}
      <div style={{ ...card, marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '15px', marginBottom: '16px' }}>
          เพิ่ม IP เข้า Whitelist
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="IP Address เช่น 192.168.1.100"
            value={ip}
            onChange={e => setIp(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: '200px' }}
          />
          <input
            type="text"
            placeholder="หมายเหตุ เช่น IP ผู้ดูแลระบบ"
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ ...inputStyle, flex: 2, minWidth: '200px' }}
          />
          <button
            onClick={handleAdd}
            disabled={loading}
            style={{
              backgroundColor: 'var(--fill-accent)', color: 'white',
              border: 'none', padding: '10px 20px', borderRadius: '8px',
              cursor: 'pointer', fontSize: '14px', fontWeight: '500'
            }}
          >
            {loading ? 'กำลังเพิ่ม...' : '+ เพิ่ม IP'}
          </button>
        </div>
      </div>

      {/* ตาราง Whitelist */}
      <div style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--table-head)' }}>
              {['#', 'IP Address', 'หมายเหตุ', 'เพิ่มเมื่อ', 'จัดการ'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {whitelist.map((w, i) => (
              <tr key={i} style={{
                borderBottom: '1px solid var(--border)',
                backgroundColor: i % 2 === 0 ? 'var(--surface-1)' : 'var(--table-row-alt)'
              }}>
                <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{w.id}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: '500', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ backgroundColor: 'var(--bg-success)', color: 'var(--text-success)', padding: '3px 10px', borderRadius: '4px', fontSize: '13px' }}>
                    ✓ {w.ip_address}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{w.description || '-'}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{w.created_at}</td>
                <td style={{ padding: '12px 16px' }}>
                  <button
                    onClick={() => handleDelete(w.id, w.ip_address)}
                    style={{
                      backgroundColor: 'var(--fill-danger)', color: 'white',
                      border: 'none', padding: '5px 14px', borderRadius: '6px',
                      cursor: 'pointer', fontSize: '13px'
                    }}
                  >
                    ลบออก
                  </button>
                </td>
              </tr>
            ))}
            {whitelist.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  ไม่มี IP ใน Whitelist
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Whitelist;
