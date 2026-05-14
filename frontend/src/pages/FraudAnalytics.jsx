import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/apiConfig';

const FraudAnalytics = () => {
  const [clickData, setClickData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all'); // all, vpn, multi, bot
  const [sortConfig, setSortConfig] = useState({ key: 'clickedAt', direction: 'desc' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/track-data`);
      const data = await res.json();
      if (data.success) {
        setClickData(data.data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Process Fraud Logic
  const getFraudAnalysis = () => {
    const ipCounts = {};
    clickData.forEach(c => {
      ipCounts[c.ipAddress] = (ipCounts[c.ipAddress] || 0) + 1;
    });

    let rawFraud = clickData.map(c => {
      const reasons = [];
      if (c.isSuspicious) reasons.push(c.suspicionReason || 'Suspicious Activity');
      if (ipCounts[c.ipAddress] > 3) reasons.push(`High Frequency (${ipCounts[c.ipAddress]} clicks)`);
      if (c.timeOnSite < 2 && c.visitCount === 1) reasons.push('Bot-like Bounce');
      
      const isVPN = reasons.some(r => r.toLowerCase().includes('vpn') || r.toLowerCase().includes('proxy'));
      const isMulti = reasons.some(r => r.toLowerCase().includes('frequency'));
      const isBot = reasons.some(r => r.toLowerCase().includes('bounce'));

      return { 
        ...c, 
        fraudReasons: reasons, 
        isFraud: reasons.length > 0,
        type: isVPN ? 'vpn' : (isMulti ? 'multi' : (isBot ? 'bot' : 'other'))
      };
    }).filter(c => c.isFraud);

    // Apply Sorting
    if (sortConfig.key) {
      rawFraud.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        if (sortConfig.key === 'location') {
          valA = `${a.city}, ${a.country}`;
          valB = `${b.city}, ${b.country}`;
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return rawFraud;
  };

  const fraudData = getFraudAnalysis();
  
  // Apply Category & Search Filter
  const filteredFraud = fraudData.filter(c => {
    const matchesSearch = c.ipAddress.includes(searchTerm);
    if (activeCategory === 'all') return matchesSearch;
    return matchesSearch && c.type === activeCategory;
  });

  const stats = {
    total: fraudData.length,
    vpn: fraudData.filter(c => c.type === 'vpn').length,
    multi: fraudData.filter(c => c.type === 'multi').length,
    bots: fraudData.filter(c => c.type === 'bot').length
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />
      
      <main style={{ maxWidth: '1200px', margin: '60px auto', padding: '0 20px' }}>
        
        
        {/* Back Button */}
        <button 
          onClick={() => navigate('/ad-tracker')}
          style={{ 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            color: '#94a3b8', 
            padding: '10px 20px', 
            borderRadius: '12px', 
            fontSize: '14px', 
            fontWeight: 'bold', 
            cursor: 'pointer', 
            marginBottom: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: '0.3s all'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          ← Back to Ad Tracker
        </button>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
              <span style={{ fontSize: '40px' }}>🛡️</span>
              <h1 style={{ fontSize: '36px', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>Fraud & Forensic Intelligence</h1>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '16px' }}>Autonomous detection of ad-fraud, click farms, and malicious bot traffic.</p>
          </div>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search Malicious IP..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '12px 20px 12px 45px', borderRadius: '12px', outline: 'none', width: '300px' }}
            />
            <span style={{ position: 'absolute', left: '15px', top: '12px', color: '#64748b' }}>🔍</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
          <StatCard 
            title="Total Threats" 
            value={stats.total} 
            color="#ef4444" 
            icon="🔥" 
            isActive={activeCategory === 'all'} 
            onClick={() => setActiveCategory('all')} 
          />
          <StatCard 
            title="VPN/Proxy" 
            value={stats.vpn} 
            color="#f59e0b" 
            icon="🕵️" 
            isActive={activeCategory === 'vpn'} 
            onClick={() => setActiveCategory('vpn')} 
          />
          <StatCard 
            title="Click Spams" 
            value={stats.multi} 
            color="#3b82f6" 
            icon="🖱️" 
            isActive={activeCategory === 'multi'} 
            onClick={() => setActiveCategory('multi')} 
          />
          <StatCard 
            title="Bot Bounces" 
            value={stats.bots} 
            color="#8b5cf6" 
            icon="🤖" 
            isActive={activeCategory === 'bot'} 
            onClick={() => setActiveCategory('bot')} 
          />
        </div>

        {/* Distribution Chart */}
        <div style={{ background: '#1e293b', padding: '30px', borderRadius: '32px', border: '1px solid #334155', marginBottom: '40px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            Threat Distribution Analysis
          </h3>
          <div style={{ display: 'flex', gap: '10px', height: '40px' }}>
            {stats.total > 0 && [
              { label: 'VPN', count: stats.vpn, color: '#f59e0b' },
              { label: 'Multi-Click', count: stats.multi, color: '#3b82f6' },
              { label: 'Bots', count: stats.bots, color: '#8b5cf6' },
              { label: 'Other', count: stats.total - stats.vpn - stats.multi - stats.bots, color: '#ef4444' }
            ].map(seg => {
              const width = (seg.count / stats.total) * 100;
              if (width === 0) return null;
              return (
                <div key={seg.label} style={{ width: `${width}%`, background: seg.color, height: '100%', borderRadius: '8px', transition: '0.5s', position: 'relative' }} title={`${seg.label}: ${seg.count}`}>
                   <div style={{ position: 'absolute', top: '-25px', left: 0, fontSize: '10px', fontWeight: 'bold', color: seg.color }}>{seg.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Forensic Log */}
        <div style={{ background: '#1e293b', borderRadius: '32px', border: '1px solid #334155', overflow: 'hidden' }}>
          <div style={{ padding: '25px 30px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>Malicious Session Ledger</h3>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>{filteredFraud.length} LIVE THREATS DETECTED</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid #334155' }}>
                <th 
                  onClick={() => requestSort('ipAddress')}
                  style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
                >
                  Attacker IP {sortConfig.key === 'ipAddress' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th 
                  onClick={() => requestSort('location')}
                  style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
                >
                  Location / ISP {sortConfig.key === 'location' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th style={thStyle}>Threat Signatures</th>
                <th 
                  onClick={() => requestSort('os')}
                  style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
                >
                  Platform {sortConfig.key === 'os' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th style={thStyle}>Forensics</th>
              </tr>
            </thead>
            <tbody>
              {filteredFraud.map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #334155', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: '900', color: '#fff', fontSize: '15px' }}>{c.ipAddress}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{new Date(c.clickedAt).toLocaleString()}</div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: '700' }}>{c.city}, {c.country}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{c.isp}</div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {c.fraudReasons.map((r, idx) => {
                        const isInfrastructure = r.toLowerCase().includes('vpn') || r.toLowerCase().includes('proxy');
                        return (
                          <span key={idx} style={{ 
                            background: isInfrastructure ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                            color: isInfrastructure ? '#93c5fd' : '#fca5a5', 
                            padding: '4px 10px', 
                            borderRadius: '6px', 
                            fontSize: '10px', 
                            fontWeight: '900', 
                            border: `1px solid ${isInfrastructure ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {isInfrastructure ? '🛡️' : '🚩'} {r.toUpperCase()}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: '700' }}>{c.deviceType}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{c.browser} on {c.os}</div>
                  </td>
                  <td style={tdStyle}>
                    <button 
                      onClick={() => navigate(`/ip-story/${c.ipAddress}`)}
                      style={{ background: '#f8fafc', color: '#0f172a', border: 'none', padding: '8px 15px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', transition: '0.2s' }}
                      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      VIEW EVIDENCE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredFraud.length === 0 && (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>🛡️</div>
              <div style={{ fontWeight: 'bold' }}>No fraud signatures detected for your current filters.</div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

const StatCard = ({ title, value, color, icon, isActive, onClick }) => (
  <div 
    onClick={onClick}
    style={{ 
      background: '#1e293b', 
      padding: '25px', 
      borderRadius: '24px', 
      border: isActive ? `2px solid ${color}` : '1px solid #334155', 
      position: 'relative', 
      overflow: 'hidden',
      cursor: 'pointer',
      transition: '0.3s',
      boxShadow: isActive ? `0 0 20px ${color}30` : 'none',
      transform: isActive ? 'scale(1.02)' : 'scale(1)'
    }}
  >
    <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '60px', opacity: 0.05 }}>{icon}</div>
    <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>{title}</div>
    <div style={{ fontSize: '36px', fontWeight: '900', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
      {value}
    </div>
    <div style={{ height: '4px', width: isActive ? '100%' : '40px', background: color, borderRadius: '2px', marginTop: '10px', transition: '0.5s' }}></div>
  </div>
);

const thStyle = { padding: '20px 30px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' };
const tdStyle = { padding: '20px 30px', fontSize: '13px' };

export default FraudAnalytics;
