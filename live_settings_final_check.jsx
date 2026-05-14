import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = '/api';

const Settings = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  
  // Global States
  const [globalApiKey, setGlobalApiKey] = useState('');
  const [globalScrapingdogApiKey, setGlobalScrapingdogApiKey] = useState('');
  const [globalSerpapiKey, setGlobalSerpapiKey] = useState('');
  const [globalProxyUrl, setGlobalProxyUrl] = useState('');
  const [globalProxies, setGlobalProxies] = useState([]);
  const [isRandomProxy, setIsRandomProxy] = useState(false);
  const [activeProxyIdx, setActiveProxyIdx] = useState(null);
  const [serperQuotaActive, setSerperQuotaActive] = useState(true);
  
  const [projects, setProjects] = useState([]);
  const [selectedSettingProjId, setSelectedSettingProjId] = useState('');
  const [tmpProjStrategy, setTmpProjStrategy] = useState(null);
  const [proxyBulkText, setProxyBulkText] = useState('');
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  
  // Profile Edit States
  const [newName, setNewName] = useState(user?.name || '');
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const cleanProxyUrl = (url) => {
    if (!url) return '';
    let clean = url.trim();
    if (clean.toLowerCase().startsWith('curl')) {
      const parts = clean.split(' ');
      const proxyPart = parts.find(p => p.startsWith('http'));
      if (proxyPart) clean = proxyPart;
    }
    return clean;
  };

  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || localStorage.getItem('activeSettingsTab') || 'profile');

  useEffect(() => {
    localStorage.setItem('activeSettingsTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user) {
      setNewName(user.name);
      setNewEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
    fetchProjects();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setGlobalApiKey(data.globalSerperApiKey || '');
      setGlobalScrapingdogApiKey(data.globalScrapingdogApiKey || '');
      setGlobalSerpapiKey(data.globalSerpapiKey || '');
      setGlobalProxyUrl(data.globalProxyUrl || '');
      setGlobalProxies(data.globalProxies || []);
      setIsRandomProxy(!!data.isRandomProxy);
      setActiveProxyIdx(data.activeProxyIdx !== undefined ? data.activeProxyIdx : null);
      setSerperQuotaActive(data.serperQuotaActive !== false);
    } catch (err) { console.error('Settings fetch error:', err); }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setProjects(data);
      // Auto-select first project if available
      if (data && data.length > 0 && !selectedSettingProjId) {
        const first = data[0];
        setSelectedSettingProjId(String(first.id));
        setTmpProjStrategy({
          scrapingStrategy: first.scrapingStrategy || 'api_only',
          preferredApi: first.preferredApi || 'hybrid',
          device: first.device || 'desktop',
          proxyUrl: first.proxyUrl || ''
        });
      }
    } catch (err) { console.error('Projects fetch error:', err); }
  };

  const handleSaveAll = async () => {
    setSaveStatus('saving');
    try {
      await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          globalSerperApiKey: globalApiKey,
          globalScrapingdogApiKey: globalScrapingdogApiKey,
          globalSerpapiKey: globalSerpapiKey,
          globalProxyUrl: cleanProxyUrl(globalProxyUrl),
          globalProxies: globalProxies.map(p => cleanProxyUrl(p)),
          isRandomProxy,
          activeProxyIdx
        })
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) { 
      console.error('Save error:', err);
      setSaveStatus('error');
    }
  };

  const handleSaveProjectSettings = async () => {
    if (!selectedSettingProjId || !tmpProjStrategy) return;
    setSaveStatus('saving');
    try {
      await fetch(`${API_BASE}/projects/${selectedSettingProjId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...tmpProjStrategy,
          proxyUrl: cleanProxyUrl(tmpProjStrategy.proxyUrl)
        })
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
      fetchProjects(); // Refresh list
    } catch (err) {
      console.error('Project save error:', err);
      setSaveStatus('error');
    }
  };

  const handleTestSerper = async () => {
    if (!globalApiKey) { alert('Please enter a Serper API key first.'); return; }
    setIsTestingApi(true);
    try {
      const res = await fetch(`${API_BASE}/settings/test-serper`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ apiKey: globalApiKey })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ SERPER ACTIVE\nRemaining Credits: ${data.credits}`);
        setSerperQuotaActive(true);
      } else {
        alert(`❌ SERPER FAILED\nError: ${data.error}`);
        setSerperQuotaActive(false);
      }
    } catch (err) { alert('Serper API Test Error'); }
    setIsTestingApi(false);
  };

  const handleTestScrapingdog = async () => {
    if (!globalScrapingdogApiKey) { alert('Please enter a ScrapingDog key first.'); return; }
    setIsTestingApi(true);
    try {
      const res = await fetch(`${API_BASE}/settings/test-scrapingdog`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ apiKey: globalScrapingdogApiKey })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ SCRAPINGDOG ACTIVE\nConnection established successfully.`);
      } else {
        alert(`❌ SCRAPINGDOG FAILED\nError: ${data.error}`);
      }
    } catch (err) { alert('ScrapingDog API Test Error'); }
    setIsTestingApi(false);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    setIsUpdatingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: newName, email: newEmail, currentPassword, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ Profile updated successfully!");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        updateUser(data.user);
      } else {
        alert(`❌ Update failed: ${data.error}`);
      }
    } catch (err) { alert('Profile Update Error'); }
    setIsUpdatingProfile(false);
  };

  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('picture', file);
    setIsUploading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/upload-picture`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ Picture updated!");
        updateUser({ picture: data.picture });
      } else {
        alert(`❌ Upload failed: ${data.error}`);
      }
    } catch (err) { alert('Picture Upload Error'); }
    setIsUploading(false);
  };

  const handleTestProxyNode = async (proxyUrl) => {
    try {
      const res = await fetch(`${API_BASE}/settings/test-proxy`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ proxyUrl })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ PROXY ACTIVE\nReal IP: ${data.ip}`);
      } else {
        alert(`❌ PROXY FAILED\nError: ${data.error}`);
      }
    } catch (err) { alert('Proxy Test Error'); }
  };

  const parseProxyLabel = (url) => {
    if (!url) return 'Unknown';
    try {
      const u = new URL(url);
      return `${u.hostname}:${u.port}`;
    } catch (e) { return url; }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex' }}>
      {/* Settings Navigation Sidebar */}
      <aside style={{ width: '280px', background: '#1D2B44', color: '#fff', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed' }}>
        <div style={{ padding: '30px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div 
            onClick={() => navigate('/dashboard')}
            style={{ color: '#fff', fontSize: '18px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
             <span style={{ color: 'var(--accent)' }}>☚</span> Dashboard
          </div>
        </div>
        
        <nav style={{ padding: '20px', flex: 1 }}>
          {[
            { id: 'profile', label: '👤 Profile Info' },
            { id: 'projects', label: '📂 Select Project' },
            { id: 'api', label: '🔑 API Master Keys' },
            { id: 'proxies', label: '🌐 Proxy Clusters' }
          ].map(tab => (
            <div 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ 
                padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px',
                background: activeTab === tab.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#94a3b8',
                fontWeight: activeTab === tab.id ? '700' : '500',
                display: 'flex', alignItems: 'center', gap: '12px'
              }}
            >
              {tab.label}
            </div>
          ))}
        </nav>

        <div style={{ padding: '30px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button 
            onClick={logout}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '800' }}
          >
            Terminate Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ 
        marginLeft: windowWidth > 1000 ? '280px' : '0', 
        flex: 1, 
        padding: windowWidth > 600 ? '40px' : '20px',
        paddingBottom: '100px',
        width: '100%'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: windowWidth > 700 ? 'row' : 'column',
            justifyContent: 'space-between', 
            alignItems: windowWidth > 700 ? 'flex-end' : 'flex-start', 
            marginBottom: '40px',
            gap: '20px'
          }}>
            <div>
              <h1 style={{ margin: 0, fontSize: windowWidth > 600 ? '32px' : '24px', fontWeight: '900', color: '#1D2B44', letterSpacing: '-1px' }}>
                {activeTab === 'profile' ? 'Profile Settings' : activeTab === 'projects' ? 'Project Overrides' : activeTab === 'api' ? 'API Infrastructure' : 'Network Clusters'}
              </h1>
              <p style={{ margin: '8px 0 0', color: '#64748b', fontWeight: '500' }}>Manage your global search infrastructure and identity</p>
            </div>
            
            <button 
              onClick={handleSaveAll}
              disabled={saveStatus === 'saving'}
              style={{ 
                background: saveStatus === 'success' ? '#10b981' : 'var(--accent)', 
                color: '#fff', border: 'none', padding: '14px 40px', borderRadius: '12px', 
                fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 25px rgba(255, 153, 0, 0.2)',
                transition: '0.3s',
                width: windowWidth > 700 ? 'auto' : '100%'
              }}
            >
              {saveStatus === 'saving' ? 'SYNCING DATA...' : saveStatus === 'success' ? '✓ CHANGES PERSISTED' : 'COMMIT ALL UPDATES'}
            </button>
          </div>

          {/* TAB CONTENT */}
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            {activeTab === 'profile' && (
              <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: windowWidth > 800 ? 'row' : 'column', alignItems: 'center', gap: '40px' }}>
                <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current.click()}>
                  {user?.picture ? (
                    <img src={user.picture} alt="Profile" style={{ width: '150px', height: '150px', borderRadius: '40px', objectFit: 'cover', border: '6px solid #f8fafc', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
                  ) : (
                    <div style={{ width: '150px', height: '150px', borderRadius: '40px', background: 'linear-gradient(135deg, var(--accent), #ffb347)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px', fontWeight: '900', color: '#fff', border: '6px solid #f8fafc', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                      {user?.name?.substring(0, 2).toUpperCase() || '??'}
                    </div>
                  )}
                  <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', background: 'var(--accent)', color: '#fff', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #fff' }}>📷</div>
                  <input type="file" ref={fileInputRef} onChange={handlePictureUpload} style={{ display: 'none' }} accept="image/*" />
                </div>
                <div style={{ flex: 1 }}>
                  <form onSubmit={handleProfileUpdate}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#94a3b8', marginBottom: '10px' }}>FULL NAME</label>
                        <input style={{ width: '100%', padding: '16px 20px', borderRadius: '14px', border: '2px solid #e2e8f0', background: '#fff', outline: 'none' }} value={newName} onChange={e => setNewName(e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#94a3b8', marginBottom: '10px' }}>EMAIL ADDRESS</label>
                        <input style={{ width: '100%', padding: '16px 20px', borderRadius: '14px', border: '2px solid #e2e8f0', background: '#fff', outline: 'none' }} value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                      </div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '30px', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#94a3b8', marginBottom: '8px' }}>CURRENT PASSWORD</label>
                        <input type="password" style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none' }} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#94a3b8', marginBottom: '8px' }}>NEW PASSWORD</label>
                        <input type="password" style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none' }} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#94a3b8', marginBottom: '8px' }}>CONFIRM NEW</label>
                        <input type="password" style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none' }} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                      </div>
                    </div>
                    <button type="submit" style={{ marginTop: '30px', background: '#1D2B44', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>UPDATE PROFILE IDENTITY</button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                <div style={{ background: '#fff', padding: '35px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#1e293b' }}>⚡ SERPER.DEV ENGINE</h3>
                    <button onClick={handleTestSerper} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 15px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>TEST PIPELINE</button>
                  </div>
                  <input autoComplete="off" style={{ width: '100%', padding: '16px 20px', borderRadius: '14px', border: '2px solid #e2e8f0', background: '#f8fafc', outline: 'none' }} placeholder="Enter API key..." value={globalApiKey} onChange={e => setGlobalApiKey(e.target.value)} />
                  <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(255,153,0,0.05)', borderRadius: '16px', border: '1px solid rgba(255,153,0,0.1)' }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '900', color: '#c2410c' }}>🚀 QUICK START (2,500 FREE CREDITS):</h4>
                    <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                      1. Create a free account at <a href="https://serper.dev" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: '800', textDecoration: 'none' }}>Serper.dev</a><br/>
                      2. You'll get <b>2,500 queries for free</b> instantly.<br/>
                      3. Copy the API Key from your dashboard and paste it above.
                    </p>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>💡 Use this for hyper-localized organic and maps ranking data.</div>
                  </div>
                </div>
                <div style={{ background: '#fff', padding: '35px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#1e293b' }}>🛡️ SCRAPINGDOG.COM</h3>
                    <button onClick={handleTestScrapingdog} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 15px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>TEST PIPELINE</button>
                  </div>
                  <input autoComplete="off" style={{ width: '100%', padding: '16px 20px', borderRadius: '14px', border: '2px solid #e2e8f0', background: '#f8fafc', outline: 'none' }} placeholder="Enter API key..." value={globalScrapingdogApiKey} onChange={e => setGlobalScrapingdogApiKey(e.target.value)} />
                  <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(37,99,235,0.05)', borderRadius: '16px', border: '1px solid rgba(37,99,235,0.1)' }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '900', color: '#1d4ed8' }}>🌐 INFRASTRUCTURE (1,000 FREE CALLS):</h4>
                    <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                      1. Register at <a href="https://scrapingdog.com" target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: '800', textDecoration: 'none' }}>Scrapingdog.com</a><br/>
                      2. New accounts receive <b>1,000 FREE API credits</b>.<br/>
                      3. Enable this to bypass Google's advanced scraping defenses.
                    </p>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>🛡️ Best for residential IP rotation and high-fidelity deep scanning.</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'proxies' && (
              <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '40px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#94a3b8', marginBottom: '15px' }}>BULK INSERT PROXIES</label>
                    <textarea style={{ width: '100%', height: '200px', padding: '20px', borderRadius: '16px', border: '2px solid #e2e8f0', outline: 'none' }} placeholder="http://user:pass@host:port (one per line)" value={proxyBulkText} onChange={e => setProxyBulkText(e.target.value)} />
                    <button className="btn-primary" style={{ marginTop: '20px', width: '100%', padding: '16px', borderRadius: '12px' }} onClick={() => {
                      const list = proxyBulkText.split('\n').map(p => cleanProxyUrl(p.trim())).filter(p => p);
                      if (list.length > 0) { setGlobalProxies([...globalProxies, ...list]); setProxyBulkText(''); }
                    }}>DEPLOY TO CLUSTER</button>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#94a3b8', marginBottom: '15px' }}>ACTIVE NODES ({globalProxies.length})</label>
                    <div style={{ height: '270px', overflowY: 'auto', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '10px' }}>
                      {globalProxies.length === 0 ? <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Pool is empty.</div> : globalProxies.map((p, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#fff', borderRadius: '10px', marginBottom: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ flex: 1, fontSize: '12px', fontWeight: '700' }}>{parseProxyLabel(p)}</div>
                          <button onClick={() => setGlobalProxies(globalProxies.filter((_, idx) => idx !== i))} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', paddingBottom: '30px', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>Project Control Center</h3>
                    <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '14px' }}>Customize behavior for specific data streams.</p>
                  </div>
                  <div style={{ width: '350px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#94a3b8', marginBottom: '10px' }}>SELECT PROJECT SCOPE</label>
                    <select 
                      style={{ width: '100%', padding: '16px 20px', borderRadius: '14px', border: '2px solid #e2e8f0', background: '#fff', fontSize: '15px', fontWeight: '700', outline: 'none' }}
                      value={selectedSettingProjId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedSettingProjId(id);
                        const proj = projects.find(p => String(p.id) === String(id));
                        if (proj) setTmpProjStrategy({ 
                          scrapingStrategy: proj.scrapingStrategy || 'api_only', 
                          preferredApi: proj.preferredApi || 'hybrid',
                          device: proj.device || 'desktop', 
                          proxyUrl: proj.proxyUrl || '' 
                        });
                        else setTmpProjStrategy(null);
                      }}
                    >
                      <option value="">Select Project...</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>

                {!selectedSettingProjId ? (
                  <div style={{ padding: '80px', textAlign: 'center', background: 'rgba(248, 250, 252, 0.5)', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>📂</div>
                    <h4 style={{ margin: 0, color: '#475569', fontWeight: '800' }}>Choose a project scope to unlock configurations</h4>
                  </div>
                ) : tmpProjStrategy && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '50px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#94a3b8', marginBottom: '20px' }}>SCRAPING ARCHITECTURE</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                        {[
                          { id: 'standard', name: 'Standard Mode', icon: '🏠', desc: 'Zero Config / Browser Sync' },
                          { id: 'api_only', name: 'API Stream', icon: '🚀', desc: 'High-Speed Automated' },
                          { id: 'direct_proxy', name: 'Direct Proxy', icon: '🌐', desc: 'Custom IP Routing' }
                        ].map(s => (
                          <div 
                            key={s.id}
                            onClick={() => setTmpProjStrategy({...tmpProjStrategy, scrapingStrategy: s.id})}
                            style={{ 
                              padding: '20px 15px', 
                              borderRadius: '20px', 
                              border: '2px solid', 
                              borderColor: tmpProjStrategy.scrapingStrategy === s.id ? 'var(--accent)' : '#f1f5f9',
                              background: tmpProjStrategy.scrapingStrategy === s.id ? 'rgba(255, 153, 0, 0.03)' : '#fff',
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: '0.2s',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{s.icon}</div>
                            <div style={{ fontSize: '12px', fontWeight: '900', color: tmpProjStrategy.scrapingStrategy === s.id ? '#1e293b' : '#94a3b8' }}>{s.name}</div>
                            <div style={{ fontSize: '9px', fontWeight: '700', color: '#cbd5e1', marginTop: '4px', textTransform: 'uppercase' }}>{s.desc}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: '30px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#94a3b8', marginBottom: '12px' }}>PREFERRED API PROVIDER</label>
                        <select style={{ width: '100%', padding: '16px 20px', borderRadius: '14px', border: '2px solid #e2e8f0', background: '#fff', outline: 'none' }} value={tmpProjStrategy.preferredApi} onChange={e => setTmpProjStrategy({...tmpProjStrategy, preferredApi: e.target.value})}>
                          <option value="hybrid">Hybrid (Automatic Fallback)</option>
                          <option value="serper">Serper.dev (Ultra-Fast)</option>
                          <option value="scrapingdog">ScrapingDog (Direct HTML)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#94a3b8', marginBottom: '20px' }}>EMULATED ENGINE</label>
                      <select style={{ width: '100%', padding: '16px 20px', borderRadius: '14px', border: '2px solid #e2e8f0', background: '#fff', outline: 'none', marginBottom: '30px' }} value={tmpProjStrategy.device} onChange={e => setTmpProjStrategy({...tmpProjStrategy, device: e.target.value})}>
                        <option value="desktop">Desktop (Chrome/V8)</option>
                        <option value="mobile">Mobile (iPhone/Safari)</option>
                      </select>
                      <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '900', color: '#1D2B44' }}>SYNCING PROTOCOL</h3>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>Changes apply only to the selected project. Ensure your credentials are active before applying.</p>
                      </div>
                      <button onClick={handleSaveProjectSettings} style={{ marginTop: '30px', width: '100%', padding: '18px', background: '#1D2B44', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '900', cursor: 'pointer' }}>APPLY OVERRIDES</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default Settings;
