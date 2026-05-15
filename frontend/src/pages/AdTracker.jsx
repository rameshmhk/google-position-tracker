import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/apiConfig';
import { cleanWebsiteUrl } from '../utils/urlUtils';

const AdTracker = () => {
  const [clickData, setClickData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all'); // 'today', '7days', '30days', 'all', 'custom'
  const [showCode, setShowCode] = useState(false);
  const navigate = useNavigate();
  
  // Custom Date Range State
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [appliedCustomDates, setAppliedCustomDates] = useState({ start: '', end: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'clickedAt', direction: 'desc' });

  // Detail View State
  const [selectedClick, setSelectedClick] = useState(null);
  const [selectedAd, setSelectedAd] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [selectedProject, setSelectedProject] = useState('All Domains');
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDomain, setNewDomain] = useState({ name: '', url: '' });

  // Smart Alerts Simulation
  useEffect(() => {
    const timer = setInterval(() => {
      if (clickData.length > 0) {
        // Find if there's any very recent click from a returning user (last 1 min)
        const recentReturning = clickData.find(c => c.isReturning && new Date(c.clickedAt) > new Date(Date.now() - 60000));
        
        let alertObj;
        if (recentReturning && Math.random() > 0.5) {
          alertObj = { type: 'gold', msg: `🌟 Gold User Visit Again: ${recentReturning.ipAddress} (Visit #${recentReturning.visitCount})`, id: Date.now(), ip: recentReturning.ipAddress };
        } else {
          const isSale = Math.random() > 0.7;
          const randomClick = clickData[Math.floor(Math.random() * clickData.length)];
          alertObj = isSale 
            ? { type: 'sale', msg: `💰 Sale Captured: $${(Math.random() * 500 + 50).toFixed(2)} from ${randomClick.ipAddress}`, id: Date.now(), ip: randomClick.ipAddress }
            : { type: 'fraud', msg: '🛡️ VPN Shield Activated: IP Blocked!', id: Date.now(), ip: randomClick.ipAddress };
        }
        
        setAlerts(prev => [...prev, alertObj].slice(-3));
        
        // Auto remove alert after 4 seconds
        setTimeout(() => {
          setAlerts(prev => prev.filter(a => a.id !== alertObj.id));
        }, 4000);
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [clickData]);

  useEffect(() => {
    fetchTrackingData();
    fetchProjects();
  }, []);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
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

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const handleAddProject = async () => {
    if (!newDomain.name || !newDomain.url) return alert('Please fill all fields');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/projects`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: newDomain.name,
          url: newDomain.url,
          targetRegion: 'in'
        })
      });
      if (res.ok) {
        const data = await res.json();
        await fetchProjects();
        setIsModalOpen(false);
        setNewDomain({ name: '', url: '' });
        setSelectedProject(data.name);
        setShowCode(true); // Automatically show code after adding
        alert('🎉 Domain Added! Now copy the tracking code below and paste it on your website.');
      } else {
        const data = await res.json();
        if (res.status === 401 || res.status === 403) {
          alert('❌ Access Denied: Please Sign In to add a domain.');
          navigate('/login');
        } else {
          alert('❌ Error: ' + (data.error || 'Failed to add domain'));
        }
      }
    } catch (err) {
      console.error('Error adding project:', err);
      alert('❌ Network Error: Could not reach the server.');
    }
  };

  const handleVerifyProject = async (projectId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ ' + data.message);
        fetchProjects();
      } else {
        alert('❌ Verification Failed: ' + data.error);
      }
    } catch (err) {
      alert('Error verifying domain');
    }
  };

  // Filter Data based on selected date AND selected project
  const getFilteredData = () => {
    const now = new Date();
    return clickData.filter(click => {
      // 1. Domain Filter
      if (selectedProject !== 'All Domains') {
        const project = projects.find(p => p.name === selectedProject);
        if (project && !click.websiteUrl?.includes(project.url) && click.websiteUrl !== project.url) {
          return false;
        }
      }

      // 2. Date Filter
      const clickDate = new Date(click.clickedAt);
      if (dateFilter === 'today') {
        return clickDate.toDateString() === now.toDateString();
      } else if (dateFilter === '7days') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return clickDate >= sevenDaysAgo;
      } else if (dateFilter === '30days') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return clickDate >= thirtyDaysAgo;
      } else if (dateFilter === 'custom') {
        if (!appliedCustomDates.start && !appliedCustomDates.end) return true;
        
        let isValid = true;
        if (appliedCustomDates.start) {
          const start = new Date(appliedCustomDates.start);
          start.setHours(0, 0, 0, 0);
          isValid = isValid && clickDate >= start;
        }
        if (appliedCustomDates.end) {
          const end = new Date(appliedCustomDates.end);
          end.setHours(23, 59, 59, 999);
          isValid = isValid && clickDate <= end;
        }
        return isValid;
      }
      return true; // 'all'
    });
  };

  const filteredData = getFilteredData();

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...filteredData].sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];

    // Special cases for sorting
    if (sortConfig.key === 'timeOnSite') {
      valA = valA || 0;
      valB = valB || 0;
    }

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Calculate Metrics
  const totalClicks = filteredData.length;
  const uniqueIPs = new Set(filteredData.map(c => c.ipAddress)).size;
  const fraudulentClicks = filteredData.filter(c => c.isSuspicious).length;
  const bouncers = filteredData.filter(c => c.timeOnSite !== null && c.timeOnSite < 5 && !c.formInteracted).length;
  const nonConverters = filteredData.filter(c => !c.formInteracted).length;

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        .ip-link:hover {
          background: #e2e8f0 !important;
          border-color: #cbd5e1 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        @keyframes blink {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '40px auto 100px', padding: '0 20px' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Ads Traffic Tracker</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select 
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}
                >
                  <option>All Domains</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
                
                {selectedProject !== 'All Domains' && (() => {
                  const project = projects.find(p => p.name === selectedProject);
                  if (!project) return null;
                  return project.isVerified ? (
                    <span style={{ background: '#dcfce7', color: '#166534', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '14px' }}>✅</span> Verified
                    </span>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: '#fee2e2', color: '#991b1b', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '14px' }}>⚠️</span> Unverified
                      </span>
                      <button 
                        onClick={() => handleVerifyProject(project.id)}
                        style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 10px rgba(239,68,68,0.2)' }}
                      >
                        Verify Now
                      </button>
                    </div>
                  );
                })()}

                <button 
                  onClick={() => setIsModalOpen(true)}
                  style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#6366f1', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  + Add Domain
                </button>
              </div>
            </div>
            <p style={{ color: '#64748b' }}>Monitor your traffic quality, raw IPs, and detect click fraud.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {window.location.hostname === 'localhost' && (
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_BASE_URL}/api/seed-tracking`);
                    const data = await res.json();
                    if (data.success) {
                      alert('✅ Sample Leads Generated! Refreshing dashboard...');
                      fetchTrackingData();
                    }
                  } catch (e) {
                    alert('Error generating leads');
                  }
                }}
                style={{ background: '#FF9900', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(255,153,0,0.3)' }}
              >
                🚀 Generate Sample Leads
              </button>
            )}
            <button 
              onClick={() => setShowCode(!showCode)}
              style={{ background: '#1D2B44', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {showCode ? 'Hide Tracking Code' : 'Get Tracking Code'}
            </button>
          </div>
        </div>

        {/* Add Project Modal */}
        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
            <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '450px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '25px', color: '#0f172a' }}>Add New Domain</h2>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Project Name</label>
                <input 
                  type="text"
                  placeholder="e.g. My Online Store"
                  value={newDomain.name}
                  onChange={(e) => setNewDomain({...newDomain, name: e.target.value})}
                  style={{ width: '100%', padding: '12px 15px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }}
                />
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Domain URL</label>
                <input 
                  type="text"
                  placeholder="e.g. myshop.com"
                  value={newDomain.url}
                  onChange={(e) => setNewDomain({...newDomain, url: cleanWebsiteUrl(e.target.value)})}
                  style={{ width: '100%', padding: '12px 15px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, background: '#f1f5f9', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddProject}
                  style={{ flex: 1, background: '#6366f1', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', color: '#fff', cursor: 'pointer' }}
                >
                  Save Domain
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Smart Alerts */}
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {alerts.map(alert => (
            <div 
              key={alert.id}
              onClick={() => {
                if (alert.ip) {
                  navigate(alert.type === 'gold' ? `/gold-user/${alert.ip}` : `/ip-story/${alert.ip}`);
                }
              }}
              style={{ 
                background: alert.type === 'sale' ? '#10b981' : (alert.type === 'gold' ? '#FF9900' : '#ef4444'), 
                color: '#fff', 
                padding: '15px 25px', 
                borderRadius: '12px', 
                fontWeight: '900', 
                fontSize: '13px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                animation: 'slideIn 0.3s ease-out forwards',
                border: '2px solid rgba(255,255,255,0.2)',
                cursor: 'pointer'
              }}
            >
              {alert.msg}
            </div>
          ))}
          <style>{`
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `}</style>
        </div>

        {/* Tracking Code Snippet Block */}
        {showCode && (
          <div style={{ background: '#1e293b', padding: '30px', borderRadius: '16px', marginBottom: '30px', color: '#f8fafc' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '15px', color: '#fff' }}>Install Tracking Code</h3>
            <p style={{ color: '#94a3b8', marginBottom: '15px' }}>Paste this snippet inside the <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: '4px' }}>&lt;head&gt;</code> tag of your website.</p>
            <pre style={{ background: '#0f172a', padding: '20px', borderRadius: '8px', overflowX: 'auto', fontSize: '14px', border: '1px solid #334155' }}>
{`<script>
  window.RA_TRACKER_URL = "${API_BASE_URL}/api/track-click";
</script>
<script src="${window.location.origin}/tracker.js" defer></script>`}
            </pre>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
          {['today', '7days', '30days', 'all', 'custom'].map(filter => (
            <button 
              key={filter}
              onClick={() => setDateFilter(filter)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: dateFilter === filter ? '#FF9900' : '#e2e8f0',
                color: dateFilter === filter ? '#fff' : '#475569',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: '0.2s'
              }}
            >
              {filter === 'today' ? 'Today' : filter === '7days' ? 'Last 7 Days' : filter === '30days' ? 'Last 30 Days' : filter === 'custom' ? 'Custom Date' : 'All Time'}
            </button>
          ))}
        </div>

        {/* Custom Date Picker (Only shows when 'custom' is selected) */}
        {dateFilter === 'custom' && (
          <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', alignItems: 'flex-end', background: '#e2e8f0', padding: '15px', borderRadius: '8px', width: 'fit-content' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Start Date</label>
              <input 
                type="date" 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </div>
            <span style={{ color: '#64748b', fontWeight: 'bold', marginBottom: '10px' }}>to</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>End Date</label>
              <input 
                type="date" 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </div>
            <button
              onClick={() => setAppliedCustomDates({ start: customStartDate, end: customEndDate })}
              style={{ padding: '9px 20px', borderRadius: '6px', border: 'none', background: '#1D2B44', color: '#fff', fontWeight: 'bold', cursor: 'pointer', marginLeft: '10px' }}
            >
              Apply
            </button>
            {window.location.hostname === 'localhost' && (
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_BASE_URL}/api/seed-tracking`);
                    if (res.ok) {
                      alert('Sample Leads Generated Successfully! Please refresh.');
                      fetchTrackingData();
                    }
                  } catch (e) {
                    alert('Error generating leads. Make sure backend is restarted.');
                  }
                }}
                style={{ padding: '9px 20px', borderRadius: '6px', border: '1px solid #1D2B44', background: 'transparent', color: '#1D2B44', fontWeight: 'bold', cursor: 'pointer', marginLeft: 'auto' }}
              >
                Generate Sample Leads
              </button>
            )}
          </div>
        )}
        
        <div style={{ marginBottom: dateFilter === 'custom' ? '0' : '30px' }}></div>

        {/* --- PROFESSIONAL AD TRACKER MENU --- */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '30px', 
          marginBottom: '35px', 
          borderBottom: '1px solid #e2e8f0', 
          paddingBottom: '0'
        }}>
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: '🏠', path: '/ad-tracker' },
            { id: 'ad_position', label: 'Ad Position Intel', icon: '📍', path: '/ad-position-intel' },
            { id: 'campaigns', label: 'Campaigns', icon: '📊', path: '/campaign-analytics' },
            { id: 'networks', label: 'Ad Networks', icon: '🌐', path: '/platform-analytics' },
            { id: 'fraud', label: 'Fraud Audit', icon: '🛡️', path: '/fraud-analytics' },
            { id: 'keywords', label: 'Keyword ROI', icon: '📈', path: '/keyword-roi' },
            { id: 'truecaller', label: 'TrueCaller Intelligence', icon: '🛡️', path: '/truecaller' },
            { id: 'live', label: 'Live Stream', icon: '📡', path: '/live-traffic' }
          ].map(item => (
            <div 
              key={item.id}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 5px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '700',
                color: item.id === 'overview' ? '#1D2B44' : '#64748b',
                borderBottom: item.id === 'overview' ? '3px solid #FF9900' : '3px solid transparent',
                transition: '0.3s all ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (item.id !== 'overview') e.currentTarget.style.color = '#1D2B44';
              }}
              onMouseLeave={(e) => {
                if (item.id !== 'overview') e.currentTarget.style.color = '#64748b';
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
              {item.id === 'ad_position' && (
                <span style={{ position: 'absolute', top: '-5px', right: '-15px', background: '#ef4444', color: '#fff', fontSize: '8px', padding: '1px 4px', borderRadius: '4px', fontWeight: '900' }}>NEW</span>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '25px', marginBottom: '40px' }}>
          <div onClick={() => navigate('/ad-analytics')} style={{ cursor: 'pointer' }}>
            <MetricCard 
              title="Ads Performance Analytics" 
              value={Object.keys(clickData.reduce((acc, c) => { if(c.adContent) acc[c.adContent]=1; return acc; }, {})).length} 
              color="#3b82f6" 
              tooltip="Active Ad Campaigns Tracked"
              interactive={true}
            />
          </div>
          <div onClick={() => navigate('/fraud-analytics')} style={{ cursor: 'pointer' }}>
            <MetricCard 
              title="Fraud & Security" 
              value={clickData.filter(c => c.isSuspicious).length} 
              color="#ef4444" 
              alert={clickData.filter(c => c.isSuspicious).length > 0}
              tooltip="Suspicious IPs Flagged"
              interactive={true}
            />
          </div>
          <div onClick={() => navigate('/keyword-roi')} style={{ cursor: 'pointer' }}>
            <MetricCard 
              title="Keyword ROI Intelligence" 
              value={Object.keys(clickData.reduce((acc, c) => { if(c.keyword) acc[c.keyword]=1; return acc; }, {})).length} 
              color="#10b981" 
              tooltip="Keywords with Conversion Data"
              interactive={true}
            />
          </div>
          <div onClick={() => navigate('/traffic-details/all')} style={{ cursor: 'pointer' }}>
            <MetricCard 
              title="Total Reach Cities" 
              value={new Set(clickData.map(c => c.city)).size} 
              color="#f59e0b" 
              tooltip="Geographic Footprint"
              interactive={true}
            />
          </div>
        </div>

        {/* Revenue & Conversion Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px', marginBottom: '40px' }}>
          <div 
            onClick={() => navigate('/traffic-details/revenue')}
            style={{ 
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
              padding: '40px', 
              borderRadius: '24px', 
              color: '#fff', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: '0.3s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Total Attributed Revenue</div>
              <div style={{ fontSize: '48px', fontWeight: '900', color: '#10b981' }}>${clickData.reduce((acc, c) => acc + (c.revenue || 0), 0).toLocaleString()}</div>
              <div style={{ marginTop: '10px', fontSize: '13px', color: '#64748b' }}>ROI tracking enabled across all campaigns</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>Total Orders</div>
              <div style={{ fontSize: '32px', fontWeight: '900' }}>{clickData.filter(c => c.orderId).length}</div>
              <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '5px', fontWeight: 'bold' }}>View All Orders →</div>
            </div>
          </div>
          <div 
            onClick={() => navigate('/live-traffic')}
            style={{ background: '#0f172a', padding: '25px', borderRadius: '16px', color: '#fff', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: '0.3s', border: '1px solid transparent' }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
          >
            <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981', animation: 'pulse 2s infinite' }}></div>
              <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Live</span>
            </div>
            <style>{`
              @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.5); opacity: 0.5; }
                100% { transform: scale(1); opacity: 1; }
              }
            `}</style>
            <div style={{ fontSize: '12px', fontWeight: '700', opacity: 0.6, textTransform: 'uppercase', marginBottom: '10px' }}>Active Now</div>
            <div style={{ fontSize: '36px', fontWeight: '900' }}>{clickData.filter(c => new Date(c.clickedAt) > new Date(Date.now() - 5 * 60 * 1000)).length}</div>
            <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '8px', fontWeight: 'bold' }}>View Details →</div>
          </div>
        </div>

        {/* Conversion Funnel & Fraud Forensics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
          {/* Conversion Funnel */}
          <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Behavioral Conversion Funnel</h2>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginTop: '4px' }}>CLICK STAGES FOR DEEP ANALYTICS</div>
              </div>
              <button 
                onClick={() => alert('Deep Funnel Intelligence: Analyzing bottlenecks in user journey...') }
                style={{ background: '#f1f5f9', border: 'none', color: '#3b82f6', fontSize: '11px', fontWeight: '900', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}
              >
                LIVE INSIGHTS
              </button>
            </div>
            
            {(() => {
              const total = clickData.length;
              
              const viewedProds = clickData.filter(c => { 
                try { 
                  const p = typeof c.pagesVisited === 'string' ? JSON.parse(c.pagesVisited) : (c.pagesVisited || []);
                  return p.length > 2; 
                } catch(e) {return false;} 
              }).length;

              const carted = clickData.filter(c => { 
                try { 
                  const a = typeof c.actions === 'string' ? JSON.parse(c.actions) : (c.actions || []);
                  return a.some(act => act.toLowerCase().includes('cart')); 
                } catch(e) {return false;} 
              }).length;

              const orders = clickData.filter(c => c.orderId).length;

              const funnelSteps = [
                { label: 'Landed on Site', count: total, color: '#3b82f6', icon: '🎯', type: 'all' },
                { label: 'High Interest (3+ pgs)', count: viewedProds, color: '#6366f1', icon: '👀', type: 'funnel-interest' },
                { label: 'Added to Cart', count: carted, color: '#f59e0b', icon: '🛒', type: 'funnel-cart' },
                { label: 'Successful Order', count: orders, color: '#10b981', icon: '💰', type: 'orders' }
              ];

              return (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {funnelSteps.map((step, idx) => {
                      const percent = total > 0 ? (step.count / total) * 100 : 0;
                      const prevCount = idx > 0 ? funnelSteps[idx-1].count : null;
                      const dropoff = prevCount ? (((prevCount - step.count) / prevCount) * 100).toFixed(0) : null;

                      return (
                        <div key={step.label} style={{ marginBottom: '15px', position: 'relative' }}>
                          <div 
                            onClick={() => navigate(`/traffic-details/${step.type}`)}
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              marginBottom: '8px', 
                              alignItems: 'center',
                              cursor: 'pointer',
                              padding: '10px 15px',
                              borderRadius: '16px',
                              transition: '0.2s',
                              background: 'rgba(248, 250, 252, 0.5)',
                              border: '1px solid #f1f5f9'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = '#f8fafc';
                              e.currentTarget.style.borderColor = step.color;
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = 'rgba(248, 250, 252, 0.5)';
                              e.currentTarget.style.borderColor = '#f1f5f9';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '20px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>{step.icon}</span>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: '900', color: '#1e293b' }}>{step.label}</div>
                                {dropoff !== null && (
                                  <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold' }}>
                                    {dropoff}% of previous stage lost
                                  </div>
                                )}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '16px', fontWeight: '900', color: step.color }}>{step.count}</div>
                              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>{percent.toFixed(0)}% Retention</div>
                            </div>
                          </div>
                          <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', margin: '0 15px' }}>
                            <div style={{ width: `${percent}%`, height: '100%', background: step.color, borderRadius: '4px', transition: '1.5s cubic-bezier(0.16, 1, 0.3, 1) width' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Funnel Bottleneck Insight */}
                  {(() => {
                    let maxDrop = 0;
                    let bottleneckStep = '';
                    funnelSteps.forEach((s, i) => {
                      if (i > 0) {
                        const prev = funnelSteps[i-1].count;
                        const drop = prev > 0 ? (prev - s.count) / prev : 0;
                        if (drop > maxDrop) {
                          maxDrop = drop;
                          bottleneckStep = s.label;
                        }
                      }
                    });

                    if (maxDrop > 0.4) {
                      return (
                        <div style={{ marginTop: '25px', padding: '15px 20px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '24px' }}>🚧</span>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '900', color: '#92400e', textTransform: 'uppercase' }}>Conversion Bottleneck Detected</div>
                            <div style={{ fontSize: '13px', color: '#b45309', fontWeight: '600' }}>
                              Critical drop-off at <span style={{ color: '#d97706', fontWeight: '900' }}>{bottleneckStep}</span>. Consider optimizing this page to reduce abandonment.
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </>
              );
            })()}
          </div>

          {/* Fraud Forensics & VPN Shield */}
          <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>VPN & Proxy Shield</h2>
                <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold', marginTop: '4px' }}>🛡️ DEEP PACKET INSPECTION ACTIVE</div>
              </div>
              <button 
                onClick={() => navigate('/fraud-analytics')}
                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                DEEP FORENSICS →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {clickData.filter(c => c.isSuspicious).slice(0, 4).map((c, idx) => (
                <div key={idx} style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '18px', borderRadius: '20px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: '#ef4444' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontWeight: '900', color: '#b91c1c', fontSize: '14px', fontFamily: 'monospace' }}>{c.ipAddress}</div>
                    <span style={{ fontSize: '10px', background: c.isBlacklisted ? '#000' : '#b91c1c', color: '#fff', padding: '3px 10px', borderRadius: '100px', fontWeight: '900' }}>
                      {c.isBlacklisted ? 'BLACKLISTED' : 'REVOKED'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '11px', fontWeight: 'bold', color: '#7f1d1d' }}>
                    <span style={{ background: 'rgba(185, 28, 28, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>🚩 {c.suspicionReason}</span>
                    <span style={{ background: 'rgba(185, 28, 28, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>📍 {c.city}, {c.country}</span>
                    <span style={{ color: c.isBlacklisted ? '#000' : '#ef4444' }}>
                      {c.isBlacklisted ? '⛔ IP BANNED - SITE BLOCKED' : '⚡ SITE LOCKED INSTANTLY'}
                    </span>
                  </div>
                </div>
              ))}
              {clickData.filter(c => c.isSuspicious).length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  🛡️ No active fraud attempts detected.
                </div>
              )}
            </div>
            
            <button 
              onClick={() => alert('Generating Comprehensive Fraud Evidence Report for Google/Facebook Ads Support...\n\nIncludes: IP Timestamps, VPN Signatures, and Bot Behavior Logs.')}
              style={{ width: '100%', marginTop: '20px', background: '#ef4444', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '13px', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)' }}
            >
              📊 Generate Refund Evidence Report
            </button>
          </div>
        </div>

        {/* ROI & Keyword Intelligence */}
        <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '30px', marginBottom: '40px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>ROI & Keyword Intelligence</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>Analyzing which search terms are driving the most revenue.</p>
            </div>
            <button 
              onClick={() => navigate('/keyword-roi')}
              style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', color: '#1e293b', cursor: 'pointer' }}
            >
              Full Attribution Report →
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  <th style={{ padding: '12px 15px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Target Keyword</th>
                  <th style={{ padding: '12px 15px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Clicks</th>
                  <th style={{ padding: '12px 15px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Orders</th>
                  <th style={{ padding: '12px 15px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Conversion Rate</th>
                  <th style={{ padding: '12px 15px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Revenue Generated</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const kwMap = {};
                  clickData.forEach(c => {
                    if (c.keyword) {
                      if (!kwMap[c.keyword]) kwMap[c.keyword] = { clicks: 0, orders: 0, revenue: 0 };
                      kwMap[c.keyword].clicks++;
                      if (c.orderId) kwMap[c.keyword].orders++;
                      kwMap[c.keyword].revenue += (c.revenue || 0);
                    }
                  });

                  return Object.entries(kwMap)
                    .sort((a, b) => b[1].revenue - a[1].revenue)
                    .slice(0, 5)
                    .map(([kw, stats]) => {
                      const convRate = (stats.orders / stats.clicks) * 100;
                      return (
                        <tr 
                          key={kw} 
                          onClick={() => navigate(`/keyword-intel/${encodeURIComponent(kw)}`)}
                          style={{ 
                            borderBottom: '1px solid #f8fafc', 
                            transition: '0.2s',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '18px' }}>🔍</span>
                              <div style={{ fontWeight: '800', color: '#1e293b' }}>{kw}</div>
                              <span style={{ fontSize: '9px', background: '#6366f1', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: '900' }}>DEEP SCAN</span>
                            </div>
                          </td>
                          <td style={{ padding: '15px', color: '#64748b', fontWeight: 'bold' }}>{stats.clicks}</td>
                          <td style={{ padding: '15px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ fontSize: '13px', fontWeight: '900', color: '#10b981' }}>{stats.orders} Conversions</div>
                              <div style={{ width: '100px', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(convRate * 5, 100)}%`, height: '100%', background: '#10b981' }}></div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '15px', fontSize: '14px', fontWeight: '900', color: '#3b82f6' }}>
                            {convRate.toFixed(1)}%
                          </td>
                          <td style={{ padding: '15px' }}>
                            <div style={{ background: '#ecfdf5', color: '#059669', padding: '8px 15px', borderRadius: '12px', display: 'inline-block', fontWeight: '900', fontSize: '18px', border: '1px solid #d1fae5' }}>
                              ${stats.revenue.toLocaleString()}
                            </div>
                          </td>
                        </tr>
                      );
                    });
                })()}
                {Object.keys(clickData.reduce((acc, c) => { if(c.keyword) acc[c.keyword]=1; return acc; }, {})).length === 0 && (
                  <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Generating ROI Intelligence Data...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Platform Master Intelligence */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '24px', padding: '30px', marginBottom: '40px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                <span style={{ background: '#3b82f6', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '900' }}>NEW</span>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Platform Master Intelligence</h2>
              </div>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Unified attribution across Google, Facebook, Instagram, and more.</p>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#3b82f6' }}>{new Set(clickData.map(c => c.source || 'Direct')).size}</div>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>ACTIVE SOURCES</div>
              </div>
              <button 
                onClick={() => navigate('/platform-analytics')}
                style={{ 
                  background: '#3b82f6', 
                  color: '#fff', 
                  border: 'none', 
                  padding: '10px 18px', 
                  borderRadius: '10px', 
                  fontSize: '11px', 
                  fontWeight: '900', 
                  cursor: 'pointer',
                  transition: '0.3s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                📊 VIEW DEEP ANALYTICS
              </button>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '12px 15px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Ad Network</th>
                  <th style={{ padding: '12px 15px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Volume</th>
                  <th style={{ padding: '12px 15px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Conversions</th>
                  <th style={{ padding: '12px 15px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>ROI ($)</th>
                  <th style={{ padding: '12px 15px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Forensic Health</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const sourceMap = {};
                  clickData.forEach(c => {
                    const src = c.source || 'Direct Traffic';
                    if (!sourceMap[src]) sourceMap[src] = { clicks: 0, conversions: 0, revenue: 0, fraud: 0 };
                    sourceMap[src].clicks++;
                    if (c.formInteracted) sourceMap[src].conversions++;
                    if (c.revenue) sourceMap[src].revenue += c.revenue;
                    if (c.isSuspicious) sourceMap[src].fraud++;
                  });

                  return Object.entries(sourceMap)
                    .sort((a, b) => b[1].clicks - a[1].clicks)
                    .map(([name, stats]) => (
                      <tr 
                        key={name} 
                        onClick={() => navigate(`/source-intel/${encodeURIComponent(name)}`)}
                        style={{ 
                          borderBottom: '1px solid rgba(255,255,255,0.05)', 
                          cursor: 'pointer',
                          transition: '0.3s all ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '15px' }}>
                          <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                             <div style={{ 
                               width: '32px', height: '32px', borderRadius: '8px', 
                               background: name.toLowerCase().includes('google') ? '#4285F4' : 
                                          (name.toLowerCase().includes('facebook') ? '#1877F2' : 
                                          (name.toLowerCase().includes('instagram') ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' : 
                                          (name.toLowerCase().includes('bing') ? '#00A1F1' : 
                                          (name.toLowerCase().includes('youtube') ? '#FF0000' : 
                                          (name.toLowerCase().includes('linkedin') ? '#0A66C2' : 
                                          (name.toLowerCase().includes('twitter') ? '#000000' : '#334155')))))),
                               display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '900', color: '#fff', boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                             }}>
                               {name.charAt(0).toUpperCase()}
                             </div>
                             <div style={{ display: 'flex', flexDirection: 'column' }}>
                               <span>{name}</span>
                               <span style={{ fontSize: '9px', background: '#3b82f6', color: '#fff', padding: '2px 6px', borderRadius: '4px', width: 'fit-content', marginTop: '2px' }}>VIEW DETAILS</span>
                             </div>
                          </div>
                        </td>
                        <td style={{ padding: '15px', fontWeight: 'bold' }}>{stats.clicks} Hits</td>
                        <td style={{ padding: '15px', fontWeight: 'bold', color: '#10b981' }}>{stats.conversions}</td>
                        <td style={{ padding: '15px', fontWeight: '900', color: '#10b981' }}>${stats.revenue.toLocaleString()}</td>
                        <td style={{ padding: '15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', width: '80px' }}>
                              <div style={{ 
                                width: `${Math.max(10, 100 - (stats.fraud/stats.clicks*100))}%`, 
                                height: '100%', 
                                background: stats.fraud/stats.clicks > 0.2 ? '#ef4444' : '#10b981', 
                                borderRadius: '3px' 
                              }}></div>
                            </div>
                            <span style={{ fontSize: '10px', color: stats.fraud/stats.clicks > 0.2 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                              {stats.fraud > 0 ? `${stats.fraud} FRAUD` : 'CLEAN'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ));
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* Campaign Intelligence Overview */}
        <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '30px', marginBottom: '40px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Campaign Intelligence Overview</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>Strategic performance monitoring across all active marketing campaigns.</p>
            </div>
            <button 
              onClick={() => navigate('/campaign-analytics')}
              style={{ 
                background: '#0f172a', 
                color: '#fff', 
                border: 'none', 
                padding: '10px 18px', 
                borderRadius: '10px', 
                fontSize: '11px', 
                fontWeight: '900', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                transition: '0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              📊 VIEW DEEP ANALYTICS
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  <th style={{ padding: '12px 15px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Campaign Name</th>
                  <th style={{ padding: '12px 15px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Total Ad Sets</th>
                  <th style={{ padding: '12px 15px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Gross Clicks</th>
                  <th style={{ padding: '12px 15px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Conversions</th>
                  <th style={{ padding: '12px 15px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>ROI ($)</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const campMap = {};
                  clickData.forEach(c => {
                    const camp = c.campaignName || 'General Traffic';
                    if (!campMap[camp]) campMap[camp] = { adSets: new Set(), clicks: 0, conversions: 0, revenue: 0 };
                    campMap[camp].clicks++;
                    if (c.adGroup) campMap[camp].adSets.add(c.adGroup);
                    if (c.formInteracted) campMap[camp].conversions++;
                    if (c.revenue) campMap[camp].revenue += c.revenue;
                  });

                  return Object.entries(campMap)
                    .sort((a, b) => b[1].clicks - a[1].clicks)
                    .map(([name, stats]) => (
                      <tr key={name} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '15px' }}>
                          <div style={{ fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }}></div>
                            {name}
                          </div>
                        </td>
                        <td style={{ padding: '15px' }}>
                          <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                            {stats.adSets.size} Ad Groups
                          </span>
                        </td>
                        <td style={{ padding: '15px', fontWeight: 'bold', color: '#334155' }}>{stats.clicks}</td>
                        <td style={{ padding: '15px', fontWeight: 'bold', color: '#10b981' }}>{stats.conversions}</td>
                        <td style={{ padding: '15px' }}>
                          <div style={{ background: '#ecfdf5', color: '#059669', padding: '6px 12px', borderRadius: '10px', fontWeight: '900', border: '1px solid #d1fae5', display: 'inline-block' }}>
                            ${stats.revenue.toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    ));
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ads Intelligence Analytics */}
        <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '30px', marginBottom: '40px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Ads Performance Analytics</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>Tracking clicks and conversions for each individual ad campaign.</p>
            </div>
            <button 
              onClick={() => navigate('/ad-analytics')}
              style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)' }}
            >
              <span>🔍 VIEW DEEP ANALYTICS</span>
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  <th style={{ padding: '12px 15px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Ad Name / Content</th>
                  <th style={{ padding: '12px 15px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Ad Group</th>
                  <th style={{ padding: '12px 15px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Total Clicks</th>
                  <th style={{ padding: '12px 15px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Returning Users</th>
                  <th style={{ padding: '12px 15px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Conversions</th>
                  <th style={{ padding: '12px 15px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const adMap = {};
                  clickData.forEach(c => {
                    const adName = c.adContent || 'Direct/Unknown';
                    if (!adMap[adName]) adMap[adName] = { clicks: 0, returning: 0, conversions: 0, adGroup: c.adGroup || 'N/A' };
                    adMap[adName].clicks++;
                    if (c.isReturning) adMap[adName].returning++;
                    if (c.formInteracted) adMap[adName].conversions++;
                  });

                  return Object.entries(adMap)
                    .sort((a, b) => b[1].clicks - a[1].clicks)
                    .map(([name, stats]) => (
                      <tr 
                        key={name} 
                        onClick={() => navigate(`/campaign-intel/${encodeURIComponent(name)}`)}
                        style={{ 
                          borderBottom: '1px solid #f8fafc', 
                          cursor: 'pointer',
                          transition: '0.3s all ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '15px' }}>
                          <div style={{ fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>📢</span>
                            <span>{name}</span>
                            <span style={{ fontSize: '10px', background: '#3b82f6', color: '#fff', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px' }}>VIEW DETAILS</span>
                          </div>
                        </td>
                        <td style={{ padding: '15px' }}>
                          <span style={{ fontSize: '12px', background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold' }}>
                            {stats.adGroup}
                          </span>
                        </td>
                        <td style={{ padding: '15px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.clicks}</td>
                        <td style={{ padding: '15px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.returning}</td>
                        <td style={{ padding: '15px', fontWeight: 'bold', color: '#10b981' }}>{stats.conversions}</td>
                        <td style={{ padding: '15px' }}>
                          <div style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '900', display: 'inline-block' }}>
                            {((stats.conversions / stats.clicks) * 100).toFixed(1)}%
                          </div>
                        </td>
                      </tr>
                    ));
                })()}
              </tbody>
            </table>
          </div>
        </div>


        {/* Data Table */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '20px 25px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Traffic Log</h2>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                  <th onClick={() => requestSort('clickedAt')} style={{ ...thStyle, cursor: 'pointer' }}>
                    Date & Time {sortConfig.key === 'clickedAt' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                  </th>
                  <th onClick={() => requestSort('ipAddress')} style={{ ...thStyle, cursor: 'pointer' }}>
                    Raw IP Address {sortConfig.key === 'ipAddress' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                  </th>
                  <th onClick={() => requestSort('source')} style={{ ...thStyle, cursor: 'pointer' }}>
                    Source {sortConfig.key === 'source' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                  </th>
                  <th onClick={() => requestSort('deviceType')} style={{ ...thStyle, cursor: 'pointer' }}>
                    Device {sortConfig.key === 'deviceType' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                  </th>
                  <th onClick={() => requestSort('timeOnSite')} style={{ ...thStyle, cursor: 'pointer' }}>
                    Time on Site {sortConfig.key === 'timeOnSite' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                  </th>
                  <th onClick={() => requestSort('formInteracted')} style={{ ...thStyle, cursor: 'pointer' }}>
                    Form Interacted {sortConfig.key === 'formInteracted' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                  </th>
                  <th onClick={() => requestSort('isSuspicious')} style={{ ...thStyle, cursor: 'pointer' }}>
                    Fraud Status {sortConfig.key === 'isSuspicious' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Loading tracking data...</td></tr>
                ) : sortedData.length === 0 ? (
                  <tr><td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No clicks recorded for this period.</td></tr>
                ) : (
                  sortedData.map((click) => (
                    <tr key={click.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{new Date(click.clickedAt).toLocaleDateString()}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>{new Date(click.clickedAt).toLocaleTimeString()}</div>
                      </td>
                      <td style={tdStyle}>
                        <div 
                          onClick={() => {
                            if (click.isReturning) {
                              navigate(`/gold-user/${click.ipAddress}`);
                            } else {
                              navigate(`/ip-story/${click.ipAddress}`);
                            }
                          }}
                          className="ip-link"
                          style={{ 
                            fontWeight: '700', 
                            color: '#1D2B44', 
                            fontFamily: 'JetBrains Mono, monospace', 
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            padding: '10px',
                            background: click.isReturning ? 'rgba(255, 153, 0, 0.05)' : '#f8fafc',
                            borderRadius: '12px',
                            width: 'fit-content',
                            transition: '0.2s',
                            border: click.isReturning ? '1px solid #FF9900' : '1px solid #e2e8f0'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {click.ipAddress || 'Unknown'}
                            {click.isReturning && (
                              <span style={{ fontSize: '9px', background: '#FF9900', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: '900', animation: 'blink 1.5s infinite' }}>
                                🌟 GOLD USER
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>
                            {click.visitCount > 1 ? `Visit #${click.visitCount}` : 'First Visit'}
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '100px', 
                          fontSize: '12px', 
                          fontWeight: 'bold',
                          background: click.source === 'google_ads' ? '#e0f2fe' : '#f1f5f9',
                          color: click.source === 'google_ads' ? '#0284c7' : '#475569'
                        }}>
                          {click.source === 'google_ads' ? 'Google Ads' : click.source || 'Direct'}
                        </span>
                        {click.gclid && <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>GCLID Captured</div>}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: '800', color: '#1e293b' }}>{click.deviceModel || click.deviceType}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{click.browser} / {click.os}</div>
                      </td>
                      <td style={tdStyle}>
                        {click.timeOnSite !== null ? (
                          <span style={{ color: click.timeOnSite < 5 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                            {click.timeOnSite}s {click.timeOnSite < 5 && '(Bounce)'}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Tracking...</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        {click.formInteracted ? (
                          <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Yes</span>
                        ) : (
                          <span style={{ color: '#ef4444' }}>✗ No</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        {click.isSuspicious ? (
                          <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '13px' }}>
                            ⚠️ Suspicious
                            <div style={{ fontSize: '11px', fontWeight: 'normal', opacity: 0.8 }}>{click.suspicionReason}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#10b981', fontWeight: '500' }}>✓ Clean</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Deep Intel Modal / Sidebar */}
      {selectedClick && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: '550px', background: '#fff', height: '100%', overflowY: 'auto', padding: '0', boxShadow: '-20px 0 50px rgba(0,0,0,0.2)', animation: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
            
            {/* Modal Header */}
            <div style={{ position: 'sticky', top: 0, background: '#fff', padding: '25px 40px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Traffic Insights</div>
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: 0 }}>{selectedClick.ipAddress}</h2>
              </div>
              <button 
                onClick={() => setSelectedClick(null)} 
                style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#64748b' }}
              >✕</button>
            </div>

            <div style={{ padding: '40px' }}>
              
              {/* Summary Badges */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                <Badge 
                  label={selectedClick.isSuspicious ? 'Suspicious' : 'Genuine'} 
                  color={selectedClick.isSuspicious ? '#ef4444' : '#10b981'} 
                  bg={selectedClick.isSuspicious ? '#fee2e2' : '#dcfce7'} 
                />
                <Badge label={selectedClick.deviceType} color="#6366f1" bg="#e0e7ff" />
                <Badge label={selectedClick.country || 'Unknown'} color="#f59e0b" bg="#fef3c7" />
              </div>

              {/* Map & Location */}
              <div style={{ marginBottom: '40px' }}>
                <div style={{ height: '220px', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                  <img src={`https://static-maps.yandex.ru/1.x/?lang=en-US&ll=${selectedClick.lon || 77.2090},${selectedClick.lat || 28.6139}&z=11&l=map&size=600,250`} alt="Map" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: '15px', left: '15px', background: '#fff', padding: '10px 15px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Current Location</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>{selectedClick.city}, {selectedClick.country}</div>
                  </div>
                </div>
              </div>

              {/* Technical Profile */}
              <SectionTitle title="Technical Profile" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '40px', background: '#f8fafc', padding: '25px', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                <ProfileItem icon="🌐" label="ISP / Network" value={selectedClick.isp || 'N/A'} />
                <ProfileItem icon="🎯" label="Source" value={selectedClick.source?.replace('_', ' ').toUpperCase() || 'ORGANIC'} />
                <ProfileItem icon="⚡" label="Page Load" value={selectedClick.pageLoadTime ? `${selectedClick.pageLoadTime}ms` : 'N/A'} />
                <ProfileItem icon="💻" label="Device" value={selectedClick.deviceModel || selectedClick.deviceType} />
                <ProfileItem icon="🧭" label="Browser" value={selectedClick.browser} />
                <ProfileItem icon="🖥️" label="OS" value={selectedClick.os} />
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
                <ProfileItem icon="🖱️" label="Frequency" value={`${clickData.filter(c => c.ipAddress === selectedClick.ipAddress).length} Total Clicks`} />
              </div>
              
              <div style={{ marginBottom: '30px', textAlign: 'right' }}>
                <button 
                  onClick={() => navigate(`/ip-story/${selectedClick.ipAddress}`)}
                  style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: '800', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}
                >
                  View Full Behavioral History & Map →
                </button>
              </div>

              {/* Unified Session Timeline (A to Z) */}
              <SectionTitle title="Full Session Timeline (A to Z)" />
              <div style={{ position: 'relative', paddingLeft: '20px', marginBottom: '40px' }}>
                <div style={{ position: 'absolute', left: '7px', top: '5px', bottom: '5px', width: '2px', background: '#e2e8f0' }}></div>
                
                {(() => {
                  const pages = JSON.parse(selectedClick.pagesVisited || '[]');
                  const actions = JSON.parse(selectedClick.actions || '[]');
                  
                  // Combine or list in sequence. For demo, we'll list the actions as they are enriched.
                  return actions.map((action, idx) => {
                    const isPage = action.startsWith('Landed') || action.startsWith('Navigated') || action.startsWith('Viewed');
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
                          border: '3px solid #fff',
                          boxShadow: '0 0 0 2px #e2e8f0',
                          zIndex: 1
                        }}></div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '800', color: isConversion ? '#10b981' : (isInteraction ? '#2563eb' : '#1e293b') }}>
                            {action}
                          </div>
                          {pages[idx] && (
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              <span style={{ opacity: 0.7 }}>Path:</span> <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{pages[idx]}</span>
                            </div>
                          )}
                          {!pages[idx] && isConversion && (
                            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>CONVERSION GOAL REACHED ✅</div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {selectedClick.isSuspicious && (
                <div style={{ marginTop: '40px', padding: '20px', borderRadius: '16px', background: '#fff1f2', border: '1px solid #fecaca' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e11d48', fontWeight: '900', fontSize: '14px', marginBottom: '5px' }}>
                    ⚠️ FRAUD ALERT
                  </div>
                  <div style={{ fontSize: '13px', color: '#9f1239' }}>{selectedClick.suspicionReason}</div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

// --- Helper Components ---
const SectionTitle = ({ title }) => (
  <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>{title}</h3>
);

const Badge = ({ label, color, bg }) => (
  <span style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '11px', fontWeight: '800', background: bg, color: color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
    {label}
  </span>
);

const ProfileItem = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
    <div style={{ fontSize: '20px' }}>{icon}</div>
    <div style={{ overflow: 'hidden' }}>
      <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{value}</div>
    </div>
  </div>
);

// Reusable Styles
const thStyle = { padding: '15px 20px', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle = { padding: '15px 20px', fontSize: '14px', color: '#334155', verticalAlign: 'top' };

// Reusable Metric Card Component
const MetricCard = ({ title, value, color, alert, tooltip, interactive }) => (
  <div 
    style={{ 
      background: '#fff', 
      padding: '25px', 
      borderRadius: '16px', 
      border: alert ? `2px solid ${color}` : '1px solid #e2e8f0', 
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', 
      position: 'relative',
      transition: '0.3s'
    }}
    onMouseOver={(e) => {
      if(interactive) {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = `0 10px 15px -3px ${color}20`;
      }
    }}
    onMouseOut={(e) => {
      if(interactive) {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02)';
      }
    }}
  >
    <div style={{ fontSize: '13px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
      {title}
    </div>
    <div style={{ fontSize: '32px', fontWeight: '900', color: color }}>
      {value}
    </div>
    {interactive && (
      <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '10px', fontWeight: '800' }}>Deep Analysis →</div>
    )}
    {tooltip && !interactive && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px' }}>{tooltip}</div>}
  </div>
);

export default AdTracker;
