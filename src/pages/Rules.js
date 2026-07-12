import React, { useState, useEffect } from 'react';

const API_URL = 'http://127.0.0.1:8000';

function Rules() {
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState({ rule_name: '', protocol: 'tcp', port: '', source_ip: '', dest_ip: '', mac_address: '', direction: 'INPUT', action: 'DROP', enable_log: false });
  const [blockIP, setBlockIP] = useState({ ip: '', reason: '' });

  useEffect(() => { fetchRules(); }, []);

  const fetchRules = async () => {
    try { setRules(await (await fetch(`${API_URL}/rules`)).json()); }
    catch (e) { console.error(e); }
  };

  const handleAddRule = async () => {
    if (!newRule.rule_name) return alert('กรุณาใส่ชื่อกฎ');
    try {
      const data = await (await fetch(`${API_URL}/rules`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newRule, port: newRule.port ? parseInt(newRule.port) : null })
      })).json();
      alert(data.message || data.error);
      fetchRules();
      setNewRule({ rule_name: '', protocol: 'tcp', port: '', source_ip: '', dest_ip: '', mac_address: '', direction: 'INPUT', action: 'DROP', enable_log: false });
    } catch (e) { console.error(e); }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm('ต้องการลบกฎนี้ไหม?')) return;
    try {
      const data = await (await fetch(`${API_URL}/rules/${id}`, { method: 'DELETE' })).json();
      alert(data.message || data.error); fetchRules();
    } catch (e) { console.error(e); }
  };

  const handleBlockIP = async () => {
    if (!blockIP.ip) return alert('กรุณาใส่ IP Address');
    try {
      const data = await (await fetch(`${API_URL}/blocklist`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockIP)
      })).json();
      alert(data.message || data.error);
      setBlockIP({ ip: '', reason: '' });
    } catch (e) { console.error(e); }
  };

  const inputStyle = {
    backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)',
    borderRadius: '10px', color: 'var(--text-primary)',
    padding: '12px 16px', fontSize: '15px', outline: 'none'
  };

  const section = {
    backgroundColor: 'var(--surface-1)', borderRadius: '14px', padding: '28px',
    marginBottom: '24px', border: '0.5px solid var(--border)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
  };

  const getActionStyle = (action) => {
    if (action === 'DROP')   return { backgroundColor: 'var(--bg-danger)',   color: 'var(--text-danger)' };
    if (action === 'ACCEPT') return { backgroundColor: 'var(--bg-success)',  color: 'var(--text-success)' };
    return { backgroundColor: 'var(--bg-warning)', color: 'var(--text-warning)' };
  };

  return (
    <div>
      <h2 style={{ color: 'var(--text-primary)', fontSize: '26px', fontWeight: 600, marginBottom: '24px' }}> จัดการกฎ iptables</h2>

      {/* Block IP */}
      <div style={section}>
        <h3 style={{ color: 'var(--text-danger)', fontSize: '19px', marginBottom: '20px' }}>🚫 บล็อก IP ด้วยตนเอง</h3>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <input placeholder="IP Address เช่น 192.168.1.3" value={blockIP.ip} onChange={e => setBlockIP({ ...blockIP, ip: e.target.value })} style={{ ...inputStyle, width: '240px' }} />
          <input placeholder="เหตุผล" value={blockIP.reason} onChange={e => setBlockIP({ ...blockIP, reason: e.target.value })} style={{ ...inputStyle, width: '240px' }} />
          <button onClick={handleBlockIP} style={{ backgroundColor: 'var(--fill-danger)', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: '500' }}>บล็อก IP</button>
        </div>
      </div>

      {/* Add Rule */}
      <div style={section}>
        <h3 style={{ color: 'var(--text-success)', fontSize: '19px', marginBottom: '20px' }}>➕ เพิ่มกฎใหม่</h3>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <input placeholder="ชื่อกฎ *" value={newRule.rule_name} onChange={e => setNewRule({ ...newRule, rule_name: e.target.value })} style={{ ...inputStyle, width: '190px' }} />
          <select value={newRule.protocol} onChange={e => setNewRule({ ...newRule, protocol: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="tcp">TCP</option><option value="udp">UDP</option><option value="icmp">ICMP</option><option value="all">ALL</option>
          </select>
          <input placeholder="Port" value={newRule.port} onChange={e => setNewRule({ ...newRule, port: e.target.value })} style={{ ...inputStyle, width: '130px' }} />
          <select value={newRule.direction} onChange={e => setNewRule({ ...newRule, direction: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="INPUT">INPUT</option><option value="OUTPUT">OUTPUT</option><option value="FORWARD">FORWARD</option>
          </select>
          <select value={newRule.action} onChange={e => setNewRule({ ...newRule, action: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="DROP">DROP</option><option value="ACCEPT">ACCEPT</option><option value="REJECT">REJECT</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input placeholder="Source IP" value={newRule.source_ip} onChange={e => setNewRule({ ...newRule, source_ip: e.target.value })} style={{ ...inputStyle, width: '210px' }} />
          <input placeholder="Destination IP" value={newRule.dest_ip} onChange={e => setNewRule({ ...newRule, dest_ip: e.target.value })} style={{ ...inputStyle, width: '210px' }} />
          <input placeholder="MAC Address" value={newRule.mac_address} onChange={e => setNewRule({ ...newRule, mac_address: e.target.value })} style={{ ...inputStyle, width: '210px' }} />
          <label style={{ color: 'var(--text-secondary)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={newRule.enable_log} onChange={e => setNewRule({ ...newRule, enable_log: e.target.checked })} style={{ width: '16px', height: '16px' }} />
            เปิด Logging
          </label>
          <button onClick={handleAddRule} style={{ backgroundColor: 'var(--fill-success)', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: '500' }}>เพิ่มกฎ</button>
        </div>
      </div>

      {/* Table */}
      <div style={section}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '19px', marginBottom: '20px' }}>📋 กฎทั้งหมด</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--table-head)' }}>
              {['#','ชื่อกฎ','Protocol','Port','Action','จัดการ'].map(h => (
                <th key={h} style={{ padding: '16px 20px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rules.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)', backgroundColor: i % 2 === 0 ? 'var(--surface-1)' : 'var(--table-row-alt)' }}>
                <td style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>{r.id}</td>
                <td style={{ padding: '16px 20px', color: 'var(--text-primary)', fontWeight: '500' }}>{r.rule_name}</td>
                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{r.protocol?.toUpperCase()}</td>
                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{r.port || '-'}</td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{ ...getActionStyle(r.action), padding: '5px 14px', borderRadius: '6px', fontSize: '14px', fontWeight: '500' }}>{r.action}</span>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <button onClick={() => handleDeleteRule(r.id)} style={{ backgroundColor: 'var(--fill-danger)', color: 'white', border: 'none', padding: '7px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>ลบกฎ</button>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '15px' }}>ไม่มีกฎ</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Rules;