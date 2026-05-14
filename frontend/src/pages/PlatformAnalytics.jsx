import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/apiConfig';

const PlatformAnalytics = () => {
  const [platformData, setPlatformData] = useState([]);
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
          const source = c.source || 'Direct Traffic';
          if (!map[source]) {
            map[source] = { 
              name: source,
              clicks: 0, 
              conversions: 0, 
              revenue: 0, 
              fraud: 0,
              uniqueIps: new Set(),
              campaigns: new Set(),
              totalLoadTime: 0
            };
          }
          map[source].clicks++;
          map[source].uniqueIps.add(c.ipAddress);
          if (c.campaignName) map[source].campaigns.add(c.campaignName);
          map[source].totalLoadTime += (c.pageLoadTime || 800);
          if (c.formInteracted) map[source].conversions++;
          if (c.revenue) map[source].revenue += c.revenue;
          if (c.isSuspicious) map[source].fraud++;
        });

        const processed = Object.values(map).map(item => ({
          ...item,
          campaignCount: item.campaigns.size,
          uniqueCount: item.uniqueIps.size,
          convRate: ((item.conversions / item.clicks) * 100).toFixed(1),
          avgLoadTime: (item.totalLoadTime / item.clicks).toFixed(0),
          qualityScore: Math.min(100, Math.max(0, (item.conversions/item.clicks*500) + (100 - (item.fraud/item.clicks*100)))).toFixed(0)
        }));
        setPlatformData(processed);
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

  const filteredData = platformData.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

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
              <span style={{ background: '#3b82f6', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '900' }}>PLATFORM HUB</span>
              <div style={{ fontSize: '11px', fontWeight: '900', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '2px' }}>Forensic Network Intelligence</div>
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>Platform Master Leaderboard</h1>
            <p style={{ color: '#94a3b8', fontSize: '16px', marginTop: '5px' }}>Unified performance auditing across Google, Meta, LinkedIn, and more.</p>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search Networks..." 
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
                  Advertising Network {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('campaignCount')} style={{ ...thStyle, cursor: 'pointer' }}>
                  Campaigns {sortConfig.key === 'campaignCount' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('clicks')} style={{ ...thStyle, cursor: 'pointer' }}>
                  Volume {sortConfig.key === 'clicks' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('convRate')} style={{ ...thStyle, cursor: 'pointer' }}>
                  Conversion {sortConfig.key === 'convRate' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('revenue')} style={{ ...thStyle, cursor: 'pointer' }}>
                  ROI ($) {sortConfig.key === 'revenue' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('fraud')} style={{ ...thStyle, cursor: 'pointer' }}>
                  Forensic Health {sortConfig.key === 'fraud' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th style={thStyle}>Action</th>
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
                       <div style={{ 
                               width: '40px', height: '40px', borderRadius: '12px', 
                               background: d.name.toLowerCase().includes('google') ? '#4285F4' : 
                                          (d.name.toLowerCase().includes('facebook') ? '#1877F2' : 
                                          (d.name.toLowerCase().includes('instagram') ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' : 
                                          (d.name.toLowerCase().includes('linkedin') ? '#0A66C2' :
                                          (d.name.toLowerCase().includes('youtube') ? '#FF0000' :
                                          (d.name.toLowerCase().includes('twitter') ? '#1DA1F2' : '#334155'))))),
                               display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
                             }}>
                               {d.name.charAt(0).toUpperCase()}
                             </div>
                      <div>
                        <div style={{ fontWeight: '900', color: '#fff', fontSize: '15px' }}>{d.name}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase', marginTop: '2px' }}>VERIFIED NETWORK</div>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' }}>
                      {d.campaignCount} Campaigns
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontSize: '16px', fontWeight: '900' }}>{d.clicks}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{d.uniqueCount} Unique Users</div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#fff' }}>{d.convRate}%</div>
                    <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>{d.conversions} CONVERSIONS</div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#10b981' }}>${d.revenue.toLocaleString()}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Net Attribution</div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', width: '60px' }}>
                        <div style={{ width: `${Math.max(10, 100 - (d.fraud/d.clicks*100))}%`, height: '100%', background: d.fraud/d.clicks > 0.2 ? '#ef4444' : '#10b981', borderRadius: '3px' }}></div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '900', color: d.fraud/d.clicks > 0.2 ? '#ef4444' : '#10b981' }}>{d.fraud} Fraud</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <button 
                      onClick={() => navigate('/ad-tracker')}
                      style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '10px 18px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', transition: '0.3s' }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.color = '#fff'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; e.currentTarget.style.color = '#3b82f6'; }}
                    >
                      VIEW AUDIT →
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

export default PlatformAnalytics;
