import React, { useState, useEffect } from 'react';

const API_URL = 'http://127.0.0.1:8000';

const SUGGESTED_BLOCKS = [
    { category: "🎰 เว็บพนัน", sites: ["bet911.com", "gclub.com", "ufabet.com", "vegus168.com"] },
    { category: "🔞 เว็บโป๊", sites: ["pornhub.com", "xvideos.com", "xnxx.com"] },
    { category: "⚠️ เว็บอันตราย", sites: ["malware.com", "phishing.com"] }
];

function WebsiteBlock() {
    const [blockedSites, setBlockedSites] = useState([]);
    const [domain, setDomain] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => { fetchBlockedSites(); }, []);

    const fetchBlockedSites = async () => {
        try {
            const res = await fetch(`${API_URL}/website-blocks`);
            const data = await res.json();
            setBlockedSites(data);
        } catch (error) { console.error('Error:', error); }
    };

    const handleBlock = async (site, r = '') => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/website-blocks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: site, reason: r || reason })
            });
            const data = await res.json();
            alert(data.message || data.error);
            fetchBlockedSites();
            setDomain('');
            setReason('');
        } catch (error) { console.error('Error:', error); }
        setLoading(false);
    };

    const handleUnblock = async (id, domain) => {
        if (!window.confirm(`ต้องการปลดบล็อก ${domain} ไหม?`)) return;
        try {
            const res = await fetch(`${API_URL}/website-blocks/${id}`, { method: 'DELETE' });
            const data = await res.json();
            alert(data.message || data.error);
            fetchBlockedSites();
        } catch (error) { console.error('Error:', error); }
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

    const sectionStyle = {
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        padding: '20px',
        marginBottom: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
    };

    return (
        <div>
            <h2 style={{ color: '#111827', fontSize: '20px', marginBottom: '20px' }}>
                🚫 บล็อกเว็บไซต์
            </h2>

            {/* บล็อกเว็บเอง */}
            <div style={sectionStyle}>
                <h3 style={{ color: '#dc2626', fontSize: '16px', marginBottom: '16px' }}>
                    บล็อกเว็บไซต์ด้วยตนเอง
                </h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                        placeholder="ชื่อเว็บ เช่น facebook.com"
                        value={domain}
                        onChange={e => setDomain(e.target.value)}
                        style={{ ...inputStyle, width: '250px' }}
                    />
                    <input
                        placeholder="เหตุผล"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        style={{ ...inputStyle, width: '200px' }}
                    />
                    <button
                        onClick={() => handleBlock(domain)}
                        disabled={loading}
                        style={{
                            backgroundColor: loading ? '#9ca3af' : '#ef4444',
                            color: 'white',
                            border: 'none',
                            padding: '8px 20px',
                            borderRadius: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        {loading ? 'กำลังบล็อก...' : 'บล็อก'}
                    </button>
                </div>
            </div>

            {/* บล็อกด่วน */}
            <div style={sectionStyle}>
                <h3 style={{ color: '#b45309', fontSize: '16px', marginBottom: '16px' }}>
                    ⚡ บล็อกด่วน
                </h3>
                {SUGGESTED_BLOCKS.map((category, i) => (
                    <div key={i} style={{ marginBottom: '16px' }}>
                        <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                            {category.category}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {category.sites.map((site, j) => (
                                <button
                                    key={j}
                                    onClick={() => handleBlock(site, category.category)}
                                    style={{
                                        backgroundColor: '#f1f5f9',
                                        color: '#374151',
                                        border: '1px solid #e2e8f0',
                                        padding: '5px 14px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '500'
                                    }}
                                >
                                    🚫 {site}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* รายการที่บล็อกอยู่ */}
            <div style={sectionStyle}>
                <h3 style={{ color: '#111827', fontSize: '16px', marginBottom: '16px' }}>
                    📋 เว็บที่บล็อกอยู่
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f1f5f9' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>#</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>เว็บไซต์</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>IP</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {blockedSites.map((site, i) => (
                            <tr key={i} style={{
                                borderBottom: '1px solid #e2e8f0',
                                backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc'
                            }}>
                                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{site.id}</td>
                                <td style={{ padding: '12px 16px' }}>
                                    <span style={{
                                        backgroundColor: '#fee2e2',
                                        color: '#dc2626',
                                        padding: '3px 10px',
                                        borderRadius: '4px',
                                        fontSize: '13px',
                                        fontWeight: '500'
                                    }}>
                                        🚫 {site.domain}
                                    </span>
                                </td>
                                <td style={{ padding: '12px 16px', color: '#374151' }}>{site.ip}</td>
                                <td style={{ padding: '12px 16px' }}>
                                    <button
                                        onClick={() => handleUnblock(site.id, site.domain)}
                                        style={{
                                            backgroundColor: '#16a34a',
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
                                </td>
                            </tr>
                        ))}
                        {blockedSites.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#9ca3af' }}>
                                    ไม่มีเว็บที่บล็อก
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default WebsiteBlock;