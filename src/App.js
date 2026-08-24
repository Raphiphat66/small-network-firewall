import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import BlockList from './pages/BlockList';
import Rules from './pages/Rules';
import Login from './pages/Login';
import WebsiteBlock from './pages/WebsiteBlock';
import Settings from './pages/Settings';
import Whitelist from './pages/Whitelist';

function App() {
  const [user, setUser] = useState(null);
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  if (!user) {
    return <Login onLogin={setUser} dark={dark} />;
  }

  const navStyle = {
    backgroundColor: 'var(--nav-bg)',
    padding: '12px 30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--nav-border)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    transition: 'background 0.3s ease'
  };

  const linkStyle = {
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'color 0.2s'
  };

  return (
    <Router>
      <div style={{ fontFamily: 'var(--font-sans)' }}>

        <nav style={navStyle}>
          <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
            <span style={{ color: 'var(--fill-accent)', fontWeight: 'bold', fontSize: '18px' }}>
              🔥 Firewall Monitor
            </span>
            <Link to="/" style={linkStyle}>Dashboard</Link>
            <Link to="/logs" style={linkStyle}>Logs</Link>
            <Link to="/blocklist" style={linkStyle}>Block List</Link>
            <Link to="/whitelist" style={linkStyle}>Whitelist</Link>
            <Link to="/rules" style={linkStyle}>Rules</Link>
            <Link to="/website-blocks" style={linkStyle}>Website Block</Link>
            <Link to="/settings" style={linkStyle}>Settings</Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>👤 {user}</span>

            <button
              onClick={() => setUser(null)}
              style={{
                backgroundColor: 'var(--fill-danger)',
                color: 'white',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ออกจากระบบ
            </button>

            <button
              onClick={() => setDark(d => !d)}
              title={dark ? 'เปลี่ยนเป็น Light' : 'เปลี่ยนเป็น Dark'}
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border-strong)',
                borderRadius: '20px',
                padding: '4px 10px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--text-primary)',
                transition: 'background 0.2s'
              }}
            >
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
        </nav>

        <div style={{
          padding: '24px',
          backgroundColor: 'var(--surface-0)',
          minHeight: '100vh',
          transition: 'background 0.3s ease'
        }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/blocklist" element={<BlockList />} />
            <Route path="/whitelist" element={<Whitelist />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/website-blocks" element={<WebsiteBlock />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>

      </div>
    </Router>
  );
}

export default App;