import React, { useState } from 'react';

const API_URL = 'http://127.0.0.1:8000';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username || !password) { setError('กรุณากรอก Username และ Password'); return; }
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) onLogin(data.username);
      else setError(data.message);
    } catch { setError('เชื่อมต่อ Server ไม่ได้'); }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    marginBottom: '15px',
    backgroundColor: 'var(--input-bg)',
    border: '1px solid var(--input-border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'background 0.3s, border 0.3s'
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', backgroundColor: 'var(--surface-0)',
      transition: 'background 0.3s'
    }}>
      <div style={{
        backgroundColor: 'var(--surface-1)',
        borderRadius: '12px', padding: '40px', width: '380px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        border: '1px solid var(--border)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔥</div>
          <h2 style={{ color: 'var(--text-primary)', margin: '0 0 4px', fontSize: '22px', fontWeight: '700' }}>
            Firewall Monitor
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>
            เข้าสู่ระบบเพื่อจัดการความปลอดภัย
          </p>
        </div>

        <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
          Username
        </label>
        <input type="text" placeholder="กรอก Username" value={username}
          onChange={e => setUsername(e.target.value)} style={inputStyle} />

        <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
          Password
        </label>
        <input type="password" placeholder="กรอก Password" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleLogin()} style={inputStyle} />

        {error && (
          <div style={{
            backgroundColor: 'var(--bg-danger)', border: '1px solid var(--border-danger)',
            borderRadius: '8px', padding: '10px 14px', marginBottom: '16px'
          }}>
            <p style={{ color: 'var(--text-danger)', margin: 0, fontSize: '14px' }}>⚠️ {error}</p>
          </div>
        )}

        <button onClick={handleLogin} style={{
          width: '100%', padding: '11px',
          backgroundColor: 'var(--fill-accent)',
          color: 'white', border: 'none', borderRadius: '8px',
          cursor: 'pointer', fontSize: '15px', fontWeight: '600', marginTop: '4px'
        }}>
          เข้าสู่ระบบ
        </button>
      </div>
    </div>
  );
}

export default Login;