import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = '/api';

const Settings = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  
  // States from the old Modal
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

  // Tabs for the new page layout
  const [activeTab, setActiveTab] = useState('profile');

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
    } catch (err) { console.error('Projects fetch error:', err); }
  };

  const handleSaveAll = async () => {
    setSaveStatus('saving');
    try {
      // 1. Global settings
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

      // 2. Project specific if selected
      if (selectedSettingProjId && tmpProjStrategy) {
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
      }
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) { 
      console.error('Save error:', err);
      setSaveStatus('error');
    }
  };

  const handleTestSerper = async () => {
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
        alert(`✅ CONNECTION SECURE\nRemaining Credits: ${data.credits}`);
        setSerperQuotaActive(true);
      } else {
        alert(`❌ CONNECTION FAILED\nError: ${data.error}`);
      }
    } catch (err) { alert('API Test Error'); }
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
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
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
    } catch (e) {
      return url;
    }
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
          <div 
            onClick={() => setActiveTab('profile')}
            style={{ 
              padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px',
              background: activeTab === 'profile' ? 'rgba(255,255,255,0.05)' : 'transparent',
              color: activeTab === 'profile' ? '#fff' : '#94a3b8',
              fontWeight: activeTab === 'profile' ? '700' : '500',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}
          >
            👤 Profile Info
          </div>
          <div 
            onClick={() => setActiveTab('api')}
            style={{ 
              padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px',
              background: activeTab === 'api' ? 'rgba(255,255,255,0.05)' : 'transparent',
              color: activeTab === 'api' ? '#fff' : '#94a3b8',
              fontWeight: activeTab === 'api' ? '700' : '500',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}
          >
            🔑 API Master Keys
          </div>
          <div 
            onClick={() => setActiveTab('proxies')}
            style={{ 
              padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px',
              background: activeTab === 'proxies' ? 'rgba(255,255,255,0.05)' : 'transparent',
              color: activeTab === 'proxies' ? '#fff' : '#94a3b8',
              fontWeight: activeTab === 'proxies' ? '700' : '500',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}
          >
            🌐 Proxy Clusters
          </div>
          <div 
            onClick={() => setActiveTab('projects')}
            style={{ 
              padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px',
              background: activeTab === 'projects' ? 'rgba(255,255,255,0.05)' : 'transparent',
              color: activeTab === 'projects' ? '#fff' : '#94a3b8',
              fontWeight: activeTab === 'projects' ? '700' : '500',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}
          >
            📂 Project Overrides
          </div>
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
              <h1 style={{ margin: 0, fontSize: windowWidth > 600 ? '32px' : '24px', fontWeight: '900', color: '#1D2B44', letterSpacing: '-1px' }}>Profile Settings</h1>
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

          {/* TAB: PROFILE */}
          {activeTab === 'profile' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
               <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: windowWidth > 800 ? 'row' : 'column', alignItems: 'center', gap: '40px' }}>
                  <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current.click()}>
                    {user?.picture ? (
                      <img 
                        src={user.picture} 
                        alt="Profile" 
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        style={{ width: '150px', height: '150px', borderRadius: '40px', objectFit: 'cover', border: '6px solid #f8fafc', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                      />
                    ) : null}
                    <div style={{ 
                      width: '150px', 
                      height: '150px', 
                      borderRadius: '40px', 
                      background: 'linear-gradient(135deg, var(--accent), #ffb347)', 
                      display: (user?.picture) ? 'none' : 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '60px', 
                      fontWeight: '900', 
                      color: '#fff',
                      border: '6px solid #f8fafc', 
                      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {(() => {
                        if (!user?.name) return '??';
                        const parts = user.name.split(' ').filter(Boolean);
                        if (parts.length >= 2) return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
                        return user.name.substring(0, 2).toUpperCase();
                      })()}
                    </div>
                    <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', background: 'var(--accent)', color: '#fff', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                      📷
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handlePictureUpload} 
                      style={{ display: 'none' }} 
                      accept="image/*" 
                    />
                    {isUploading && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: '800' }}>
                        UPLOADING...
                      </div>
                    )}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <form onSubmit={handleProfileUpdate}>
                      <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 600 ? '1fr 1fr' : '1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>Full Name</label>
                          <input 
                            className="elite-input" 
                            style={{ width: '100%', padding: '12px' }}
                            value={newName} 
                            onChange={e => setNewName(e.target.value)} 
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>Email Address</label>
                          <input 
                            className="elite-input" 
                            style={{ width: '100%', padding: '12px' }}
                            value={newEmail} 
                            onChange={e => setNewEmail(e.target.value)} 
                          />
                        </div>
                      </div>

                      <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                         <h4 style={{ margin: '0 0 15px', fontSize: '12px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🛡️ Security & Authentication</h4>
                         
                         <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 700 ? 'repeat(3, 1fr)' : '1fr', gap: '15px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>CURRENT PASSWORD</label>
                              <input 
                                type="password"
                                className="elite-input" 
                                style={{ width: '100%', padding: '10px', fontSize: '13px' }}
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                placeholder="Required to save"
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>NEW PASSWORD</label>
                              <input 
                                type="password"
                                className="elite-input" 
                                style={{ width: '100%', padding: '10px', fontSize: '13px' }}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="Min 6 chars"
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>CONFIRM NEW</label>
                              <input 
                                type="password"
                                className="elite-input" 
                                style={{ width: '100%', padding: '10px', fontSize: '13px' }}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Repeat new"
                              />
                            </div>
                         </div>
                      </div>

                      <button 
                        type="submit"
                        disabled={isUpdatingProfile}
                        style={{ background: '#1D2B44', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', transition: '0.2s' }}
                      >
                        {isUpdatingProfile ? 'SAVING PROFILE...' : 'UPDATE PROFILE IDENTITY'}
                      </button>
                    </form>
                  </div>
               </div>
            </div>
          )}

          {/* TAB: API MASTER KEYS */}
          {activeTab === 'api' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                
                {/* Serper Card */}
                <div style={{ background: '#fff', padding: '30px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#1e293b', letterSpacing: '1px' }}>SERPER.DEV CORE</h3>
                    <button 
                      onClick={handleTestSerper}
                      disabled={isTestingApi}
                      style={{ background: 'rgba(255, 153, 0, 0.1)', color: 'var(--accent)', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                    >
                      {isTestingApi ? 'TESTING...' : 'TEST PIPELINE'}
                    </button>
                  </div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94a3b8', marginBottom: '10px' }}>MASTER API KEY</label>
                  <input 
                    type="password" 
                    className="elite-input" 
                    style={{ width: '100%', padding: '15px' }}
                    placeholder="Paste Serper Key..." 
                    value={globalApiKey} 
                    onChange={e => setGlobalApiKey(e.target.value)} 
                  />
                  <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)', fontSize: '12px', color: '#059669', lineHeight: '1.5' }}>
                    Used for ultra-fast Google Search & Maps results. 
                    <a href="https://serper.dev" target="_blank" rel="noreferrer" style={{ marginLeft: '8px', color: 'var(--accent)', fontWeight: '800' }}>Get Free Key →</a>
                  </div>
                </div>

                {/* ScrapingDog Card */}
                <div style={{ background: '#fff', padding: '30px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                   <h3 style={{ margin: '0 0 25px', fontSize: '14px', fontWeight: '900', color: '#1e293b', letterSpacing: '1px' }}>SCRAPINGDOG.COM</h3>
                   <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94a3b8', marginBottom: '10px' }}>API ACCESS TOKEN</label>
                   <input 
                    type="password" 
                    className="elite-input" 
                    style={{ width: '100%', padding: '15px' }}
                    placeholder="Enter ScrapingDog Key..." 
                    value={globalScrapingdogApiKey} 
                    onChange={e => setGlobalScrapingdogApiKey(e.target.value)} 
                  />
                  <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)', fontSize: '12px', color: '#2563eb', lineHeight: '1.5' }}>
                    Used as fallback for direct HTML scraping when SERP APIs fail.
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: PROXIES */}
          {activeTab === 'proxies' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
               <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Standard Proxy Pool</h3>
                      <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>Configure IP rotation for non-API scraping strategies.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#f8fafc', padding: '10px 20px', borderRadius: '100px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '11px', fontWeight: '900', color: isRandomProxy ? '#10b981' : '#64748b' }}>RANDOM ROTATION</span>
                      <div 
                        onClick={() => setIsRandomProxy(!isRandomProxy)}
                        style={{ width: '40px', height: '22px', background: isRandomProxy ? '#10b981' : '#cbd5e1', borderRadius: '100px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}
                      >
                        <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', left: isRandomProxy ? '21px' : '3px', transition: '0.3s' }}></div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94a3b8', marginBottom: '10px' }}>BULK INSERT (ONE PER LINE)</label>
                      <textarea 
                        className="elite-textarea"
                        style={{ height: '200px', width: '100%', padding: '20px', borderRadius: '16px' }}
                        placeholder="http://user:pass@host:port"
                        value={proxyBulkText}
                        onChange={(e) => setProxyBulkText(e.target.value)}
                      />
                      <button 
                         className="btn-primary" 
                         style={{ width: '100%', marginTop: '15px', padding: '15px' }}
                         onClick={() => {
                           const list = proxyBulkText.split('\n').map(p => cleanProxyUrl(p.trim())).filter(p => p);
                           if (list.length > 0) {
                             setGlobalProxies([...globalProxies, ...list]);
                             setProxyBulkText('');
                           }
                         }}
                      >Deploy to Cluster</button>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94a3b8', marginBottom: '10px' }}>ACTIVE NODES ({globalProxies.length})</label>
                      <div style={{ height: '270px', overflowY: 'auto', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '10px' }}>
                        {globalProxies.length === 0 ? (
                          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>Pool is empty.</div>
                        ) : (
                          globalProxies.map((p, idx) => (
                            <div 
                              key={idx} 
                              onClick={() => !isRandomProxy && setActiveProxyIdx(activeProxyIdx === idx ? null : idx)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '15px', padding: '10px 15px', borderRadius: '12px', marginBottom: '8px',
                                background: activeProxyIdx === idx ? 'rgba(255,153,0,0.06)' : '#fff',
                                border: `1px solid ${activeProxyIdx === idx ? 'var(--accent)' : '#e2e8f0'}`,
                                cursor: isRandomProxy ? 'not-allowed' : 'pointer',
                                transition: '0.2s',
                                overflow: 'hidden'
                              }}
                            >
                              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: activeProxyIdx === idx ? 'var(--accent)' : '#cbd5e1', flexShrink: 0 }}></div>
                              
                              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                  {parseProxyLabel(p)}
                                </span>
                                {p !== parseProxyLabel(p) && (
                                  <span style={{ 
                                    fontSize: '11px', color: '#94a3b8', opacity: 0.5, 
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    maxWidth: '200px' // HARD LIMIT
                                  }}>
                                    {p}
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleTestProxyNode(p); }}
                                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: '900', cursor: 'pointer', color: '#64748b' }}
                                >TEST</button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setGlobalProxies(globalProxies.filter((_, i) => i !== idx)); }}
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px', fontSize: '18px', lineHeight: 1 }}
                                >×</button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {/* TAB: PROJECT OVERRIDES */}
          {activeTab === 'projects' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
               <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '30px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Project Targeting Strategy</h3>
                      <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>Override global defaults for specific data streams.</p>
                    </div>
                    <select 
                      className="elite-select" 
                      style={{ width: '300px', padding: '12px' }}
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
                      }}
                    >
                      <option value="">Select Project to Edit...</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>

                  {!selectedSettingProjId ? (
                    <div style={{ padding: '60px', textAlign: 'center', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
                      <div style={{ fontSize: '40px', marginBottom: '20px' }}>📂</div>
                      <h4 style={{ margin: 0, color: '#475569', fontWeight: '800' }}>Select a project to configure its unique hardware strategy</h4>
                    </div>
                  ) : tmpProjStrategy && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                       <div>
                         <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94a3b8', marginBottom: '15px' }}>SCRAPING ARCHITECTURE</label>
                         <div style={{ display: 'flex', gap: '15px' }}>
                           <div 
                             onClick={() => setTmpProjStrategy({...tmpProjStrategy, scrapingStrategy: 'api_only'})}
                             style={{ flex: 1, padding: '20px', borderRadius: '16px', border: '2px solid', borderColor: tmpProjStrategy.scrapingStrategy === 'api_only' ? 'var(--accent)' : '#e2e8f0', background: tmpProjStrategy.scrapingStrategy === 'api_only' ? 'rgba(255, 153, 0, 0.05)' : '#fff', cursor: 'pointer', textAlign: 'center' }}
                           >
                             <div style={{ fontSize: '24px', marginBottom: '10px' }}>🚀</div>
                             <div style={{ fontWeight: '800', fontSize: '13px' }}>API Stream</div>
                           </div>
                           {/* 
                           <div 
                             onClick={() => setTmpProjStrategy({...tmpProjStrategy, scrapingStrategy: 'extension'})}
                             style={{ flex: 1, padding: '20px', borderRadius: '16px', border: '2px solid', borderColor: tmpProjStrategy.scrapingStrategy === 'extension' ? 'var(--accent)' : '#e2e8f0', background: tmpProjStrategy.scrapingStrategy === 'extension' ? 'rgba(255, 153, 0, 0.05)' : '#fff', cursor: 'pointer', textAlign: 'center' }}
                           >
                             <div style={{ fontSize: '24px', marginBottom: '10px' }}>🧩</div>
                             <div style={{ fontWeight: '800', fontSize: '13px' }}>Extension Hub</div>
                           </div>
                           */}
                           <div 
                             onClick={() => setTmpProjStrategy({...tmpProjStrategy, scrapingStrategy: 'direct_proxy'})}
                             style={{ flex: 1, padding: '20px', borderRadius: '16px', border: '2px solid', borderColor: tmpProjStrategy.scrapingStrategy === 'direct_proxy' ? 'var(--accent)' : '#e2e8f0', background: tmpProjStrategy.scrapingStrategy === 'direct_proxy' ? 'rgba(255, 153, 0, 0.05)' : '#fff', cursor: 'pointer', textAlign: 'center' }}
                           >
                             <div style={{ fontSize: '24px', marginBottom: '10px' }}>🌐</div>
                             <div style={{ fontWeight: '800', fontSize: '13px' }}>Direct Proxy</div>
                           </div>
                         </div>

                         {/* 
                         {tmpProjStrategy.scrapingStrategy === 'extension' && (
                            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)', animation: 'fadeIn 0.3s ease-out' }}>
                               <p style={{ margin: 0, fontSize: '12px', color: '#059669', fontWeight: '600' }}>
                                 🧩 <b>Extension Hub Active:</b> Zero API costs. This project will use your local browser and IP address for the highest possible accuracy. Make sure your extension is "Connected" on the dashboard.
                               </p>
                            </div>
                          )}
                          */}

                         {tmpProjStrategy.scrapingStrategy === 'api_only' && (
                            <div style={{ marginTop: '20px', animation: 'fadeIn 0.3s ease-out' }}>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94a3b8', marginBottom: '10px' }}>PREFERRED API PROVIDER</label>
                              <select 
                                className="elite-select"
                                style={{ width: '100%' }}
                                value={tmpProjStrategy.preferredApi}
                                onChange={e => setTmpProjStrategy({...tmpProjStrategy, preferredApi: e.target.value})}
                              >
                                <option value="hybrid">Hybrid (Automatic Fallback)</option>
                                <option value="serper">Serper.dev (Ultra-Fast)</option>
                                <option value="scrapingdog">ScrapingDog (Direct HTML)</option>
                                <option value="serpapi">SerpApi (Tier-1 Results)</option>
                              </select>
                              <p style={{ marginTop: '8px', color: '#64748b', fontSize: '11px', fontStyle: 'italic' }}>
                                Choose a specific API to bypass auto-fallback or use Hybrid for maximum reliability.
                              </p>
                            </div>
                          )}
                       </div>
                       <div>
                         <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94a3b8', marginBottom: '15px' }}>EMULATED ENGINE</label>
                         <select 
                            className="elite-select"
                            style={{ width: '100%', marginBottom: '20px' }}
                            value={tmpProjStrategy.device}
                            onChange={e => setTmpProjStrategy({...tmpProjStrategy, device: e.target.value})}
                          >
                            <option value="desktop">Desktop (Chrome/V8)</option>
                            <option value="mobile">Mobile (iPhone/Safari)</option>
                          </select>
                          
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94a3b8', marginBottom: '10px' }}>HARDWARE PROXY OVERRIDE</label>
                          <input 
                            placeholder="http://user:pass@ip:port..."
                            className="elite-input"
                            style={{ width: '100%' }}
                            value={tmpProjStrategy.proxyUrl}
                            onChange={e => setTmpProjStrategy({...tmpProjStrategy, proxyUrl: e.target.value})}
                          />
                       </div>
                    </div>
                  )}
               </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Settings;
