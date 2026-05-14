import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/apiConfig';

const SourceIntel = () => {
  const { source } = useParams();
  const [clickData, setClickData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState({ type: 'all', value: null });
  const [sortConfig, setSortConfig] = useState({ key: 'clickedAt', direction: 'desc' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchSourceData();
  }, [source]);

  const fetchSourceData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/track-data`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const src = decodeURIComponent(source);
          const filtered = data.data.filter(c => c.source === src);
          setClickData(filtered);
        }
      }
    } catch (err) {
      console.error('Error fetching source data:', err);
    } finally {
      setLoading(false);
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  if (loading) return <div style={{ background: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Analyzing Forensic Logs for {decodeURIComponent(source)}...</div>;

  const displayData = clickData.filter(c => {
    if (activeFilter.type === 'conversion') return c.formInteracted;
    if (activeFilter.type === 'revenue') return (c.revenue || 0) > 0;
    if (activeFilter.type === 'fraud') return c.isSuspicious;
    return true;
  });

  const sortedData = [...displayData].sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];
    if (sortConfig.key === 'clickedAt') { valA = new Date(valA).getTime(); valB = new Date(valB).getTime(); }
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

        {/* Navigation & Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '900', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '2px' }}>Network Intelligence</div>
              <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0 }}>📊 {decodeURIComponent(source)} Forensic Audit</h1>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
          <FilterTab active={activeFilter.type === 'all'} label="All Traffic" count={clickData.length} onClick={() => setActiveFilter({ type: 'all' })} />
          <FilterTab active={activeFilter.type === 'conversion'} label="Conversions" count={clickData.filter(c => c.formInteracted).length} color="#10b981" onClick={() => setActiveFilter({ type: 'conversion' })} />
          <FilterTab active={activeFilter.type === 'revenue'} label="Revenue" count={clickData.filter(c => c.revenue > 0).length} color="#6366f1" onClick={() => setActiveFilter({ type: 'revenue' })} />
          <FilterTab active={activeFilter.type === 'fraud'} label="Fraud Detected" count={clickData.filter(c => c.isSuspicious).length} color="#ef4444" onClick={() => setActiveFilter({ type: 'fraud' })} />
        </div>

        {/* Evidence Table */}
        <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
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
                  <th onClick={() => requestSort('campaignName')} style={{ ...thStyle, cursor: 'pointer' }}>
                    Campaign {sortConfig.key === 'campaignName' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                  </th>
                  <th onClick={() => requestSort('city')} style={{ ...thStyle, cursor: 'pointer' }}>
                    Location {sortConfig.key === 'city' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
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
                      <div style={{ fontWeight: '900', color: '#1e293b' }}>{c.ipAddress}</div>
                      {c.isSuspicious && <span style={{ fontSize: '9px', background: '#fee2e2', color: '#ef4444', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>SUSPICIOUS</span>}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{new Date(c.clickedAt).toLocaleDateString()}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(c.clickedAt).toLocaleTimeString()}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{c.campaignName || 'General'}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{c.adGroup || 'No Group'}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 'bold' }}>{c.city}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{c.country}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: '900', color: c.revenue > 0 ? '#10b981' : '#cbd5e1' }}>
                        {c.revenue > 0 ? `$${c.revenue.toLocaleString()}` : '—'}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <button 
                        onClick={() => navigate(`/ip-story/${c.ipAddress}`)}
                        style={{ background: '#f1f5f9', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Details →
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontWeight: 'bold' }}>No forensic evidence found for this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
};

const FilterTab = ({ active, label, count, color = '#0f172a', onClick }) => (
  <button 
    onClick={onClick}
    style={{ 
      background: active ? color : '#fff', 
      color: active ? '#fff' : '#64748b', 
      border: active ? 'none' : '1px solid #e2e8f0', 
      padding: '10px 20px', 
      borderRadius: '12px', 
      cursor: 'pointer', 
      fontWeight: 'bold', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '10px',
      transition: '0.2s'
    }}
  >
    {label}
    <span style={{ background: active ? 'rgba(255,255,255,0.2)' : '#f1f5f9', padding: '2px 8px', borderRadius: '6px', fontSize: '11px' }}>{count}</span>
  </button>
);

const thStyle = { padding: '15px 20px', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle = { padding: '15px 20px', fontSize: '13px', color: '#334155' };

export default SourceIntel;
