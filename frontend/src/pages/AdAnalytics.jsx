import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/apiConfig';

const AdAnalytics = () => {
  const [adData, setAdData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'revenue', direction: 'desc' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/track-data`);
      const data = await res.json();
      if (data.success) {
        const map = {};
        data.data.forEach(c => {
          const content = c.adContent || 'Direct/Unknown';
          if (!map[content]) {
            map[content] = { 
              name: content,
              clicks: 0, 
              conversions: 0, 
              revenue: 0, 
              fraud: 0,
              uniqueIps: new Set(),
              source: c.source || 'N/A',
              avgLoadTime: 0,
              totalLoadTime: 0
            };
          }
          map[content].clicks++;
          map[content].uniqueIps.add(c.ipAddress);
          map[content].totalLoadTime += (c.pageLoadTime || 800);
          if (c.formInteracted) map[content].conversions++;
          if (c.revenue) map[content].revenue += c.revenue;
          if (c.isSuspicious) map[content].fraud++;
        });

        const processed = Object.values(map).map(item => ({
          ...item,
          uniqueCount: item.uniqueIps.size,
          convRate: ((item.conversions / item.clicks) * 100).toFixed(1),
          avgLoadTime: (item.totalLoadTime / item.clicks).toFixed(0),
          qualityScore: Math.min(100, Math.max(0, (item.conversions/item.clicks*500) + (100 - (item.fraud/item.clicks*100)))).toFixed(0)
        }));
        setAdData(processed);
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

  const filteredData = adData.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const sortedData = [...filteredData].sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />
      <main style={{ maxWidth: '1400px', margin: '40px auto 100px', padding: '0 20px' }}>
        
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

        {/* Advanced Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ background: '#3b82f6', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '900' }}>ENTERPRISE</span>
              <div style={{ fontSize: '11px', fontWeight: '900', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '2px' }}>Forensic Ad Intelligence</div>
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>Ads Performance Leaderboard</h1>
            <p style={{ color: '#94a3b8', fontSize: '16px', marginTop: '5px' }}>Deep attribution analysis for every individual ad creative and campaign set.</p>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search Ad Sets..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '12px 20px 12px 45px', borderRadius: '12px', outline: 'none', width: '300px' }}
              />
              <span style={{ position: 'absolute', left: '15px', top: '12px', color: '#64748b' }}>🔍</span>
            </div>
          </div>
        </div>

        {/* Analytics Ledger */}
        <div style={{ background: '#1e293b', borderRadius: '24px', border: '1px solid #334155', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <th onClick={() => requestSort('name')} style={{ ...thStyle, cursor: 'pointer' }}>
                  Ad Creative / Content {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('clicks')} style={{ ...thStyle, cursor: 'pointer' }}>
                  Volume {sortConfig.key === 'clicks' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('qualityScore')} style={{ ...thStyle, cursor: 'pointer' }}>
                  Quality Score {sortConfig.key === 'qualityScore' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('convRate')} style={{ ...thStyle, cursor: 'pointer' }}>
                  Success Rate {sortConfig.key === 'convRate' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('revenue')} style={{ ...thStyle, cursor: 'pointer' }}>
                  Revenue {sortConfig.key === 'revenue' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('fraud')} style={{ ...thStyle, cursor: 'pointer' }}>
                  Forensic Alert {sortConfig.key === 'fraud' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th style={thStyle}>Intelligence</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ padding: '100px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>Initializing Forensic Analysis...</div>
                </td></tr>
              ) : sortedData.map((d, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: '0.2s' }}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ fontSize: '24px' }}>📢</div>
                      <div>
                        <div style={{ fontWeight: '900', color: '#fff', fontSize: '15px' }}>{d.name}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase', marginTop: '2px' }}>{d.source} NETWORK</div>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontSize: '16px', fontWeight: '900' }}>{d.clicks}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{d.uniqueCount} Unique Users</div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', width: '60px' }}>
                        <div style={{ width: `${d.qualityScore}%`, height: '100%', background: d.qualityScore > 70 ? '#10b981' : (d.qualityScore > 40 ? '#f59e0b' : '#ef4444'), borderRadius: '3px' }}></div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '900', color: d.qualityScore > 70 ? '#10b981' : '#f59e0b' }}>{d.qualityScore}%</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#fff' }}>{d.convRate}%</div>
                    <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>{d.conversions} CONVERSIONS</div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#10b981' }}>${d.revenue.toLocaleString()}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Avg ${ (d.revenue / (d.conversions || 1)).toFixed(0) }/Order</div>
                  </td>
                  <td style={tdStyle}>
                    {d.fraud > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontWeight: '900', fontSize: '12px' }}>
                        🛡️ {d.fraud} DETECTED
                      </div>
                    ) : (
                      <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '12px' }}>✅ VERIFIED CLEAN</div>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <button 
                      onClick={() => navigate(`/campaign-intel/${encodeURIComponent(d.name)}`)}
                      style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '10px 18px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', transition: '0.3s' }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.color = '#fff'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; e.currentTarget.style.color = '#3b82f6'; }}
                    >
                      VIEW EVIDENCE →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const thStyle = { padding: '20px', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' };
const tdStyle = { padding: '20px', fontSize: '14px', color: '#f1f5f9' };

export default AdAnalytics;
