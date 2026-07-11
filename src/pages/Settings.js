import React, { useState, useEffect } from 'react';

const API_URL = 'http://127.0.0.1:8000';

const LABELS = {
    port_scan_warn: 'Port Scan — แจ้งเตือนเมื่อสแกนเกิน (port)',
    port_scan_block: 'Port Scan — บล็อกเมื่อสแกนเกิน (port)',
    syn_flood_warn: 'SYN Flood — แจ้งเตือนเมื่อเกิน (packet/3วิ)',
    syn_flood_block: 'SYN Flood — บล็อกเมื่อเกิน (packet/3วิ)',
    udp_flood_warn: 'UDP Flood — แจ้งเตือนเมื่อเกิน (packet/3วิ)',
    udp_flood_block: 'UDP Flood — บล็อกเมื่อเกิน (packet/3วิ)',
    icmp_flood_warn: 'ICMP Flood — แจ้งเตือนเมื่อเกิน (packet/3วิ)',
    icmp_flood_block: 'ICMP Flood — บล็อกเมื่อเกิน (packet/3วิ)',
    brute_force_warn: 'Brute Force — แจ้งเตือนเมื่อเกิน (ครั้ง)',
    brute_force_block: 'Brute Force — บล็อกเมื่อเกิน (ครั้ง)',
    block_duration: 'ระยะเวลาบล็อก IP (นาที)',
};

const categories = [
    { title: '🔍 Port Scan', keys: ['port_scan_warn', 'port_scan_block'] },
    { title: '💥 SYN Flood', keys: ['syn_flood_warn', 'syn_flood_block'] },
    { title: '🌊 UDP Flood', keys: ['udp_flood_warn', 'udp_flood_block'] },
    { title: '📡 ICMP Flood', keys: ['icmp_flood_warn', 'icmp_flood_block'] },
    { title: '🔐 Brute Force', keys: ['brute_force_warn', 'brute_force_block'] },
    { title: '⏱️ การบล็อก', keys: ['block_duration'] },
];

function Settings() {
    const [settings, setSettings] = useState([]);
    const [edited, setEdited] = useState({});
    const [saved, setSaved] = useState(false);

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_URL}/settings`);
            const data = await res.json();
            setSettings(data);
            const initial = {};
            data.forEach(s => { initial[s.key] = s.value; });
            setEdited(initial);
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const handleSave = async (key) => {
        try {
            const res = await fetch(`${API_URL}/settings/${key}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ setting_key: key, setting_value: parseInt(edited[key]) })
            });
            const data = await res.json();
            if (data.message) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            }
        } catch (error) {
            console.error('Error saving setting:', error);
        }
    };

    const handleSaveAll = async () => {
        for (const key of Object.keys(edited)) {
            await handleSave(key);
        }
    };

    return (
        <div>
            <h2 style={{ color: '#111827', fontSize: '20px', marginBottom: '20px' }}>⚙️ ตั้งค่าระบบ</h2>

            {/* Success Banner */}
            {saved && (
                <div style={{
                    backgroundColor: '#dcfce7',
                    border: '1px solid #86efac',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    marginBottom: '20px',
                    color: '#16a34a',
                    fontSize: '14px'
                }}>
                    ✓ บันทึกสำเร็จแล้ว
                </div>
            )}

            {/* Warning Note */}
            <div style={{
                backgroundColor: '#fefce8',
                border: '1px solid #fde047',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '24px'
            }}>
                <p style={{ color: '#854d0e', margin: 0, fontSize: '14px' }}>
                    ⚠️ ค่า WARNING ต้องน้อยกว่าค่า BLOCK เสมอ และการเปลี่ยนค่าจะมีผลกับการตรวจจับครั้งถัดไปทันที
                </p>
            </div>

            {/* Categories */}
            {categories.map((cat, i) => (
                <div key={i} style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    padding: '20px',
                    marginBottom: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                }}>
                    <h3 style={{ color: '#1a56db', fontSize: '15px', marginBottom: '16px', marginTop: 0 }}>
                        {cat.title}
                    </h3>
                    {cat.keys.map((key) => (
                        <div key={key} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '10px',
                            padding: '12px 16px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: '#374151', fontSize: '14px' }}>{LABELS[key]}</span>
                                {key.includes('warn') && (
                                    <span style={{
                                        backgroundColor: '#fef3c7',
                                        color: '#b45309',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        fontWeight: '500'
                                    }}>⚠️ WARNING</span>
                                )}
                                {key.includes('block') && (
                                    <span style={{
                                        backgroundColor: '#fee2e2',
                                        color: '#dc2626',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        fontWeight: '500'
                                    }}>🚫 BLOCK</span>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input
                                    type="number"
                                    value={edited[key] || 0}
                                    onChange={e => setEdited({ ...edited, [key]: e.target.value })}
                                    style={{
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        color: '#111827',
                                        padding: '8px',
                                        width: '80px',
                                        textAlign: 'center',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                    min="1"
                                />
                                <button
                                    onClick={() => handleSave(key)}
                                    style={{
                                        backgroundColor: '#1a56db',
                                        color: 'white',
                                        border: 'none',
                                        padding: '7px 16px',
                                        borderRadius: '7px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '500'
                                    }}
                                >
                                    บันทึก
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ))}

            {/* Save All */}
            <button
                onClick={handleSaveAll}
                style={{
                    backgroundColor: '#16a34a',
                    color: 'white',
                    border: 'none',
                    padding: '12px 30px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    width: '100%'
                }}
            >
                💾 บันทึกทั้งหมด
            </button>
        </div>
    );
}

export default Settings;