import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import BlockList from './pages/BlockList';
import Rules from './pages/Rules';
import Login from './pages/Login';
import WebsiteBlock from './pages/WebsiteBlock';
import Settings from './pages/Settings';

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (username) => {
    setUser(username);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div style={{ fontFamily: 'Inter, Arial, sans-serif' }}>

        <nav style={{
          backgroundColor: '#ffffff',
          padding: '12px 30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
            <span style={{ color: '#1a56db', fontWeight: 'bold', fontSize: '18px' }}>
              🔥 Firewall Monitor
            </span>
            <Link to="/" style={{ color: '#374151', textDecoration: 'none', fontSize: '14px' }}>Dashboard</Link>
            <Link to="/logs" style={{ color: '#374151', textDecoration: 'none', fontSize: '14px' }}>Logs</Link>
            <Link to="/blocklist" style={{ color: '#374151', textDecoration: 'none', fontSize: '14px' }}>Block List</Link>
            <Link to="/rules" style={{ color: '#374151', textDecoration: 'none', fontSize: '14px' }}>Rules</Link>
            <Link to="/website-blocks" style={{ color: '#374151', textDecoration: 'none', fontSize: '14px' }}>Website Block</Link>
            <Link to="/settings" style={{ color: '#374151', textDecoration: 'none' }}>Settings</Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: '#374151', fontSize: '14px' }}>👤 {user}</span>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: '#ef4444',
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
          </div>
        </nav>

        <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/blocklist" element={<BlockList />} />
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