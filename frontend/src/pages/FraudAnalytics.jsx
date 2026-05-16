import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/apiConfig';

const FraudAnalytics = () => {
  const [clickData, setClickData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all'); // all, vpn, frequency, bounce
  const [sortConfig, setSortConfig] = useState({ key: 'clickedAt', direction: 'desc' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { window.location.href = '/login'; return; }
      const res = await fetch(`${API_BASE_URL}/api/track-data`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setClickData(data.data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/track-data/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setClickData(prev => prev.filter(c => c.id !== id));
      }
    } catch (e) { console.error(e); }
  };

  const handleClearAds = async () => {
    if (!window.confirm('⚠️ CRITICAL: This will permanently delete ALL Ads-related traffic data. Are you sure?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/track-data/clear/ads`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
        alert('Ads data cleared successfully.');
      }
    } catch (e) { console.error(e); }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getFraudAnalysis = () => {
    const ipCounts = {};
    clickData.forEach(c => {
      ipCounts[c.ipAddress] = (ipCounts[c.ipAddress] || 0) + 1;
    });

    let rawFraud = clickData.map(c => {
      const reasons = [];
      const sr = (c.suspicionReason || '').toLowerCase();
      
      if (sr.includes('vpn') || sr.includes('proxy') || sr.includes('datacenter')) reasons.push('VPN/Proxy detected');
      if (sr.includes('repeated ad clicks') || sr.includes('zero activity')) reasons.push('Ad Bounce (0 Activity)');
      if (sr.includes('frequency') || ipCounts[c.ipAddress] > 10) reasons.push(`High Frequency (${ipCounts[c.ipAddress]} clicks)`);
      
      if (c.isSuspicious && reasons.length === 0) reasons.push(c.suspicionReason || 'Suspicious Activity');
      
      const isVPN = reasons.some(r => r.toLowerCase().includes('vpn') || r.toLowerCase().includes('proxy'));
      const isBounce = reasons.some(r => r.toLowerCase().includes('bounce') || r.toLowerCase().includes('activity'));
      const isFreq = reasons.some(r => r.toLowerCase().includes('frequency'));

      return { 
        ...c, 
        fraudReasons: reasons, 
        isFraud: reasons.length > 0 || c.isSuspicious,
        type: isVPN ? 'vpn' : (isBounce ? 'bounce' : (isFreq ? 'frequency' : 'other'))
      };
    }).filter(c => c.isFraud);

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
  const filteredFraud = fraudData.filter(c => {
    const matchesSearch = c.ipAddress.includes(searchTerm);
    if (activeCategory === 'all') return matchesSearch;
    return matchesSearch && c.type === activeCategory;
  });

  const stats = {
    total: fraudData.length,
    vpn: fraudData.filter(c => c.type === 'vpn').length,
    frequency: fraudData.filter(c => c.type === 'frequency').length,
    bounce: fraudData.filter(c => c.type === 'bounce').length
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />
      <main style={{ maxWidth: '1200px', margin: '60px auto', padding: '0 20px' }}>
        
        <button 
          onClick={() => navigate('/ad-tracker')}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '10px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          ← Back to Ad Tracker
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: '900', margin: 0 }}>🛡️ Fraud Intelligence</h1>
            <p style={{ color: '#94a3b8', fontSize: '16px' }}>Autonomous detection of ad-fraud and malicious traffic.</p>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button 
              onClick={handleClearAds}
              style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '12px', fontSize: '14px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              🗑️ Clear All Ads Data
            </button>
            <input 
              type="text" 
              placeholder="Search IP..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '12px 20px', borderRadius: '12px', outline: 'none' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
          <StatCard title="Total Threats" value={stats.total} color="#ef4444" icon="🔥" isActive={activeCategory === 'all'} onClick={() => setActiveCategory('all')} />
          <StatCard title="VPN/Proxy" value={stats.vpn} color="#f59e0b" icon="🕵️" isActive={activeCategory === 'vpn'} onClick={() => setActiveCategory('vpn')} />
          <StatCard title="Ad Bouncers" value={stats.bounce} color="#3b82f6" icon="🖱️" isActive={activeCategory === 'bounce'} onClick={() => setActiveCategory('bounce')} />
          <StatCard title="High Freq" value={stats.frequency} color="#8b5cf6" icon="🤖" isActive={activeCategory === 'frequency'} onClick={() => setActiveCategory('frequency')} />
        </div>

        <div style={{ background: '#1e293b', borderRadius: '32px', border: '1px solid #334155', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid #334155' }}>
                <th style={thStyle}>Attacker IP</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>Threat Signatures</th>
                <th style={thStyle}>Platform</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFraud.map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={tdStyle}>{c.ipAddress}</td>
                  <td style={tdStyle}>{c.city}, {c.country}</td>
                  <td style={tdStyle}>
                    {c.fraudReasons.map((r, idx) => (
                      <span key={idx} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', marginRight: '5px' }}>{r}</span>
                    ))}
                  </td>
                  <td style={tdStyle}>{c.os}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => navigate(`/ip-story/${c.ipAddress}`)} style={btnStyle}>VIEW</button>
                      <button onClick={() => handleDelete(c.id)} style={{ ...btnStyle, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>🗑️</button>
                    </div>
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

const StatCard = ({ title, value, color, icon, isActive, onClick }) => (
  <div onClick={onClick} style={{ background: '#1e293b', padding: '25px', borderRadius: '24px', border: isActive ? `2px solid ${color}` : '1px solid #334155', cursor: 'pointer', transition: '0.3s' }}>
    <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px' }}>{title}</div>
    <div style={{ fontSize: '32px', fontWeight: '900', color: '#fff' }}>{value}</div>
  </div>
);

const thStyle = { padding: '20px 30px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase' };
const tdStyle = { padding: '20px 30px', fontSize: '13px' };
const btnStyle = { background: '#f8fafc', color: '#0f172a', border: 'none', padding: '8px 15px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', cursor: 'pointer' };

export default FraudAnalytics;
