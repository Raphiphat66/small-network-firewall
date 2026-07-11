import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';

const API_URL = 'http://127.0.0.1:8000';

const COLORS = ['#1a56db', '#ef4444', '#f59e0b', '#16a34a'];

const shortTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
};

function Dashboard() {
  const [stats, setStats] = useState({ total_packets: 0, total_attacks: 0, total_blocked: 0 });
  const [packets, setPackets] = useState([]);
  const [protocolData, setProtocolData] = useState([]);
  const [trafficHistory, setTrafficHistory] = useState([]);
  const prevPacketCount = useRef(0);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const statsRes = await fetch(`${API_URL}/stats`);
      const statsData = await statsRes.json();
      setStats(statsData);

      const packetsRes = await fetch(`${API_URL}/packets`);
      const packetsData = await packetsRes.json();
      setPackets(packetsData.slice(0, 20));

      const protocolCount = {};
      packetsData.forEach(p => {
        protocolCount[p.protocol] = (protocolCount[p.protocol] || 0) + 1;
      });
      setProtocolData(Object.entries(protocolCount).map(([name, value]) => ({ name, value })));

      const newTotal = statsData.total_packets;
      const delta = Math.max(0, newTotal - prevPacketCount.current);
      prevPacketCount.current = newTotal;

      let inbound = 0;
      let outbound = 0;

      if (packetsData.length > 0 && packetsData[0].direction !== undefined) {
        packetsData.forEach(p => { if (p.direction === 'in') inbound++; else outbound++; });
        inbound = Math.round((inbound / packetsData.length) * delta);
        outbound = Math.round((outbound / packetsData.length) * delta);
      } else {
        const recent = packetsData.slice(0, 50);
        const inRatio = recent.filter(p => p.port < 1024).length / (recent.length || 1);
        inbound = Math.round(delta * inRatio);
        outbound = delta - inbound;
      }

      setTrafficHistory(prev => [...prev, { time: shortTime(), in: inbound, out: outbound }].slice(-20));

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const tooltipStyle = {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    color: '#111827',
    fontSize: '13px'
  };

  return (
    <div>
      <h2 style={{ color: '#111827', fontSize: '20px', marginBottom: '20px' }}>📊 Dashboard</h2>

      {/* Stats Cards */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', flex: 1, textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 8px' }}>แพ็กเก็ตทั้งหมด</p>
          <h2 style={{ color: '#1a56db', margin: 0, fontSize: '32px' }}>{stats.total_packets}</h2>
        </div>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', flex: 1, textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 8px' }}>การโจมตีที่พบ</p>
          <h2 style={{ color: '#ef4444', margin: 0, fontSize: '32px' }}>{stats.total_attacks}</h2>
        </div>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', flex: 1, textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 8px' }}>IP ที่บล็อกอยู่</p>
          <h2 style={{ color: '#f59e0b', margin: 0, fontSize: '32px' }}>{stats.total_blocked}</h2>
        </div>
      </div>

      {/* Traffic Chart */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', marginBottom: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ color: '#111827', margin: 0, fontSize: '16px' }}>ทราฟฟิกขาเข้า / ขาออก</h3>
          <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280' }}>
              <span style={{ width: 12, height: 3, background: '#1a56db', display: 'inline-block', borderRadius: 2 }} />
              ขาเข้า (Inbound)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280' }}>
              <span style={{ width: 12, height: 3, background: '#ef4444', display: 'inline-block', borderRadius: 2 }} />
              ขาออก (Outbound)
            </span>
          </div>
        </div>
        {trafficHistory.length === 0 ? (
          <div style={{ color: '#9ca3af', textAlign: 'center', padding: '40px 0' }}>กำลังรอข้อมูล...</div>
        ) : (
        <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trafficHistory} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1a56db" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#1a56db" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#6b7280', marginBottom: 4 }} formatter={(value, name) => [value, name === 'in' ? 'ขาเข้า' : 'ขาออก']} />
            <Area type="natural" dataKey="in" stroke="#1a56db" strokeWidth={2.5} fill="url(#colorIn)" dot={false} activeDot={{ r: 4, fill: '#1a56db' }} animationDuration={2000} animationEasing="ease-in-out" isAnimationActive={true} />
            <Area type="natural" dataKey="out" stroke="#ef4444" strokeWidth={2.5} fill="url(#colorOut)" dot={false} activeDot={{ r: 4, fill: '#ef4444' }} animationDuration={2000} animationEasing="ease-in-out" isAnimationActive={true} />
        </AreaChart>
        </ResponsiveContainer>
        )}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'flex', gap: '20px' }}>

        {/* Protocol Pie */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ color: '#111827', fontSize: '16px', marginBottom: '12px' }}>สัดส่วน Protocol</h3>
          <PieChart width={300} height={300}>
            <Pie data={protocolData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
              {protocolData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
          </PieChart>
        </div>

        {/* Recent Packets */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', flex: 1, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ color: '#111827', fontSize: '16px', marginBottom: '12px' }}>แพ็กเก็ตล่าสุด</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>Source IP</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>Protocol</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>Port</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#374151', fontWeight: '600' }}>เวลา</th>
              </tr>
            </thead>
            <tbody>
              {packets.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '10px 12px', color: '#111827' }}>{p.source_ip}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      backgroundColor: p.protocol === 'TCP' ? '#dbeafe' : p.protocol === 'UDP' ? '#fef3c7' : '#fee2e2',
                      color: p.protocol === 'TCP' ? '#1d4ed8' : p.protocol === 'UDP' ? '#b45309' : '#dc2626',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {p.protocol}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#374151' }}>{p.port}</td>
                  <td style={{ padding: '10px 12px', color: '#6b7280' }}>{p.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;