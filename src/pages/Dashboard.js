import React, { useState, useEffect } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = 'http://127.0.0.1:8000';


function Dashboard() {
  const [stats, setStats] = useState({
    total_packets: 0,
    total_attacks: 0,
    total_blocked: 0,
    total_blockedns: 0
  });
  const [attacks, setAttacks] = useState([]);
  const [attackTypes, setAttackTypes] = useState({});
  const [settings, setSettings] = useState([]);
  const [trafficData, setTrafficData] = useState([]);
  const [blockedWebsites, setBlockedWebsites] = useState([]);
  
  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAll = async () => {
    try {
      const [statsRes, attacksRes, settingsRes, websiteBlocksRes] = await Promise.all([
        fetch(`${API_URL}/stats`),
        fetch(`${API_URL}/attacks`),
        fetch(`${API_URL}/settings`),
        fetch(`${API_URL}/website-blocks`)
      ]);
      const statsData = await statsRes.json();
      const attacksData = await attacksRes.json();
      const settingsData = await settingsRes.json();
      const websiteBlocksData = await websiteBlocksRes.json();

      setStats(statsData);
      setAttacks(attacksData.slice(0, 4));
      setSettings(settingsData);
      setBlockedWebsites(websiteBlocksData);

      // สร้าง traffic data แยกตามชั่วโมง
const packetsRes2 = await fetch(`${API_URL}/packets`);
const packetsData = await packetsRes2.json();

const today = new Date().toDateString();

const hourly = {};
packetsData
  .filter(p => new Date(p.timestamp).toDateString() === today)
  .forEach(p => {
    const hour = new Date(p.timestamp).getHours();
    const key = `${hour}:00`;
    if (!hourly[key]) hourly[key] = { time: key, total: 0, attacks: 0, level: 'ปกติ' };
    hourly[key].total += 1;
});

attacksData
  .filter(a => new Date(a.timestamp).toDateString() === today)
  .forEach(a => {
    const hour = new Date(a.timestamp).getHours();
    const key = `${hour}:00`;
    if (!hourly[key]) hourly[key] = { time: key, total: 0, attacks: 0, level: 'ปกติ' };
    hourly[key].attacks += 1;
    // BLOCK สำคัญกว่า WARNING เสมอ ถ้าชั่วโมงนั้นมีทั้งคู่ให้ถือว่าเป็น BLOCK
    const level = a.attack_type?.includes('[WARNING]') ? 'ผิดปกติ' : 'โจมตี';
    if (level === 'โจมตี' || hourly[key].level === 'ปกติ') {
        hourly[key].level = level;
    }
});

const sorted = Object.values(hourly).sort((a, b) => {
    return parseInt(a.time) - parseInt(b.time);
});
setTrafficData(sorted);

      const counts = {};
      attacksData.forEach(a => {
        const type = a.attack_type?.replace('[WARNING] ', '').replace('[BLOCK] ', '') || 'Unknown';
        counts[type] = (counts[type] || 0) + 1;
      });
      setAttackTypes(counts);
    } catch (e) {
      console.error(e);
    }
  };

  const getLevel = (attack_type) => {
    if (attack_type?.includes('[WARNING]')) return 'WARN';
    return 'BLOCK';
  };

  const getTimeAgo = (timestamp) => {
    const diff = Math.floor((new Date() - new Date(timestamp)) / 60000);
    if (diff < 1) return 'เมื่อกี้';
    if (diff < 60) return `${diff} นาทีที่แล้ว`;
    return `${Math.floor(diff / 60)} ชั่วโมงที่แล้ว`;
  };

  const maxAttack = Math.max(...Object.values(attackTypes), 1);

  const attackColors = {
    'ICMP Flood': 'var(--fill-danger)',
    'SYN Flood': 'var(--fill-warning)',
    'UDP Flood': 'var(--fill-warning)',
    'Port Scan': 'var(--fill-accent)',
    'Brute Force': 'var(--fill-accent)',
  };

  const thresholdKeys = [
    { name: 'ICMP Flood', warn: 'icmp_flood_warn', block: 'icmp_flood_block' },
    { name: 'SYN Flood', warn: 'syn_flood_warn', block: 'syn_flood_block' },
    { name: 'UDP Flood', warn: 'udp_flood_warn', block: 'udp_flood_block' },
    { name: 'Port Scan', warn: 'port_scan_warn', block: 'port_scan_block' },
    { name: 'Brute Force', warn: 'brute_force_warn', block: 'brute_force_block' },
  ];

  const getSetting = (key) => {
    const s = settings.find(s => s.key === key);
    return s ? s.value : '-';
  };

  const warnCount = attacks.filter(a => a.attack_type?.includes('[WARNING]')).length;
  const blockCount = attacks.filter(a => !a.attack_type?.includes('[WARNING]')).length;

  const s = {
    dash: {
      padding: '1.5rem 0.5rem',
      background: 'var(--surface-0)',
      minHeight: '100%',
      fontFamily: 'var(--font-sans)'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '1.5rem'
    },
    headerLeft: { display: 'flex', flexDirection: 'column', gap: '4px' },
    shield: {
      width: '32px', height: '32px',
      background: 'var(--bg-danger)',
      borderRadius: '8px',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    title: { fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' },
    subtitle: { fontSize: '12px', color: 'var(--text-secondary)' },
    statusBadge: {
      display: 'flex', alignItems: 'center', gap: '6px',
      background: 'var(--bg-success)',
      border: '0.5px solid var(--border-success)',
      borderRadius: 'var(--radius)',
      padding: '4px 10px',
      fontSize: '12px', color: 'var(--text-success)'
    },
    stats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px',
      marginBottom: '1.5rem'
    },
    statCard: {
      background: 'var(--surface-1)',
      border: '0.5px solid var(--border)',
      borderRadius: '14px',
      padding: '20px 22px'
    },
    statLabel: {
      fontSize: '13px', color: 'var(--text-secondary)',
      marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px'
    },
    statVal: { fontSize: '32px', fontWeight: 600, color: 'var(--text-primary)' },
    statSub: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' },
    mid: {
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      gap: '16px', marginBottom: '1.5rem'
    },
    card: {
      background: 'var(--surface-1)',
      border: '0.5px solid var(--border)',
      borderRadius: '14px',
      padding: '20px',
      minHeight: '320px'
    },
    cardTitle: {
      fontSize: '15px', fontWeight: 600,
      color: 'var(--text-primary)',
      marginBottom: '18px',
      display: 'flex', alignItems: 'center', gap: '8px'
    },
    barRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' },
    barLabel: { fontSize: '13px', color: 'var(--text-secondary)', width: '90px', flexShrink: 0 },
    barWrap: { flex: 1, height: '10px', background: 'var(--border)', borderRadius: '5px', overflow: 'hidden' },
    barCount: { fontSize: '13px', color: 'var(--text-muted)', width: '32px', textAlign: 'right' },
    attackItem: {
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '12px 14px',
      background: 'var(--surface-0)',
      borderRadius: 'var(--radius)',
      border: '0.5px solid var(--border)',
      marginBottom: '10px'
    },
    bottom: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    thRow: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '0.5px solid var(--border)'
    },
  };

  return (
    <div style={s.dash}>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>ภาพรวมระบบ</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div style={s.statusBadge}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: 'var(--fill-success)'
          }}></div>
          ระบบทำงานปกติ
        </div>
      </div>

      {/* Stats */}
      <div style={s.stats}>
        <div style={s.statCard}>
          <div style={s.statLabel}>
            <i className="ti ti-activity" style={{ fontSize: '13px', color: 'var(--text-accent)' }} aria-hidden="true"></i>
            แพ็กเก็ตทั้งหมด
          </div>
          <div style={s.statVal}>{stats.total_packets.toLocaleString()}</div>
          <div style={s.statSub}>วันนี้</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>
            <i className="ti ti-alert-triangle" style={{ fontSize: '13px', color: 'var(--text-warning)' }} aria-hidden="true"></i>
            การโจมตีที่พบ
          </div>
          <div style={{ ...s.statVal, color: 'var(--text-warning)' }}>{stats.total_attacks}</div>
          <div style={s.statSub}>{warnCount} WARNING · {blockCount} BLOCK</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>
            <i className="ti ti-ban" style={{ fontSize: '13px', color: 'var(--text-danger)' }} aria-hidden="true"></i>
            IP ที่บล็อก
          </div>
          <div style={{ ...s.statVal, color: 'var(--text-danger)' }}>{stats.total_blocked}</div>
          <div style={s.statSub}>กำลังบล็อกอยู่</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>
            <i className="ti ti-globe-off" style={{ fontSize: '13px', color: 'var(--text-secondary)' }} aria-hidden="true"></i>
          เว็บที่บล็อกอยู่
          </div>
          <div style={{ ...s.statVal, color: 'var(--text-success)' }}>{blockedWebsites.length}</div>
          <div style={s.statSub}>
            {blockedWebsites.length === 0
              ? 'ยังไม่มีเว็บที่บล็อก'
              : blockedWebsites.slice(0, 2).map(w => w.domain).join(', ') + (blockedWebsites.length > 2 ? ` +${blockedWebsites.length - 2} เว็บ` : '')}
          </div>
        </div>
      </div>

      {/* Middle */}
      <div style={s.mid}>

        {/* Attack Types Bar */}
        <div style={s.card}>
          <div style={s.cardTitle}>
            <i className="ti ti-chart-bar" aria-hidden="true"></i>
            ประเภทการโจมตี
          </div>
          {Object.keys(attackTypes).length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
              ยังไม่พบการโจมตี
            </div>
          ) : (
            Object.entries(attackTypes)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div key={type} style={s.barRow}>
                  <div style={s.barLabel}>{type}</div>
                  <div style={s.barWrap}>
                    <div style={{
                      height: '100%',
                      width: `${(count / maxAttack) * 100}%`,
                      background: attackColors[type] || 'var(--fill-accent)',
                      borderRadius: '4px'
                    }}></div>
                  </div>
                  <div style={s.barCount}>{count}</div>
                </div>
              ))
          )}
        </div>

        {/* Recent Attacks */}
        <div style={s.card}>
          <div style={s.cardTitle}>
            <i className="ti ti-clock-bolt" aria-hidden="true"></i>
            การโจมตีล่าสุด
          </div>
          {attacks.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
              ยังไม่พบการโจมตี
            </div>
          ) : (
            attacks.map((a, i) => {
              const level = getLevel(a.attack_type);
              const type = a.attack_type?.replace('[WARNING] ', '').replace('[BLOCK] ', '') || 'Unknown';
              return (
                <div key={i} style={s.attackItem}>
                  <span style={{
                    fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                    fontWeight: 500, flexShrink: 0,
                    background: level === 'WARN' ? 'var(--bg-warning)' : 'var(--bg-danger)',
                    color: level === 'WARN' ? 'var(--text-warning)' : 'var(--text-danger)'
                  }}>{level}</span>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {a.source_ip}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', flex: 1 }}>{type}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {getTimeAgo(a.timestamp)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom */}
      <div style={s.bottom}>

        {/* Threshold */}
        <div style={s.card}>
          <div style={s.cardTitle}>
            <i className="ti ti-adjustments" aria-hidden="true"></i>
            Threshold ปัจจุบัน
          </div>
          {thresholdKeys.map((t, i) => (
            <div key={i} style={{
              ...s.thRow,
              borderBottom: i === thresholdKeys.length - 1 ? 'none' : '0.5px solid var(--border)'
            }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.name}</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{
                  fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                  background: 'var(--bg-warning)', color: 'var(--text-warning)'
                }}>W: {getSetting(t.warn)}</span>
                <span style={{
                  fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                  background: 'var(--bg-danger)', color: 'var(--text-danger)'
                }}>B: {getSetting(t.block)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Protocol Distribution */}
        {/* Traffic Graph */}
<div style={s.card}>
    <div style={s.cardTitle}>
        <i className="ti ti-chart-area" aria-hidden="true"></i>
        Traffic วันนี้
    </div>
    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
        แพ็กเก็ต/ชั่วโมง
    </div>
    {trafficData.length === 0 ? (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
            ยังไม่มีข้อมูล Traffic
        </div>
    ) : (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trafficData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip
                    contentStyle={{
                        background: 'var(--surface-2)',
                        border: '0.5px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '11px'
                    }}
                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 500 }}
                    formatter={(value, name, props) => [`${value} packet (${props.payload.level})`, 'แพ็กเก็ตทั้งหมด']}
                />
                <Bar dataKey="total" name="แพ็กเก็ตทั้งหมด" radius={[4, 4, 0, 0]}>
                    {trafficData.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={
                                entry.level === 'โจมตี' ? '#e24b4a'
                                : entry.level === 'ผิดปกติ' ? '#e8b339'
                                : '#6b7280'
                            }
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )}
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#e24b4a' }}></div>
            โจมตี
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#e8b339' }}></div>
            ผิดปกติ
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#6b7280' }}></div>
            ปกติ
        </div>
    </div>
</div>

      </div>
    </div>
  );
}

export default Dashboard;