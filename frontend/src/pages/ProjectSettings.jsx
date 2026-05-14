import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import API_BASE_URL from '../config/apiConfig';
// Inlined for stability to avoid 500 loading errors
const cleanWebsiteUrl = (url) => {
  if (!url) return '';
  return url.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/i, '').split('/')[0].replace(/\/+$/, '');
};

const API_BASE = `${API_BASE_URL}/api`;

const COUNTRY_DB = [
  { code: 'us', name: 'United States', flag: '🇺🇸', tld: 'google.com' },
  { code: 'au', name: 'Australia', flag: '🇦🇺', tld: 'google.com.au' },
  { code: 'gb', name: 'United Kingdom', flag: '🇬🇧', tld: 'google.co.uk' },
  { code: 'in', name: 'India', flag: '🇮🇳', tld: 'google.co.in' },
  { code: 'ca', name: 'Canada', flag: '🇨🇦', tld: 'google.ca' },
  { code: 'nz', name: 'New Zealand', flag: '🇳🇿', tld: 'google.co.nz' },
  { code: 'za', name: 'South Africa', flag: '🇿🇦', tld: 'google.co.za' },
  { code: 'ae', name: 'United Arab Emirates', flag: '🇦🇪', tld: 'google.ae' },
  { code: 'sg', name: 'Singapore', flag: '🇸🇬', tld: 'google.com.sg' },
  { code: 'ie', name: 'Ireland', flag: '🇮🇪', tld: 'google.ie' }
];

// Persistent cache for city autocomplete to reduce API calls
const cityAutocompleteCache = new Map();

