import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/apiConfig';

const KeywordIntel = () => {
  const { keyword } = useParams();
  const [clickData, setClickData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState({ type: 'all', value: null });
  const [sortConfig, setSortConfig] = useState({ key: 'clickedAt', direction: 'desc' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchKeywordData();
  }, [keyword]);

  const fetchKeywordData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { window.location.href = '/login'; return; }
      const res = await fetch(`${API_BASE_URL}/api/track-data`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const kw = decodeURIComponent(keyword);
          const filtered = data.data.filter(c => c.keyword === kw);
          setClickData(filtered);
        }
      }
    } catch (err) {
      console.error('Error fetching keyword data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ background: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Decoding Keyword Intelligence for "{decodeURIComponent(keyword)}"...</div>;

  const totalClicks = clickData.length;
  const inquiries = clickData.filter(c => c.formInteracted).length;
  const totalRevenue = clickData.reduce((acc, c) => acc + (c.revenue || 0), 0);
  const uniqueCities = new Set(clickData.map(c => c.city)).size;

  // Filter Logic
  const displayData = clickData.filter(c => {
    if (activeFilter.type === 'inquiry') return c.formInteracted;
    if (activeFilter.type === 'revenue') return (c.revenue || 0) > 0;
    if (activeFilter.type === 'city') return c.city === activeFilter.value;
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '900', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>Target Term Intelligence</div>
              <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0, color: '#0f172a' }}>🔍 {decodeURIComponent(keyword)}</h1>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
             {activeFilter.type !== 'all' && (
               <button 
                 onClick={() => setActiveFilter({ type: 'all', value: null })}
                 style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', marginRight: '15px' }}
               >
                 ✕ Clear Filter
               </button>
             )}
             <div style={{ background: inquiries > 0 ? '#dcfce7' : '#fee2e2', color: inquiries > 0 ? '#15803d' : '#ef4444', padding: '8px 20px', borderRadius: '100px', fontWeight: '900', fontSize: '13px', display: 'inline-block' }}>
               {inquiries > 0 ? 'PROFITABLE TERM' : 'ANALYZING VALUE'}
             </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '25px', marginBottom: '40px' }}>
          <SummaryCard 
            title="Total Clicks" 
            value={totalClicks} 
            icon="🖱️" 
            color="#1e293b" 
            onClick={() => setActiveFilter({ type: 'all', value: null })}
            active={activeFilter.type === 'all'}
          />
          <SummaryCard 
            title="Total Enquiries" 
            value={inquiries} 
            icon="📩" 
            color="#10b981" 
            onClick={() => setActiveFilter({ type: 'inquiry', value: true })}
            active={activeFilter.type === 'inquiry'}
          />
          <SummaryCard 
            title="Revenue Generated" 
            value={`$${totalRevenue.toLocaleString()}`} 
            icon="💵" 
            color="#6366f1" 
            onClick={() => setActiveFilter({ type: 'revenue', value: true })}
            active={activeFilter.type === 'revenue'}
          />
          <SummaryCard 
            title="Reach Cities" 
            value={uniqueCities} 
            icon="📍" 
            color="#f59e0b" 
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px' }}>
          
          {/* Detailed Inquiry Log */}
          <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '25px 30px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>
                 {activeFilter.type === 'all' ? 'Full Traffic & Inquiry History' : 
                  activeFilter.type === 'city' ? `Visitors from ${activeFilter.value}` :
                  activeFilter.type === 'revenue' ? 'Sales & Revenue Transactions' :
                  'Enquiry & Form Interactions'}
               </h2>
               <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>Showing {displayData.length} records</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    <th onClick={() => requestSort('ipAddress')} style={{ ...thStyle, cursor: 'pointer' }}>
                      Visitor IP {sortConfig.key === 'ipAddress' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th onClick={() => requestSort('city')} style={{ ...thStyle, cursor: 'pointer' }}>
                      Location {sortConfig.key === 'city' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th onClick={() => requestSort('clickedAt')} style={{ ...thStyle, cursor: 'pointer' }}>
                      Date & Time {sortConfig.key === 'clickedAt' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th onClick={() => requestSort('formInteracted')} style={{ ...thStyle, cursor: 'pointer' }}>
                      Enquiry Status {sortConfig.key === 'formInteracted' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th onClick={() => requestSort('revenue')} style={{ ...thStyle, cursor: 'pointer' }}>
                      Revenue {sortConfig.key === 'revenue' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th style={thStyle}>Scan</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.length > 0 ? sortedData.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f8fafc', transition: '0.2s' }}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: '900', color: '#1e293b', fontFamily: 'monospace' }}>{c.ipAddress}</div>
                        {c.isReturning && <span style={{ fontSize: '9px', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>RETURNING</span>}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{c.city}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{c.country}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{new Date(c.clickedAt).toLocaleDateString()}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(c.clickedAt).toLocaleTimeString()}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.formInteracted ? '#10b981' : '#e2e8f0' }}></div>
                          <span style={{ fontWeight: '900', color: c.formInteracted ? '#10b981' : '#94a3b8', fontSize: '12px' }}>
                            {c.formInteracted ? 'ENQUIRY SENT' : 'NO ACTION'}
                          </span>
                        </div>
                      </td>
                      <td style={tdStyle}>
                         <div style={{ fontWeight: '900', color: c.revenue > 0 ? '#10b981' : '#cbd5e1' }}>
                           {c.revenue > 0 ? `$${c.revenue}` : '—'}
                         </div>
                      </td>
                      <td style={tdStyle}>
                        <button 
                          onClick={() => navigate(c.isReturning ? `/gold-user/${c.ipAddress}` : `/ip-story/${c.ipAddress}`)}
                          style={{ background: '#f1f5f9', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', color: '#475569' }}
                        >
                          Deep Scan →
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontWeight: 'bold' }}>
                        No records found for this filter. Try clearing the filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side Panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Top Converting Locations */}
            <div style={{ background: '#0f172a', borderRadius: '24px', padding: '30px', color: '#fff' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '14px', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '1px' }}>Top Locations (Click to Filter)</h3>
              {(() => {
                const locations = clickData.reduce((acc, c) => {
                  acc[c.city] = (acc[c.city] || 0) + 1;
                  return acc;
                }, {});
                return Object.entries(locations).sort((a,b) => b[1]-a[1]).slice(0, 10).map(([city, count]) => (
                  <div 
                    key={city} 
                    onClick={() => setActiveFilter({ type: 'city', value: city })}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginBottom: '10px',
                      cursor: 'pointer',
                      padding: '10px',
                      borderRadius: '12px',
                      background: activeFilter.value === city ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                      border: activeFilter.value === city ? '1px solid #6366f1' : '1px solid transparent',
                      transition: '0.2s'
                    }}
                    onMouseEnter={(e) => !activeFilter.value && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={(e) => !activeFilter.value && (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>📍 {city}</span>
                    <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '900' }}>{count} hits</span>
                  </div>
                ));
              })()}
            </div>

            {/* Keyword Efficiency */}
            <div style={{ background: '#fff', borderRadius: '24px', padding: '30px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '900' }}>Keyword Performance</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <IntelligenceRow label="Conversion Rate" value={`${((inquiries / (totalClicks || 1)) * 100).toFixed(1)}%`} />
                <IntelligenceRow label="Avg. Order Value" value={`$${(totalRevenue / (inquiries || 1)).toFixed(2)}`} />
                <IntelligenceRow label="Returning Leads" value={clickData.filter(c => c.isReturning).length} />
                <IntelligenceRow label="VPN/Bot Filtered" value={clickData.filter(c => c.isSuspicious).length} color="#ef4444" />
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

const SummaryCard = ({ title, value, icon, color, onClick, active }) => (
  <div 
    onClick={onClick}
    style={{ 
      background: '#fff', 
      padding: '25px', 
      borderRadius: '24px', 
      border: active ? `2px solid ${color}` : '1px solid #e2e8f0', 
      boxShadow: active ? `0 10px 15px -3px ${color}20` : '0 4px 6px rgba(0,0,0,0.02)',
      cursor: onClick ? 'pointer' : 'default',
      transition: '0.3s all ease',
      transform: active ? 'translateY(-5px)' : 'none'
    }}
  >
    <div style={{ fontSize: '30px', marginBottom: '15px' }}>{icon}</div>
    <div style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>{title}</div>
    <div style={{ fontSize: '24px', fontWeight: '900', color: color }}>{value}</div>
    {active && <div style={{ fontSize: '10px', color: color, fontWeight: 'bold', marginTop: '5px' }}>● FILTER ACTIVE</div>}
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

export default KeywordIntel;
