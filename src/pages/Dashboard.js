import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceDot
} from 'recharts';

const API_URL = 'http://127.0.0.1:8000';

function Dashboard() {
  const [stats, setStats] = useState({
    total_packets: 0,
    total_attacks: 0,
    total_blocked: 0,
    total_blockedns: 0
  });
  const [selectedDate, setSelectedDate] = useState('');
  const [attacks, setAttacks] = useState([]);
  const [allAttacks, setAllAttacks] = useState([]);
  const [attackTypes, setAttackTypes] = useState({});
  const [settings, setSettings] = useState([]);
  const [trafficData, setTrafficData] = useState([]);
  const [attackHourMap, setAttackHourMap] = useState({});
  const [blockedWebsites, setBlockedWebsites] = useState([]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  const fetchAll = async () => {
    try {
      const dateParam = selectedDate ? `?date=${selectedDate}` : '';
      const [statsRes, attacksRes, settingsRes, websiteBlocksRes, trafficRes] = await Promise.all([
        fetch(`${API_URL}/stats${dateParam}`),
        fetch(`${API_URL}/attacks`),
        fetch(`${API_URL}/settings`),
        fetch(`${API_URL}/website-blocks`),
        fetch(`${API_URL}/traffic-summary${dateParam}`)
    ]);
    const statsData         = await statsRes.json();
    const attacksData       = await attacksRes.json();
    const settingsData      = await settingsRes.json();
    const websiteBlocksData = await websiteBlocksRes.json();
    const trafficSummary    = await trafficRes.json();

      setStats(statsData);
      setSettings(settingsData);
      setBlockedWebsites(websiteBlocksData);

      // กรองตามวันที่เลือก ถ้าไม่เลือกใช้วันนี้
      const todayISO = new Date().toLocaleDateString('sv-SE');
      const filterDate = selectedDate || todayISO;
      const todayAttacks = attacksData.filter(a => {
        const d = new Date(a.timestamp + '+07:00').toLocaleDateString('sv-SE');
        return d === filterDate;
      });

      setAttacks(todayAttacks.slice(0, 4));
      setAllAttacks(todayAttacks);

      // นับประเภทการโจมตีเฉพาะวันนี้
      const counts = {};
      todayAttacks.forEach(a => {
        const type = a.attack_type?.replace('[WARNING] ', '').replace('[BLOCK] ', '') || 'Unknown';
        counts[type] = (counts[type] || 0) + 1;
      });
      setAttackTypes(counts);

      // สร้าง traffic รายชั่วโมง 00:00 - 23:00
      const allHours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
      setTrafficData(allHours.map(h => ({ time: h, packets: trafficSummary[h] || 0 })));

      // สร้าง attackHourMap สำหรับ ReferenceDot + tooltip
      const aMap = {};
      todayAttacks.forEach(a => {
          const h = new Date(a.timestamp + '+07:00').getHours();
          const key = `${String(h).padStart(2, '0')}:00`;
          if (!aMap[key]) aMap[key] = [];
          aMap[key].push(a);
        });
      setAttackHourMap(aMap);

    } catch (e) {
      console.error(e);
    }
  };

  const getLevel = (attack_type) => attack_type?.includes('[WARNING]') ? 'WARN' : 'BLOCK';

  const getTimeAgo = (timestamp) => {
    const localTime = new Date(timestamp + '+07:00');
    const diff = Math.floor((new Date() - localTime) / 60000);
    if (diff < 1) return 'เมื่อกี้';
    if (diff < 60) return `${diff} นาทีที่แล้ว`;
    return `${Math.floor(diff / 60)} ชั่วโมงที่แล้ว`;
  };

  const maxAttack = Math.max(...Object.values(attackTypes), 1);

  const attackColors = {
    'ICMP Flood':  'var(--fill-danger)',
    'SYN Flood':   'var(--fill-warning)',
    'UDP Flood':   'var(--fill-warning)',
    'Port Scan':   'var(--fill-accent)',
    'Brute Force': 'var(--fill-accent)',
  };

  const thresholdKeys = [
    { name: 'ICMP Flood',  warn: 'icmp_flood_warn',  block: 'icmp_flood_block' },
    { name: 'SYN Flood',   warn: 'syn_flood_warn',   block: 'syn_flood_block' },
    { name: 'UDP Flood',   warn: 'udp_flood_warn',   block: 'udp_flood_block' },
    { name: 'Port Scan',   warn: 'port_scan_warn',   block: 'port_scan_block' },
    { name: 'Brute Force', warn: 'brute_force_warn', block: 'brute_force_block' },
  ];

  const getSetting = (key) => {
    const s = settings.find(s => s.key === key);
    return s ? s.value : '-';
  };

  const warnCount  = allAttacks.filter(a => a.attack_type?.includes('[WARNING]')).length;
  const blockCount = allAttacks.filter(a => a.attack_type?.includes('[BLOCK]')).length;

  // Custom Tooltip สำหรับกราฟ
  const TrafficTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const hourAttacks = attackHourMap[label] || [];
    return (
      <div style={{
        backgroundColor: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '12px',
        color: 'var(--text-primary)',
        minWidth: '190px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
      }}>
        <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
           {label}
        </div>
        <div style={{ color: 'var(--fill-accent)', marginBottom: hourAttacks.length ? '8px' : 0 }}>
          {payload[0].value.toLocaleString()} แพ็กเก็ต
        </div>
        {hourAttacks.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
            <div style={{ color: 'var(--text-danger)', fontWeight: 500, marginBottom: '5px' }}>
              ⚠️ {hourAttacks.length} การโจมตี
            </div>
            {hourAttacks.slice(0, 3).map((a, i) => {
              const type  = a.attack_type?.replace('[WARNING] ', '').replace('[BLOCK] ', '');
              const level = getLevel(a.attack_type);
              return (
                <div key={i} style={{
                  fontSize: '11px', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px'
                }}>
                  <span style={{
                    fontSize: '9px', padding: '1px 5px', borderRadius: '3px', fontWeight: 600,
                    background: level === 'WARN' ? 'var(--bg-warning)' : 'var(--bg-danger)',
                    color:      level === 'WARN' ? 'var(--text-warning)' : 'var(--text-danger)'
                  }}>{level}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{a.source_ip}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{type}</span>
                </div>
              );
            })}
            {hourAttacks.length > 3 && (
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                +{hourAttacks.length - 3} เพิ่มเติม
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const s = {
    dash: {
      padding: '1.5rem 0.5rem',
      background: 'var(--surface-0)',
      minHeight: '100%',
      fontFamily: 'var(--font-sans)'
    },
    header: {
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: '1.5rem'
    },
    headerLeft: { display: 'flex', flexDirection: 'column', gap: '4px' },

    stats: {
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px', marginBottom: '1.5rem'
    },
    statCard: {
      background: 'var(--surface-1)', border: '0.5px solid var(--border)',
      borderRadius: '14px', padding: '20px 22px'
    },
    statLabel: {
      fontSize: '13px', color: 'var(--text-secondary)',
      marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px'
    },
    statVal:  { fontSize: '32px', fontWeight: 600, color: 'var(--text-primary)' },
    statSub:  { fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' },
    mid: {
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      gap: '16px', marginBottom: '1.5rem'
    },
    card: {
      background: 'var(--surface-1)', border: '0.5px solid var(--border)',
      borderRadius: '14px', padding: '20px', minHeight: '320px'
    },
    cardTitle: {
      fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)',
      marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px'
    },
    barRow:   { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' },
    barLabel: { fontSize: '13px', color: 'var(--text-secondary)', width: '90px', flexShrink: 0 },
    barWrap:  { flex: 1, height: '10px', background: 'var(--border)', borderRadius: '5px', overflow: 'hidden' },
    barCount: { fontSize: '13px', color: 'var(--text-muted)', width: '32px', textAlign: 'right' },
    attackItem: {
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '12px 14px', background: 'var(--surface-0)',
      borderRadius: 'var(--radius)', border: '0.5px solid var(--border)', marginBottom: '10px'
    },
    bottom: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    thRow: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0', borderBottom: '0.5px solid var(--border)'
    },
  };

  return (
    <div style={s.dash}>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>ภาพรวมระบบ</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {selectedDate
              ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
              : new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)',
              borderRadius: '8px', color: 'var(--text-primary)',
              fontSize: '13px', outline: 'none', cursor: 'pointer'
            }}
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              style={{
                padding: '6px 12px', borderRadius: '8px',
                border: '1px solid var(--input-border)',
                backgroundColor: 'var(--input-bg)', color: 'var(--text-muted)',
                fontSize: '12px', cursor: 'pointer'
              }}
            >
              วันนี้
            </button>
          )}

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
          <div style={s.statSub}>สะสมทั้งหมด</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>
            <i className="ti ti-alert-triangle" style={{ fontSize: '13px', color: 'var(--text-warning)' }} aria-hidden="true"></i>
            การโจมตีที่พบ
          </div>
          <div style={{ ...s.statVal, color: 'var(--text-warning)' }}>{allAttacks.length}</div>
          <div style={s.statSub}>
            <span style={{ color: 'var(--text-warning)' }}>{warnCount} WARN</span>
            {' · '}
            <span style={{ color: 'var(--text-danger)' }}>{blockCount} BLOCK</span>
            {' · '}{selectedDate || 'วันนี้'}
          </div>
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
        {/* Traffic Area Chart */}
        <div style={s.card}>
          <div style={s.cardTitle}>
            <i className="ti ti-chart-area-line" aria-hidden="true"></i>
            Traffic {selectedDate || 'วันนี้'}
            {/* Legend */}
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', fontWeight: 400 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-accent)' }}>
                <span style={{ width: 16, height: 2, background: 'var(--fill-accent)', display: 'inline-block', borderRadius: 2 }} />
                ปกติ
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-danger)' }}>
                <span style={{ width: 8, height: 8, background: 'var(--fill-danger)', display: 'inline-block', borderRadius: '50%' }} />
                โจมตี
              </span>
            </span>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
            แพ็กเก็ต/ชั่วโมง · hover ที่จุดแดงเพื่อดูรายละเอียด
          </div>

          {trafficData.every(d => d.packets === 0) ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
              ยังไม่มีข้อมูล Traffic
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trafficData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--fill-accent)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--fill-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />

                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border)' }}
                  interval={2}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  domain={[0, dataMax => Math.max(dataMax * 1.3, 10)]}
                />

                <Tooltip content={<TrafficTooltip />} />

                <Area
                  type="monotone"
                  dataKey="packets"
                  stroke="var(--fill-accent)"
                  strokeWidth={2}
                  fill="url(#trafficGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: 'var(--fill-accent)', strokeWidth: 0 }}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />

                {/* Red marker dots at attack hours */}
                {Object.entries(attackHourMap).map(([hour, hourAtks]) => {
                  const point = trafficData.find(d => d.time === hour);
                  if (!point) return null;
                  return (
                    <ReferenceDot
                      key={hour}
                      x={hour}
                      y={point.packets}
                      r={5}
                      fill="var(--fill-danger)"
                      stroke="var(--surface-1)"
                      strokeWidth={2}
                    />
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
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
              const type  = a.attack_type?.replace('[WARNING] ', '').replace('[BLOCK] ', '') || 'Unknown';
              return (
                <div key={i} style={s.attackItem}>
                  <span style={{
                    fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                    fontWeight: 500, flexShrink: 0,
                    background: level === 'WARN' ? 'var(--bg-warning)' : 'var(--bg-danger)',
                    color:      level === 'WARN' ? 'var(--text-warning)' : 'var(--text-danger)'
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
                <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-warning)', color: 'var(--text-warning)' }}>
                  W: {getSetting(t.warn)}
                </span>
                <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-danger)', color: 'var(--text-danger)' }}>
                  B: {getSetting(t.block)}
                </span>
              </div>
            </div>
          ))}
        </div>

        

      </div>
    </div>
  );
}

export default Dashboard;