const ProjectSettings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState({
    name: '',
    url: '',
    targetRegion: 'au',
    businessName: '',
    schedule: 'instant',
    defaultLocation: '',
    defaultLat: '',
    defaultLng: '',
    pincode: '',
    usePincode: false,
    scrapingStrategy: 'standard'
  });
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  
  // Autocomplete states
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [isCityLoading, setIsCityLoading] = useState(false);
  const [isManualLocationSearch, setIsManualLocationSearch] = useState(false);
  const cityDropdownRef = useRef(null);

  // Region Search States
  const [regionSearch, setRegionSearch] = useState('');
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const regionDropdownRef = useRef(null);

  const isNew = id === 'new';

  useEffect(() => {
    if (isNew) {
      setLoading(false);
    } else {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      const found = data.find(p => String(p.id) === String(id));
      if (found) {
        setProject(found);
      } else {
        navigate('/dashboard');
      }
    } catch (err) { console.error('Fetch project error:', err); }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!project.name || !project.url) {
      alert("Project Name and Website URL are required.");
      return;
    }
    
    setSaveStatus('saving');
    try {
      const url = isNew ? `${API_BASE}/projects` : `${API_BASE}/projects/${id}`;
      const method = isNew ? 'POST' : 'PUT';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(project)
      });
      
      if (res.ok) {
        setSaveStatus('success');
        if (isNew) {
          const added = await res.json();
          console.log('>>> [DEBUG] Project Created:', added);
          // Navigate to dashboard and let it auto-select the new project
          setTimeout(() => navigate('/dashboard'), 1500);
        } else {
          setTimeout(() => setSaveStatus(''), 3000);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('>>> [DEBUG] Save failed:', res.status, errData);
        alert(`Failed to save project: ${errData.error || 'Unknown Server Error'} (Status: ${res.status})`);
        setSaveStatus('error');
      }
    } catch (err) { 
      console.error('Save error:', err);
      alert(`Network Error: Could not connect to the intelligence server. Please check if the backend is running.`);
      setSaveStatus('error');
    }
  };

  // Location Autocomplete Effect with Advanced Caching
  useEffect(() => {
    if (!project?.defaultLocation || project.defaultLocation.length < 2 || !isManualLocationSearch) {
      setCitySuggestions([]);
      return;
    }

    // Check Cache First
    const cacheKey = `${project.defaultLocation.toLowerCase().trim()}_${project.targetRegion}`;
    if (cityAutocompleteCache.has(cacheKey)) {
      setCitySuggestions(cityAutocompleteCache.get(cacheKey));
      setIsCityLoading(false);
      setShowCityDropdown(true);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCityLoading(true);
      try {
        const countryParam = project.targetRegion ? `&countrycode=${project.targetRegion}` : '';
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(project.defaultLocation)}${countryParam}&limit=10&lang=en&osm_tag=place`);
        const data = await res.json();
        
        if (!data.features) throw new Error("Invalid data");

        const suggestions = data.features.map(f => {
          const p = f.properties;
          const parts = [p.name, p.district, p.city, p.state, p.country].filter(Boolean);
          const uniqueParts = [...new Set(parts)];
          return {
            display: uniqueParts.join(', '),
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            pincode: p.postcode || ''
          };
        });

        // Update Cache
        cityAutocompleteCache.set(cacheKey, suggestions);
        
        setCitySuggestions(suggestions);
        setShowCityDropdown(true);
      } catch (err) { console.error("City fetch failed", err); }
      setIsCityLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [project?.defaultLocation, project?.targetRegion, isManualLocationSearch]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
        setShowCityDropdown(false);
      }
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(event.target)) {
        setShowRegionDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectCountry = (c) => {
    setProject({...project, targetRegion: c.code});
    setRegionSearch(c.name);
    setShowRegionDropdown(false);
    // INSTANT FEEDBACK: Clear stale city suggestions when region changes
    setCitySuggestions([]);
  };

  const filteredCountries = COUNTRY_DB.filter(c => 
    c.name.toLowerCase().includes(regionSearch.toLowerCase()) || 
    c.code.toLowerCase().includes(regionSearch.toLowerCase())
  );

  useEffect(() => {
    if (project.targetRegion && !regionSearch) {
      const match = COUNTRY_DB.find(c => c.code === project.targetRegion);
      if (match) setRegionSearch(match.name);
    }
  }, [project.targetRegion]);

  if (loading || !project) return <div style={{ padding: '40px', color: '#64748b' }}>Initializing Project Hardware...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex' }}>
      {/* Sidebar Navigation */}
      <aside style={{ width: '280px', background: '#1D2B44', color: '#fff', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed' }}>
        <div style={{ padding: '30px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div 
            onClick={() => navigate('/dashboard')}
            style={{ color: '#fff', fontSize: '18px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
             <span style={{ color: 'var(--accent)' }}>☚</span> Dashboard
          </div>
        </div>
        
        <div style={{ padding: '40px 30px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
              {isNew ? 'New Intelligence Node' : 'Settings Node'}
            </div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '5px' }}>
              {project.name || 'Untitled Project'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
              {project.url || 'No URL specified'}
            </div>
          </div>
          
          <div style={{ marginTop: '30px' }}>
             <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.6' }}>
               Configure geographic targeting and automation schedules for this specific intelligence node.
             </p>
          </div>
        </div>

        <div style={{ marginTop: 'auto', padding: '30px' }}>
           <div style={{ padding: '15px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)', fontSize: '11px', color: '#10b981', display: 'flex', gap: '10px' }}>
              <span>⦿</span> Project Identification Active
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ marginLeft: '280px', flex: 1, padding: '40px', overflowY: 'auto', height: '100vh', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          
          <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '900', color: '#1D2B44', letterSpacing: '-1px' }}>
                {isNew ? 'Initiate New Project' : 'Project Configuration'}
              </h1>
              <p style={{ margin: '8px 0 0', color: '#64748b', fontWeight: '500' }}>
                {isNew ? 'Deploy a new tracking node to the intelligence network' : 'Geographic and automation orchestration'}
              </p>
            </div>
            
            <button 
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              style={{ 
                background: saveStatus === 'success' ? '#10b981' : (saveStatus === 'error' ? '#ef4444' : 'var(--accent)'), 
                color: '#fff', border: 'none', padding: '14px 40px', borderRadius: '12px', 
                fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 25px rgba(255, 153, 0, 0.2)',
                transition: '0.3s'
              }}
            >
              {saveStatus === 'saving' ? 'SYNCING...' : saveStatus === 'success' ? (isNew ? '✓ CREATED' : '✓ UPDATED') : (saveStatus === 'error' ? '❌ RETRY' : (isNew ? 'CREATE PROJECT' : 'SAVE CONFIGURATION'))}
            </button>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            
            {/* Generic Details */}
            <div style={{ background: '#fff', padding: '35px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
                <div style={{ width: '4px', height: '24px', background: 'var(--accent)', borderRadius: '2px' }}></div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#1e293b', letterSpacing: '1px', textTransform: 'uppercase' }}>Basic Infrastructure</h3>
              </div>
              
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', marginBottom: '8px' }}>
                  <span>🏷️</span> PROJECT NAME
                </label>
                <input 
                  style={{ width: '100%', padding: '16px 20px', borderRadius: '14px', border: '2px solid #e2e8f0', background: '#fff', fontSize: '15px', fontWeight: '700', color: '#1D2B44', outline: 'none', transition: 'all 0.2s' }}
                  placeholder="e.g. My Global Campaign"
                  value={project.name}
                  onChange={e => setProject({...project, name: e.target.value})}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', marginBottom: '8px' }}>
                  <span>🌐</span> WEBSITE URL
                </label>
                <input 
                  style={{ width: '100%', padding: '16px 20px', borderRadius: '14px', border: '2px solid #e2e8f0', background: '#fff', fontSize: '15px', fontWeight: '600', color: '#1D2B44', outline: 'none', transition: 'all 0.2s' }}
                  placeholder="e.g. nike.com"
                  value={project.url}
                  onChange={e => setProject({...project, url: cleanWebsiteUrl(e.target.value)})}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', marginBottom: '8px' }}>
                  <span>🏢</span> BUSINESS NAME (FOR MAPS)
                </label>
                <input 
                  style={{ width: '100%', padding: '16px 20px', borderRadius: '14px', border: '2px solid #e2e8f0', background: '#fff', fontSize: '15px', fontWeight: '600', color: '#1D2B44', outline: 'none', transition: 'all 0.2s' }}
                  placeholder="e.g. Example Store Sydney"
                  value={project.businessName}
                  onChange={e => setProject({...project, businessName: e.target.value})}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>

            {/* Automation Details */}
            <div style={{ background: '#fff', padding: '30px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
                <div style={{ width: '4px', height: '20px', background: '#3b82f6', borderRadius: '2px' }}></div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#1e293b', letterSpacing: '1px', textTransform: 'uppercase' }}>Scan Orchestration</h3>
              </div>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', marginBottom: '8px' }}>
                  <span>📅</span> SCAN SCHEDULE
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select 
                    style={{ flex: 1, padding: '16px', borderRadius: '14px', border: '2px solid #e2e8f0', background: '#fff', fontSize: '14px', fontWeight: '600', color: '#1D2B44', outline: 'none', cursor: 'pointer', transition: '0.2s' }}
                    value={project.schedule} 
                    onChange={e => setProject({...project, schedule: e.target.value})}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  >
                    <option value="instant">Manual Only</option>
                    <option value="daily">Daily Auto-Scan</option>
                    <option value="weekly">Weekly Auto-Scan</option>
                  </select>
                  {project.schedule === 'weekly' && (
                    <select 
                      style={{ flex: 1, padding: '16px', borderRadius: '14px', border: '2px solid #e2e8f0', background: '#fff', fontSize: '14px', fontWeight: '600', color: '#1D2B44', outline: 'none', cursor: 'pointer', transition: '0.2s' }}
                      value={project.scheduleDay || 'Friday'} 
                      onChange={e => setProject({...project, scheduleDay: e.target.value})}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    >
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                 <p style={{ margin: 0, fontSize: '11px', color: '#3b82f6', fontWeight: '700', lineHeight: '1.6' }}>
                   🚀 <b>Smart Scheduling:</b> Your project will automatically synchronize with Google search nodes based on this interval.
                 </p>
              </div>

              {/* Scraping Strategy - RESTORED */}
              <div style={{ marginTop: '30px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', marginBottom: '8px' }}>
                  <span>⚡</span> SCRAPING STRATEGY
                </label>
                <select 
                  style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '2px solid #e2e8f0', background: '#fff', fontSize: '14px', fontWeight: '600', color: '#1D2B44', outline: 'none', cursor: 'pointer', transition: '0.2s' }}
                  value={project.scrapingStrategy || 'standard'} 
                  onChange={e => setProject({...project, scrapingStrategy: e.target.value})}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="standard">Standard Mode (Local/Proxy Scraper)</option>
                  <option value="api_only">API Only Mode (Serper.dev / High Speed)</option>
                  <option value="extension">Extension Sync (Browser Node)</option>
                </select>
                <p style={{ marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
                  Choose how this project should fetch rankings. "Standard" is best for general use.
                </p>
              </div>

              {/* Device Selection - RESTORED */}
              <div style={{ marginTop: '30px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', marginBottom: '8px' }}>
                  <span>📱</span> TRACKING DEVICE
                </label>
                <select 
                  style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '2px solid #e2e8f0', background: '#fff', fontSize: '14px', fontWeight: '600', color: '#1D2B44', outline: 'none', cursor: 'pointer', transition: '0.2s' }}
                  value={project.device || 'desktop'} 
                  onChange={e => setProject({...project, device: e.target.value})}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="desktop">Desktop Node (Default)</option>
                  <option value="mobile">Mobile Node (Smartphone SERP)</option>
                </select>
                <p style={{ marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
                  Simulate search results from a specific device type for higher accuracy.
                </p>
              </div>
            </div>

            {/* Geo Targeting redesign - FREE CHECKER STYLE */}
            <div style={{ gridColumn: 'span 2', background: '#fff', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', marginBottom: '50px' }}>
               <div style={{ background: '#1D2B44', margin: '-40px -40px 30px', padding: '15px 40px', color: '#fff', display: 'flex', alignItems: 'center', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', letterSpacing: '1px' }}>Geographic Satellite Parameters</h3>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                  
                  {/* Step 1: Regional Node */}
                  <div style={{ position: 'relative' }} ref={regionDropdownRef}>
                     <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>
                        1. Choose Search Region (Google Node)
                     </span>
                     <div style={{ position: 'relative' }}>
                        <input 
                           style={{ padding: '16px 20px', borderRadius: '14px', border: '2px solid #e2e8f0', background: '#fff', fontSize: '15px', outline: 'none', width: '100%', boxSizing: 'border-box', color: '#1D2B44', fontWeight: '600', transition: '0.2s' }}
                           placeholder="e.g. Australia (google.com.au)"
                           value={regionSearch}
                           onFocus={(e) => { setShowRegionDropdown(true); e.target.style.borderColor = 'var(--accent)'; }}
                           onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                           onChange={e => { setRegionSearch(e.target.value); setShowRegionDropdown(true); }}
                        />
                        {showRegionDropdown && (
                           <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', marginTop: '8px', boxShadow: '0 15px 30px rgba(0,0,0,0.15)', zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}>
                              {filteredCountries.map(c => (
                                 <div key={c.code} onClick={() => selectCountry(c)} style={{ padding: '12px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600', borderBottom: '1px solid #f8f9fa', color: '#1D2B44' }}>
                                    <span style={{ fontSize: '16px' }}>{c.flag}</span>
                                    <span style={{ flex: 1 }}>{c.name}</span>
                                    <span style={{ opacity: 0.4, fontSize: '10px' }}>({c.code})</span>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Step 2: City Targeting */}
                  <div style={{ position: 'relative' }} ref={cityDropdownRef}>
                     <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>
                        2. Target Geographic City Area
                     </span>
                     <div style={{ position: 'relative' }}>
                        <input 
                           style={{ padding: '14px 15px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#fff', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box', color: '#1D2B44', fontWeight: '600' }}
                           placeholder="Search cities within region..."
                           value={project.defaultLocation || ''}
                           onFocus={(e) => {
                             setIsManualLocationSearch(true);
                             setShowCityDropdown(true);
                             e.target.style.borderColor = 'var(--accent)';
                           }}
                           onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                           onChange={(e) => {
                             setIsManualLocationSearch(true);
                             setIsCityLoading(true);
                             setProject({...project, defaultLocation: e.target.value});
                           }}
                        />
                        {showCityDropdown && citySuggestions.length > 0 && (
                           <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', marginTop: '8px', boxShadow: '0 15px 30px rgba(0,0,0,0.15)', zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}>
                              {citySuggestions.map((s, idx) => (
                                 <div key={idx} onClick={() => {
                                    setProject({
                                       ...project,
                                       defaultLocation: s.display,
                                       defaultLat: s.lat.toString(),
                                       defaultLng: s.lng.toString(),
                                       pincode: s.pincode || project.pincode || '',
                                       usePincode: s.pincode ? true : project.usePincode
                                    });
                                    setShowCityDropdown(false);
                                    setIsManualLocationSearch(false);
                                 }} style={{ padding: '12px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600', borderBottom: '1px solid #f8f9fa', color: '#1D2B44' }}>
                                    <span>📍</span>
                                    <span style={{ flex: 1 }}>{s.display}</span>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Step 3: Pincode */}
                  <div className="geo-field">
                     <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>
                        3. Target Postal / Zip Code
                     </span>
                     <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <input 
                           style={{ padding: '14px 15px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#fff', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box', flex: 1, color: '#1D2B44', fontWeight: '600' }}
                           placeholder="e.g. 2000"
                           value={project.pincode || ''}
                           onChange={e => setProject({...project, pincode: e.target.value})}
                           onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                           onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                        <div 
                          onClick={() => setProject({...project, usePincode: !project.usePincode})}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: '130px' }}
                        >
                          <div style={{ width: '22px', height: '22px', border: '2px solid #cbd5e1', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s', background: project.usePincode ? '#10b981' : 'transparent', borderColor: project.usePincode ? '#10b981' : '#cbd5e1' }}>
                             {project.usePincode && <span style={{ color: '#fff', fontSize: '12px', fontWeight: '900' }}>✓</span>}
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: '900', color: project.usePincode ? '#10b981' : '#1D2B44', textTransform: 'uppercase' }}>Enforce Sync</span>
                        </div>
                     </div>
                  </div>

                  {/* Step 4: Coordinates */}
                  <div className="geo-field">
                     <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>
                        4. High Precision GPS Node
                     </span>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <input style={{ padding: '14px 15px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box', color: '#64748b', fontWeight: '700' }} value={project.defaultLat || ''} readOnly placeholder="Latitude" />
                        <input style={{ padding: '14px 15px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box', color: '#64748b', fontWeight: '700' }} value={project.defaultLng || ''} readOnly placeholder="Longitude" />
                     </div>
                  </div>

               </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

export default ProjectSettings;
