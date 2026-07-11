import React, { useState, useEffect } from 'react';

const API_URL = 'http://127.0.0.1:8000';

function Rules() {
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState({
    rule_name: '', protocol: 'tcp', port: '',
    source_ip: '', dest_ip: '', mac_address: '',
    direction: 'INPUT', action: 'DROP', enable_log: false
  });
  const [blockIP, setBlockIP] = useState({ ip: '', reason: '' });

  useEffect(() => { fetchRules(); }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch(`${API_URL}/rules`);
      const data = await res.json();
      setRules(data);
    } catch (error) { console.error('Error fetching rules:', error); }
  };

  const handleAddRule = async () => {
    if (!newRule.rule_name) return alert('กรุณาใส่ชื่อกฎ');
    try {
      const body = { ...newRule, port: newRule.port ? parseInt(newRule.port) : null };
      const res = await fetch(`${API_URL}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      alert(data.message || data.error);
      fetchRules();
      setNewRule({ rule_name: '', protocol: 'tcp', port: '', source_ip: '', dest_ip: '', mac_address: '', direction: 'INPUT', action: 'DROP', enable_log: false });
    } catch (error) { console.error('Error adding rule:', error); }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm('ต้องการลบกฎนี้ไหม?')) return;
    try {
      const res = await fetch(`${API_URL}/rules/${id}`, { method: 'DELETE' });
      const data = await res.json();
      alert(data.message || data.error);
      fetchRules();
    } catch (error) { console.error('Error deleting rule:', error); }
  };

  const handleBlockIP = async () => {
    if (!blockIP.ip) return alert('กรุณาใส่ IP Address');
    try {
      const res = await fetch(`${API_URL}/blocklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockIP)
      });
      const data = await res.json();
      alert(data.message || data.error);
      setBlockIP({ ip: '', reason: '' });
    } catch (error) { console.error('Error blocking IP:', error); }
  };

  const inputStyle = {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    color: '#111827',
    padding: '8px 12px',
    fontSize: '14px',
    outline: 'none'
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer'
  };

  const sectionStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
  };

  const getActionStyle = (action) => {
    if (action === 'DROP')   return { backgroundColor: '#fee2e2', color: '#dc2626' };
    if (action === 'ACCEPT') return { backgroundColor: '#dcfce7', color: '#16a34a' };
    return { backgroundColor: '#fef3c7', color: '#b45309' };
  };

  return (
    <div>
      <h2 style={{ color: '#111827', fontSize: '20px', marginBottom: '20px' }}>
        ⚙️ จัดการกฎ iptables
      </h2>

      {/* บล็อก IP */}
      <div style={sectionStyle}>
        <h3 style={{ color: '#dc2626', fontSize: '16px', marginBottom: '16px' }}>🚫 บล็อก IP ด้วยตนเอง</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            placeholder="IP Address เช่น 192.168.1.3"
            value={blockIP.ip}
            onChange={e => setBlockIP({ ...blockIP, ip: e.target.value })}
            style={{ ...inputStyle, width: '200px' }}
          />
          <input
            placeholder="เหตุผล"
            value={blockIP.reason}
            onChange={e => setBlockIP({ ...blockIP, reason: e.target.value })}
            style={{ ...inputStyle, width: '200px' }}
          />
          <button onClick={handleBlockIP} style={{
            backgroundColor: '#ef4444', color: 'white',
            border: 'none', padding: '8px 20px',
            borderRadius: '8px', cursor: 'pointer',
            fontSize: '14px', fontWeight: '500'
          }}>
            บล็อก IP
          </button>
        </div>
      </div>

      {/* เพิ่มกฎใหม่ */}
      <div style={sectionStyle}>
        <h3 style={{ color: '#16a34a', fontSize: '16px', marginBottom: '16px' }}>➕ เพิ่มกฎใหม่</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <input
            placeholder="ชื่อกฎ *"
            value={newRule.rule_name}
            onChange={e => setNewRule({ ...newRule, rule_name: e.target.value })}
            style={{ ...inputStyle, width: '150px' }}
          />
          <select value={newRule.protocol} onChange={e => setNewRule({ ...newRule, protocol: e.target.value })} style={selectStyle}>
            <option value="tcp">TCP</option>
            <option value="udp">UDP</option>
            <option value="icmp">ICMP</option>
            <option value="all">ALL</option>
          </select>
          <input
            placeholder="Port (ถ้ามี)"
            value={newRule.port}
            onChange={e => setNewRule({ ...newRule, port: e.target.value })}
            style={{ ...inputStyle, width: '110px' }}
          />
          <select value={newRule.direction} onChange={e => setNewRule({ ...newRule, direction: e.target.value })} style={selectStyle}>
            <option value="INPUT">INPUT</option>
            <option value="OUTPUT">OUTPUT</option>
            <option value="FORWARD">FORWARD</option>
          </select>
          <select value={newRule.action} onChange={e => setNewRule({ ...newRule, action: e.target.value })} style={selectStyle}>
            <option value="DROP">DROP</option>
            <option value="ACCEPT">ACCEPT</option>
            <option value="REJECT">REJECT</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="Source IP (ถ้ามี)"
            value={newRule.source_ip}
            onChange={e => setNewRule({ ...newRule, source_ip: e.target.value })}
            style={{ ...inputStyle, width: '180px' }}
          />
          <input
            placeholder="Destination IP (ถ้ามี)"
            value={newRule.dest_ip}
            onChange={e => setNewRule({ ...newRule, dest_ip: e.target.value })}
            style={{ ...inputStyle, width: '180px' }}
          />
          <input
            placeholder="MAC Address (ถ้ามี)"
            value={newRule.mac_address}
            onChange={e => setNewRule({ ...newRule, mac_address: e.target.value })}
            style={{ ...inputStyle, width: '180px' }}
          />
          <label style={{ color: '#374151', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={newRule.enable_log}
              onChange={e => setNewRule({ ...newRule, enable_log: e.target.checked })}
            />
            เปิด Logging
          </label>
          <button onClick={handleAddRule} style={{
            backgroundColor: '#16a34a', color: 'white',
            border: 'none', padding: '8px 20px',
            borderRadius: '8px', cursor: 'pointer',
            fontSize: '14px', fontWeight: '500'
          }}>
            เพิ่มกฎ
          </button>
        </div>
      </div>

      {/* ตารางกฎ */}
      <div style={sectionStyle}>
        <h3 style={{ color: '#111827', fontSize: '16px', marginBottom: '16px' }}>📋 กฎทั้งหมด</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>#</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>ชื่อกฎ</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>Protocol</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>Port</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>Action</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{r.id}</td>
                <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '500' }}>{r.rule_name}</td>
                <td style={{ padding: '12px 16px', color: '#374151' }}>{r.protocol?.toUpperCase()}</td>
                <td style={{ padding: '12px 16px', color: '#374151' }}>{r.port || '-'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    ...getActionStyle(r.action),
                    padding: '3px 10px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    {r.action}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button
                    onClick={() => handleDeleteRule(r.id)}
                    style={{
                      backgroundColor: '#ef4444', color: 'white',
                      border: 'none', padding: '5px 14px',
                      borderRadius: '6px', cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    ลบกฎ
                  </button>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#9ca3af' }}>
                  ไม่มีกฎ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Rules;