import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/apiConfig';

const TrafficDetails = () => {
  const { type } = useParams(); // 'all', 'unique', 'fraud'
  const [clickData, setClickData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClick, setSelectedClick] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'clickedAt', direction: 'desc' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrackingData();
  }, []);

  const fetchTrackingData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { window.location.href = '/login'; return; }
      const res = await fetch(`${API_BASE_URL}/api/track-data`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setClickData(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching track data:', err);
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

  const getSortedData = (data) => {
    if (!sortConfig.key) return data;

    const sorted = [...data].sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      // Handle specific complex fields
      if (sortConfig.key === 'location') {
        valA = `${a.city}, ${a.country}`;
        valB = `${b.city}, ${b.country}`;
      }
      if (sortConfig.key === 'device') {
        valA = a.deviceType || '';
        valB = b.deviceType || '';
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  const getFilteredData = () => {
    let baseData = clickData;
    if (type === 'fraud') baseData = clickData.filter(c => c.isSuspicious);
    else if (type === 'revenue') baseData = clickData.filter(c => (c.revenue || 0) > 0);
    else if (type === 'orders') baseData = clickData.filter(c => c.orderId);
    
    // Funnel Stages
    else if (type === 'funnel-interest') {
      baseData = clickData.filter(c => {
        try {
          const pages = typeof c.pagesVisited === 'string' ? JSON.parse(c.pagesVisited) : (c.pagesVisited || []);
          return pages.length > 2;
        } catch(e) { return false; }
      });
    }
    else if (type === 'funnel-cart') {
      baseData = clickData.filter(c => {
        try {
          const actions = typeof c.actions === 'string' ? JSON.parse(c.actions) : (c.actions || []);
          return actions.some(a => a.toLowerCase().includes('cart'));
        } catch(e) { return false; }
      });
    }

    else if (type === 'unique') {
      const uniqueIps = new Set();
      baseData = clickData.filter(c => {
        if (!uniqueIps.has(c.ipAddress)) {
          uniqueIps.add(c.ipAddress);
          return true;
        }
        return false;
      });
    }

    return getSortedData(baseData);
  };

  const filteredData = getFilteredData();
  const title = type === 'fraud' ? 'Fraud & Suspicious Traffic' : 
                type === 'unique' ? 'Unique IP Addresses' : 
                type === 'revenue' ? 'Revenue Generating Clicks' :
                type === 'orders' ? 'Successful Orders & Conversions' :
                type === 'funnel-interest' ? 'High-Interest Visitors (3+ Pages)' :
                type === 'funnel-cart' ? 'Abandoned Cart Analysis' :
                'Total Traffic Clicks';

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />
      
      <main style={{ maxWidth: '1200px', margin: '40px auto 100px', padding: '0 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
          <button 
            onClick={() => navigate('/ad-tracker')}
            style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          >
            ← Back
          </button>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0 }}>{title}</h1>
            <p style={{ color: '#64748b', margin: '5px 0 0' }}>Showing {filteredData.length} records for category: {type}</p>
          </div>
        </div>

        {/* Detailed Table */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th 
                  onClick={() => requestSort('clickedAt')}
                  style={{ padding: '15px 25px', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}
                >
                  Date & Time {sortConfig.key === 'clickedAt' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th 
                  onClick={() => requestSort('ipAddress')}
                  style={{ padding: '15px 25px', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}
                >
                  IP Address {sortConfig.key === 'ipAddress' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th 
                  onClick={() => requestSort('location')}
                  style={{ padding: '15px 25px', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}
                >
                  Location {sortConfig.key === 'location' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th 
                  onClick={() => requestSort('device')}
                  style={{ padding: '15px 25px', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}
                >
                  Device / OS {sortConfig.key === 'device' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                {type === 'fraud' && <th style={{ padding: '15px 25px', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Suspicion Reason</th>}
                <th style={{ padding: '15px 25px', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>Loading details...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>No data found for this category.</td></tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s' }}>
                    <td style={{ padding: '15px 25px', fontSize: '13px' }}>
                      <div style={{ fontWeight: '700' }}>{new Date(item.clickedAt).toLocaleDateString()}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(item.clickedAt).toLocaleTimeString()}</div>
                    </td>
                    <td style={{ padding: '15px 25px' }}>
                      <span 
                        onClick={() => navigate(`/ip-story/${item.ipAddress}`)}
                        style={{ fontWeight: '800', color: '#3b82f6', background: '#eff6ff', padding: '4px 10px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {item.ipAddress}
                      </span>
                    </td>
                    <td style={{ padding: '15px 25px', fontSize: '13px' }}>
                      <div style={{ fontWeight: '600' }}>{item.city}, {item.country}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.isp}</div>
                    </td>
                    <td style={{ padding: '15px 25px', fontSize: '13px' }}>
                      <div style={{ fontWeight: '800', color: '#1e293b' }}>{item.deviceModel || item.deviceType}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.browser} / {item.os}</div>
                    </td>
                    {type === 'fraud' && (
                      <td style={{ padding: '15px 25px' }}>
                        <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: '700' }}>{item.suspicionReason || 'High Risk Pattern'}</span>
                      </td>
                    )}
                    <td style={{ padding: '15px 25px' }}>
                      <button 
                        onClick={() => setSelectedClick(item)}
                        style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                      >
                        Deep Intel
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Deep Intelligence Modal */}
        {selectedClick && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
            <div style={{ background: '#fff', width: '100%', maxWidth: '800px', maxHeight: '90vh', borderRadius: '32px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
              {/* Modal Header */}
              <div style={{ padding: '30px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Deep Intelligence Report</div>
                  <h2 style={{ margin: '5px 0 0', fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>{selectedClick.ipAddress}</h2>
                </div>
                <button onClick={() => setSelectedClick(null)} style={{ background: '#fff', border: '1px solid #e2e8f0', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold', color: '#64748b' }}>×</button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '40px', overflowY: 'auto', flex: 1 }}>
                {/* Technical Profile */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ fontSize: '20px' }}>🔑</div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Login State</div>
                      {selectedClick.os === 'Android' || selectedClick.os === 'iOS' ? (
                        <span style={{ display: 'inline-block', marginTop: '4px', background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '800' }}>
                          Verified (Gmail)
                        </span>
                      ) : (
                        <span style={{ display: 'inline-block', marginTop: '4px', background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '800' }}>
                          Guest Session
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ fontSize: '20px' }}>💻</div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Device</div>
                      <div style={{ fontSize: '13px', fontWeight: '800' }}>{selectedClick.deviceModel || selectedClick.deviceType}</div>
                    </div>
                  </div>
                </div>

                <h3 style={{ margin: '0 0 25px', fontSize: '18px', fontWeight: 'bold' }}>🛤️ Full Session Timeline (A to Z)</h3>
                <div style={{ position: 'relative', paddingLeft: '20px', marginBottom: '40px' }}>
                  <div style={{ position: 'absolute', left: '7px', top: '5px', bottom: '5px', width: '2px', background: '#e2e8f0' }}></div>
                  
                  {(() => {
                    const pages = JSON.parse(selectedClick.pagesVisited || '[]');
                    const actions = JSON.parse(selectedClick.actions || '[]');
                    
                    return actions.map((action, idx) => {
                      const isConversion = action.includes('Success') || action.includes('Submit') || action.includes('Purchase');
                      const isInteraction = action.includes('Click') || action.includes('Add to Cart') || action.includes('Initiated');
                      
                      return (
                        <div key={idx} style={{ position: 'relative', marginBottom: '25px' }}>
                          <div style={{ 
                            position: 'absolute', 
                            left: '-18px', 
                            top: '4px', 
                            width: '12px', 
                            height: '12px', 
                            borderRadius: '50%', 
                            background: isConversion ? '#10b981' : (isInteraction ? '#3b82f6' : '#94a3b8'),
                            zIndex: 1
                          }}></div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: isConversion ? '#10b981' : (isInteraction ? '#2563eb' : '#1e293b') }}>
                              {action}
                            </div>
                            {pages[idx] && (
                              <div style={{ fontSize: '12px', color: '#64748b' }}>
                                Path: <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{pages[idx]}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default TrafficDetails;
