import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/apiConfig';

const LiveTraffic = () => {
  const [clickData, setClickData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrackingData();
    const interval = setInterval(fetchTrackingData, 10000); // Auto refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchTrackingData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/track-data`);
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

  const activeUsers = clickData.filter(c => new Date(c.clickedAt) > new Date(Date.now() - 10 * 60 * 1000));
  
  // Group by page
  const pageDistribution = activeUsers.reduce((acc, user) => {
    const path = user.exitPage || '/';
    acc[path] = (acc[path] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />
      
      <main style={{ maxWidth: '1200px', margin: '40px auto 100px', padding: '0 20px' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0 }}>Live Traffic Pulse</h1>
            <p style={{ color: '#94a3b8', margin: '5px 0 0' }}>Real-time behavioral monitoring across your platform.</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(16, 185, 129, 0.1)', padding: '10px 20px', borderRadius: '100px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 15px #10b981', animation: 'pulse 2s infinite' }}></div>
            <span style={{ color: '#10b981', fontWeight: '800', fontSize: '14px' }}>{activeUsers.length} ACTIVE USERS</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
          {/* Left Column: Live Map & List */}
          <div>
            {/* Live Activity Feed */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '18px' }}>Real-time Activity Feed</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Updating live...</span>
              </div>
              <div style={{ maxHeight: '600px', overflowY: 'auto', padding: '20px' }}>
                {activeUsers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '100px 0', color: '#64748b' }}>No active users detected.</div>
                ) : (
                  activeUsers.map((user, i) => (
                    <div key={i} style={{ display: 'flex', gap: '20px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ fontSize: '24px' }}>{user.deviceType === 'Mobile' ? '📱' : '💻'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: '800', fontSize: '15px' }}>{user.ipAddress}</span>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>📍 {user.city}, {user.country}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button 
                          onClick={() => navigate(`/live-session/${user.id}`)}
                          style={{ 
                            background: 'rgba(59, 130, 246, 0.1)', 
                            border: '1px solid rgba(59, 130, 246, 0.2)', 
                            color: '#3b82f6', 
                            padding: '6px 12px', 
                            borderRadius: '8px', 
                            fontSize: '11px', 
                            fontWeight: 'bold', 
                            cursor: 'pointer',
                            transition: '0.3s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                            e.currentTarget.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          Watch Live 🎥
                        </button>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#10b981' }}>{user.browser}</div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>Active on {user.exitPage || '/'}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Top Pages & Insights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Page Distribution */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', padding: '25px' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '16px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Top Active Pages</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {Object.entries(pageDistribution).sort((a,b) => b[1] - a[1]).map(([path, count]) => (
                  <div key={path}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                      <span style={{ color: '#fff', fontWeight: '600' }}>{path}</span>
                      <span style={{ color: '#3b82f6', fontWeight: '800' }}>{count}</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                      <div style={{ height: '100%', width: `${(count / activeUsers.length) * 100}%`, background: '#3b82f6', borderRadius: '10px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', padding: '25px' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '16px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Device Split</h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', height: '100px' }}>
                {['Mobile', 'Desktop', 'Tablet'].map(type => {
                  const count = activeUsers.filter(u => u.deviceType === type).length;
                  const height = activeUsers.length > 0 ? (count / activeUsers.length) * 100 : 0;
                  return (
                    <div key={type} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '100%', height: `${height}%`, background: type === 'Mobile' ? '#10b981' : '#3b82f6', borderRadius: '4px', minHeight: '2px' }}></div>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>{type}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <Footer />
    </div>
  );
};

export default LiveTraffic;
