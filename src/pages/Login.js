import React, { useState } from 'react';

const API_URL = 'http://127.0.0.1:8000';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      setError('กรุณากรอก Username และ Password');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.username);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('เชื่อมต่อ Server ไม่ได้');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    marginBottom: '15px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    color: '#111827',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none'
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8fafc'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '40px',
        width: '380px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        border: '1px solid #e2e8f0'
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔥</div>
          <h2 style={{ color: '#111827', margin: '0 0 4px', fontSize: '22px', fontWeight: '700' }}>
            Firewall Monitor
          </h2>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
            เข้าสู่ระบบเพื่อจัดการความปลอดภัย
          </p>
        </div>

        {/* Username */}
        <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
          Username
        </label>
        <input
          type="text"
          placeholder="กรอก Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={inputStyle}
        />

        {/* Password */}
        <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
          Password
        </label>
        <input
          type="password"
          placeholder="กรอก Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleLogin()}
          style={inputStyle}
        />

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px'
          }}>
            <p style={{ color: '#dc2626', margin: 0, fontSize: '14px' }}>⚠️ {error}</p>
          </div>
        )}

        {/* Button */}
        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '11px',
            backgroundColor: '#1a56db',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            marginTop: '4px'
          }}
        >
          เข้าสู่ระบบ
        </button>

      </div>
    </div>
  );
}

export default Login;