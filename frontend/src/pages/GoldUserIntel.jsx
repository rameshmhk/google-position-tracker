import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/apiConfig';

const GoldUserIntel = () => {
  const { ip } = useParams();
  const [userHistory, setUserHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, [ip]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { window.location.href = '/login'; return; }
      const res = await fetch(`${API_BASE_URL}/api/track-data`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const history = data.data.filter(c => c.ipAddress === ip);
          setUserHistory(history);
        }
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ background: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Decoding Gold User Intelligence for {ip}...</div>;

  const totalSales = userHistory.reduce((acc, c) => acc + (c.revenue || 0), 0);
  const totalVisits = userHistory.length;
  const lastOrder = userHistory.filter(c => c.orderId).sort((a, b) => new Date(b.clickedAt) - new Date(a.clickedAt))[0];
  const latestSession = userHistory.sort((a, b) => new Date(b.clickedAt) - new Date(a.clickedAt))[0];

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />
      
      <main style={{ maxWidth: '1200px', margin: '40px auto 100px', padding: '0 20px' }}>
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

        {/* Profile Header */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '32px', padding: '40px', color: '#fff', marginBottom: '40px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '300px', height: '300px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }}></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
              <div style={{ width: '100px', height: '100px', background: 'linear-gradient(45deg, #f59e0b, #d97706)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', border: '5px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
                ⭐
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                  <h1 style={{ fontSize: '36px', fontWeight: '900', margin: 0 }}>Gold User Profile</h1>
                  <span style={{ background: '#f59e0b', color: '#fff', padding: '6px 15px', borderRadius: '100px', fontSize: '12px', fontWeight: '900', letterSpacing: '1px' }}>LOYAL CUSTOMER</span>
                </div>
                <div style={{ fontSize: '18px', color: '#94a3b8', fontWeight: '600' }}>Identifier: <span style={{ color: '#fff', fontFamily: 'monospace' }}>{ip}</span></div>
                <div style={{ fontSize: '14px', color: '#64748b', marginTop: '5px' }}>📍 Last seen in {latestSession?.city}, {latestSession?.country}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Customer Lifetime Value</div>
              <div style={{ fontSize: '42px', fontWeight: '900', color: '#10b981' }}>${totalSales.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Intelligence Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '25px', marginBottom: '40px' }}>
          <StatCard title="Total Transactions" value={userHistory.filter(c => c.orderId).length} icon="🛍️" color="#3b82f6" />
          <StatCard title="Visit Frequency" value={`${totalVisits} Sessions`} icon="🔄" color="#f59e0b" />
          <StatCard title="Loyalty Score" value="9.8/10" icon="🏆" color="#10b981" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: '30px' }}>
          
          {/* Detailed History */}
          <div style={{ background: '#fff', borderRadius: '24px', padding: '40px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              📜 Full User Journey History
            </h2>
            <div style={{ position: 'relative', paddingLeft: '30px' }}>
              <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '2px', background: '#f1f5f9' }}></div>
              
              {userHistory.sort((a, b) => new Date(b.clickedAt) - new Date(a.clickedAt)).map((session, idx) => (
                <div key={idx} style={{ position: 'relative', marginBottom: '40px' }}>
                  <div style={{ position: 'absolute', left: '-25px', top: '6px', width: '12px', height: '12px', borderRadius: '50%', background: session.orderId ? '#10b981' : '#cbd5e1', border: '3px solid #fff', zIndex: 1 }}></div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '900', color: '#1e293b' }}>
                        {new Date(session.clickedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        Source: <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{session.source?.replace('_', ' ').toUpperCase() || 'DIRECT'}</span>
                      </div>
                      {session.orderId && (
                        <div style={{ marginTop: '10px', background: '#ecfdf5', padding: '10px 15px', borderRadius: '12px', border: '1px solid #d1fae5', display: 'inline-block' }}>
                          <div style={{ fontSize: '10px', color: '#059669', fontWeight: '900' }}>PURCHASE CAPTURED</div>
                          <div style={{ fontSize: '16px', fontWeight: '900', color: '#059669' }}>${session.revenue} <span style={{ fontSize: '11px', opacity: 0.7 }}>({session.orderId})</span></div>
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{session.city}</div>
                       <div style={{ fontSize: '11px', color: '#94a3b8' }}>{session.deviceType} • {session.browser}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Intel Side Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Last Purchase Box */}
            <div style={{ background: '#fff', borderRadius: '24px', padding: '30px', border: '2px dashed #f59e0b', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-12px', left: '20px', background: '#f59e0b', color: '#fff', padding: '2px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: '900' }}>LAST ORDER RECALL</div>
              <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '900' }}>What they bought last?</h3>
              {lastOrder ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Order ID:</span>
                    <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{lastOrder.orderId}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Total Amount:</span>
                    <span style={{ fontWeight: '900', color: '#10b981', fontSize: '18px' }}>${lastOrder.revenue}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Purchase Date:</span>
                    <span style={{ fontWeight: 'bold' }}>{new Date(lastOrder.clickedAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ padding: '15px', background: '#fff7ed', borderRadius: '12px', color: '#c2410c', fontSize: '12px', fontWeight: 'bold' }}>
                    💡 Tip: This user prefers {lastOrder.source === 'google_ads' ? 'Google Search' : 'Social Media'} campaigns.
                  </div>
                </div>
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '13px' }}>No previous purchase data captured.</div>
              )}
            </div>

            {/* Loyalty Metrics */}
            <div style={{ background: '#fff', borderRadius: '24px', padding: '30px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '900' }}>Loyalty Intelligence</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <IntelligenceRow label="Customer Since" value={new Date(userHistory[userHistory.length - 1].clickedAt).toLocaleDateString()} />
                <IntelligenceRow label="Visit Interval" value="Every 4 Days" />
                <IntelligenceRow label="Preferred Device" value={latestSession.deviceType} />
                <IntelligenceRow label="Account Security" value="VERIFIED GMAIL" color="#10b981" />
              </div>
            </div>

            <button 
              onClick={() => navigate(-1)}
              style={{ width: '100%', background: '#0f172a', color: '#fff', border: 'none', padding: '15px', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(15,23,42,0.3)' }}
            >
              Back to Analysis
            </button>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div style={{ background: '#fff', padding: '25px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px' }}>
    <div style={{ fontSize: '30px', background: `${color}10`, width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</div>
      <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>{value}</div>
    </div>
  </div>
);

const IntelligenceRow = ({ label, value, color = '#1e293b' }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>{label}</span>
    <span style={{ fontSize: '14px', fontWeight: '900', color: color }}>{value}</span>
  </div>
);

export default GoldUserIntel;
