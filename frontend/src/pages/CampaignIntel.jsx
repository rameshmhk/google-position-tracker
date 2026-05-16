import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/apiConfig';

const CampaignIntel = () => {
  const { name } = useParams();
  const [clickData, setClickData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState({ type: 'all', value: null });
  const [sortConfig, setSortConfig] = useState({ key: 'clickedAt', direction: 'desc' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [name]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { window.location.href = '/login'; return; }
      const res = await fetch(`${API_BASE_URL}/api/track-data`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const campaignName = decodeURIComponent(name);
          const filtered = data.data.filter(c => (c.adContent || 'Direct/Unknown') === campaignName);
          setClickData(filtered);
        }
      }
    } catch (err) {
      console.error('Error fetching campaign data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ background: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Loading Campaign Intelligence...</div>;

  const totalClicks = clickData.length;
  const conversions = clickData.filter(c => c.formInteracted).length;
  const uniqueIPs = new Set(clickData.map(c => c.ipAddress)).size;
  const fraudDetected = clickData.filter(c => c.isSuspicious).length;
  const totalRevenue = clickData.reduce((acc, c) => acc + (c.revenue || 0), 0);

  // Filter Logic
  // Filter Logic
  const displayData = clickData.filter(c => {
    if (activeFilter.type === 'conversion') return c.formInteracted;
    if (activeFilter.type === 'revenue') return (c.revenue || 0) > 0;
    if (activeFilter.type === 'fraud') return c.isSuspicious;
    if (activeFilter.type === 'device') return c.deviceType === activeFilter.value;
    return true;
  });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...displayData].sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];
    
    if (sortConfig.key === 'clickedAt') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    }

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />
      
      <main style={{ maxWidth: '1400px', margin: '40px auto 100px', padding: '0 20px' }}>
        {/* Back Button */}
        <button 
          onClick={() => navigate('/ad-tracker')}
          style={{ 
            background: 'rgba(15, 23, 42, 0.05)', 
            border: '1px solid rgba(15, 23, 42, 0.1)', 
            color: '#64748b', 
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
            e.currentTarget.style.background = 'rgba(15, 23, 42, 0.1)';
            e.currentTarget.style.color = '#0f172a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(15, 23, 42, 0.05)';
            e.currentTarget.style.color = '#64748b';
          }}
        >
          ← Back to Ad Tracker
        </button>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '900', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>Ad Intelligence Report</div>
              <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0, color: '#0f172a' }}>📢 {decodeURIComponent(name)}</h1>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {activeFilter.type !== 'all' && (
              <button 
                onClick={() => setActiveFilter({ type: 'all', value: null })}
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}
              >
                ✕ Clear Filter
              </button>
            )}
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>DATA REFRESHED</div>
            <div style={{ background: '#dcfce7', color: '#15803d', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '900' }}>LIVE UPDATES ACTIVE</div>
          </div>
        </div>

        {/* Core Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '25px', marginBottom: '40px' }}>
          <MetricBlock 
            title="Total Traffic" 
            value={totalClicks} 
            sub="Individual Clicks" 
            color="#0f172a" 
            icon="📈" 
            onClick={() => setActiveFilter({ type: 'all', value: null })}
            active={activeFilter.type === 'all'}
          />
          <MetricBlock 
            title="Conversions" 
            value={conversions} 
            sub={`${((conversions/totalClicks)*100).toFixed(1)}% Conv. Rate`} 
            color="#10b981" 
            icon="💰" 
            onClick={() => setActiveFilter({ type: 'conversion', value: true })}
            active={activeFilter.type === 'conversion'}
          />
          <MetricBlock 
            title="Revenue Generated" 
            value={`$${totalRevenue.toLocaleString()}`} 
            sub="Direct Ad Revenue" 
            color="#3b82f6" 
            icon="💎" 
            onClick={() => setActiveFilter({ type: 'revenue', value: true })}
            active={activeFilter.type === 'revenue'}
          />
          <MetricBlock 
            title="Fraud Prevented" 
            value={fraudDetected} 
            sub="Blocked Attempts" 
            color="#ef4444" 
            icon="🛡️" 
            onClick={() => setActiveFilter({ type: 'fraud', value: true })}
            active={activeFilter.type === 'fraud'}
          />
        </div>

        {/* Main Content Area */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px' }}>
          
          {/* Detailed Visitor Log */}
          <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '25px 30px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>
                {activeFilter.type === 'all' ? 'Full Attribution History' : 
                 activeFilter.type === 'conversion' ? 'Successful Conversions' :
                 activeFilter.type === 'revenue' ? 'Revenue Generating Hits' :
                 activeFilter.type === 'fraud' ? 'Fraudulent Attempts' :
                 `Device: ${activeFilter.value.toUpperCase()}`}
              </h2>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Showing {displayData.length} records</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    <th onClick={() => requestSort('ipAddress')} style={{ ...thStyle, cursor: 'pointer' }}>
                      Visitor IP {sortConfig.key === 'ipAddress' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th onClick={() => requestSort('clickedAt')} style={{ ...thStyle, cursor: 'pointer' }}>
                      Timestamp {sortConfig.key === 'clickedAt' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th onClick={() => requestSort('city')} style={{ ...thStyle, cursor: 'pointer' }}>
                      Location {sortConfig.key === 'city' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th onClick={() => requestSort('formInteracted')} style={{ ...thStyle, cursor: 'pointer' }}>
                      Form Status {sortConfig.key === 'formInteracted' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th onClick={() => requestSort('revenue')} style={{ ...thStyle, cursor: 'pointer' }}>
                      Revenue {sortConfig.key === 'revenue' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th style={thStyle}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.length > 0 ? sortedData.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: '900', color: '#1e293b', fontFamily: 'monospace' }}>{c.ipAddress}</div>
                        {c.isReturning && <span style={{ fontSize: '9px', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>RECURRING</span>}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{new Date(c.clickedAt).toLocaleDateString()}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{new Date(c.clickedAt).toLocaleTimeString()}</div>
                      </td>
                      <td style={tdStyle}>📍 {c.city}, {c.country}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.formInteracted ? '#10b981' : '#cbd5e1' }}></div>
                          <span style={{ fontWeight: 'bold', color: c.formInteracted ? '#10b981' : '#64748b', fontSize: '12px' }}>
                            {c.formInteracted ? 'CONVERTED' : 'BOUNCED'}
                          </span>
                        </div>
                      </td>
                      <td style={tdStyle}>
                         <div style={{ fontWeight: '900', color: c.revenue > 0 ? '#059669' : '#94a3b8' }}>
                           {c.revenue > 0 ? `$${c.revenue}` : '—'}
                         </div>
                      </td>
                      <td style={tdStyle}>
                        <button 
                          onClick={() => navigate(c.isReturning ? `/gold-user/${c.ipAddress}` : `/ip-story/${c.ipAddress}`)}
                          style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', color: '#1e293b' }}
                        >
                          Deep Scan →
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontWeight: 'bold' }}>
                        No records found matching this segment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side Intelligence */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ background: '#0f172a', borderRadius: '24px', padding: '30px', color: '#fff' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '14px', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px' }}>Device Distribution (Click to Filter)</h3>
              {(() => {
                const devices = clickData.reduce((acc, c) => {
                  acc[c.deviceType] = (acc[c.deviceType] || 0) + 1;
                  return acc;
                }, {});
                return Object.entries(devices).map(([type, count]) => (
                  <div 
                    key={type} 
                    onClick={() => setActiveFilter({ type: 'device', value: type })}
                    style={{ 
                      marginBottom: '15px', 
                      cursor: 'pointer',
                      padding: '10px',
                      borderRadius: '12px',
                      background: activeFilter.value === type ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                      border: activeFilter.value === type ? '1px solid #3b82f6' : '1px solid transparent',
                      transition: '0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 'bold' }}>{type}</span>
                      <span style={{ color: '#94a3b8' }}>{((count/totalClicks)*100).toFixed(0)}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${(count/totalClicks)*100}%`, height: '100%', background: '#3b82f6' }}></div>
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div style={{ background: '#fff', borderRadius: '24px', padding: '30px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '900' }}>Campaign Strength</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <IntelligenceRow label="Unique Visitors" value={uniqueIPs} />
                <IntelligenceRow label="Retention Rate" value={`${((clickData.filter(c => c.isReturning).length / totalClicks)*100).toFixed(1)}%`} />
                <IntelligenceRow label="Avg. Load Time" value={`${(clickData.reduce((acc, c) => acc + (c.pageLoadTime || 0), 0) / totalClicks).toFixed(0)}ms`} />
                <IntelligenceRow label="Lead Quality" value="HIGH" color="#10b981" />
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

const MetricBlock = ({ title, value, sub, color, icon, onClick, active }) => (
  <div 
    onClick={onClick}
    style={{ 
      background: '#fff', 
      padding: '30px', 
      borderRadius: '24px', 
      border: active ? `2px solid ${color}` : '1px solid #e2e8f0', 
      boxShadow: active ? `0 10px 15px -3px ${color}20` : '0 4px 6px -1px rgba(0,0,0,0.02)',
      cursor: onClick ? 'pointer' : 'default',
      transition: '0.3s all ease',
      transform: active ? 'translateY(-5px)' : 'none'
    }}
  >
    <div style={{ fontSize: '24px', marginBottom: '10px' }}>{icon}</div>
    <div style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{title}</div>
    <div style={{ fontSize: '28px', fontWeight: '900', color: color, marginBottom: '4px' }}>{value}</div>
    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8' }}>{sub}</div>
    {active && <div style={{ fontSize: '10px', color: color, fontWeight: 'bold', marginTop: '8px' }}>● FILTERING ACTIVE</div>}
  </div>
);

const IntelligenceRow = ({ label, value, color = '#1e293b' }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>{label}</span>
    <span style={{ fontSize: '14px', fontWeight: '900', color: color }}>{value}</span>
  </div>
);

const thStyle = { padding: '15px 20px', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle = { padding: '15px 20px', fontSize: '13px', color: '#334155' };

export default CampaignIntel;
