import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';

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
    scrapingStrategy: 'api_only',
    device: 'desktop',
    proxyUrl: '',
    pincode: '',
    usePincode: false
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
          // Navigate to dashboard and let it auto-select the new project
          setTimeout(() => navigate('/dashboard'), 1500);
        } else {
          setTimeout(() => setSaveStatus(''), 3000);
        }
      } else {
        setSaveStatus('error');
      }
    } catch (err) { 
      console.error('Save error:', err);
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
               Configure geographic targeting, automation schedules, and hardware identifiers for this specific intelligence node.
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
      <main style={{ marginLeft: '280px', flex: 1, padding: '40px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          
          <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '900', color: '#1D2B44', letterSpacing: '-1px' }}>
                {isNew ? 'Initiate New Project' : 'Project Configuration'}
              </h1>
              <p style={{ margin: '8px 0 0', color: '#64748b', fontWeight: '500' }}>
                {isNew ? 'Deploy a new tracking node to the intelligence network' : 'Hardware strategy and geographic orchestration'}
              </p>
            </div>
            
            <button 
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              style={{ 
                background: saveStatus === 'success' ? '#10b981' : 'var(--accent)', 
                color: '#fff', border: 'none', padding: '14px 40px', borderRadius: '12px', 
                fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 25px rgba(255, 153, 0, 0.2)',
                transition: '0.3s'
              }}
            >
              {saveStatus === 'saving' ? 'SYNCING...' : saveStatus === 'success' ? (isNew ? '✓ CREATED' : '✓ UPDATED') : (isNew ? 'CREATE PROJECT' : 'SAVE CONFIGURATION')}
            </button>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            
            {/* Generic Details */}
            <div style={{ background: '#fff', padding: '30px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 25px', fontSize: '14px', fontWeight: '900', color: '#1e293b', letterSpacing: '1px', textTransform: 'uppercase' }}>Basic Infrastructure</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94a3b8', marginBottom: '8px' }}>PROJECT NAME</label>
                <input 
                  className="elite-input" style={{ width: '100%' }}
                  value={project.name}
                  onChange={e => setProject({...project, name: e.target.value})}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94a3b8', marginBottom: '8px' }}>WEBSITE URL (FULL)</label>
                <input 
                  className="elite-input" style={{ width: '100%' }}
                  value={project.url}
                  onChange={e => setProject({...project, url: e.target.value})}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94a3b8', marginBottom: '8px' }}>BUSINESS NAME (FOR MAPS)</label>
                <input 
                  className="elite-input" style={{ width: '100%' }}
                  value={project.businessName}
                  onChange={e => setProject({...project, businessName: e.target.value})}
                />
              </div>
            </div>

            {/* Automation Details */}
            <div style={{ background: '#fff', padding: '30px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 25px', fontSize: '14px', fontWeight: '900', color: '#1e293b', letterSpacing: '1px', textTransform: 'uppercase' }}>Scan Orchestration</h3>
              
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94a3b8', marginBottom: '8px' }}>SCAN SCHEDULE</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select 
                    className="elite-select" style={{ flex: 1 }}
                    value={project.schedule} 
                    onChange={e => setProject({...project, schedule: e.target.value})}
                  >
                    <option value="instant">Manual Only</option>
                    <option value="daily">Daily Auto-Scan</option>
                    <option value="weekly">Weekly Auto-Scan</option>
                  </select>
                  {project.schedule === 'weekly' && (
                    <select 
                      className="elite-select" style={{ flex: 1 }}
                      value={project.scheduleDay || 'Friday'} 
                      onChange={e => setProject({...project, scheduleDay: e.target.value})}
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

              <div style={{ marginTop: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94a3b8', marginBottom: '8px' }}>SCRAPING HARDWARE STRATEGY</label>
                <select 
                  className="elite-select" style={{ width: '100%' }}
                  value={project.scrapingStrategy || 'api_only'} 
                  onChange={e => setProject({...project, scrapingStrategy: e.target.value})}
                >
                  <option value="api_only">Cloud API (Serper.dev)</option>
                  {/* <option value="extension">Browser Extension (Local IP)</option> */}
                </select>
              </div>

              <div style={{ marginTop: '30px', padding: '15px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                 <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                   <b>Cloud API:</b> Fast but costs credits. <br/>
                   {/* <b>Extension:</b> Uses your browser. Zero cost, maximum accuracy. */}
                 </p>
              </div>
            </div>

            {/* Geo Targeting redesign - FREE CHECKER STYLE */}
            <div style={{ gridColumn: 'span 2', background: '#fff', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
               <style>{`
                 .elite-input-compact { padding: 12px 15px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px; transition: 0.2s; outline: none; width: 100%; box-sizing: border-box; }
                 .elite-input-compact:focus { border-color: var(--accent); }
                 .tick-box { width: 18px; height: 18px; border: 2px solid #cbd5e1; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: 0.2s; cursor: pointer; }
                 .tick-box.active { background: #10b981; border-color: #10b981; }
                 .tick-label { font-size: 10px; font-weight: 900; color: #1D2B44; text-transform: uppercase; cursor: pointer; user-select: none; }
                 .tick-label.active { color: #10b981; }
                 .autocomplete-list-inline { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 5px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 1000; max-height: 250px; overflow-y: auto; }
                 .autocomplete-item-inline { padding: 10px 15px; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; border-bottom: 1px solid #f8f9fa; }
                 .autocomplete-item-inline:hover { background: #f8f9fa; color: var(--accent); }
               `}</style>

               <div style={{ background: '#1D2B44', margin: '-40px -40px 30px', padding: '15px 40px', color: '#fff', display: 'flex', alignItems: 'center', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', letterSpacing: '1px' }}>Geographic Satellite Parameters</h3>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                  
                  {/* Step 1: Regional Node */}
                  <div className="geo-field" style={{ position: 'relative' }} ref={regionDropdownRef}>
                     <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>
                        1. Choose Search Region (Google Node)
                     </span>
                     <div style={{ position: 'relative' }}>
                        <input 
                           className="elite-input-compact"
                           style={{ background: '#f8f9fa' }}
                           placeholder="e.g. Australia (google.com.au)"
                           value={regionSearch}
                           onFocus={() => setShowRegionDropdown(true)}
                           onChange={e => { setRegionSearch(e.target.value); setShowRegionDropdown(true); }}
                        />
                        {showRegionDropdown && (
                           <div className="autocomplete-list-inline">
                              {filteredCountries.map(c => (
                                 <div key={c.code} className="autocomplete-item-inline" onClick={() => selectCountry(c)}>
                                    <span>{c.flag}</span>
                                    <span style={{ flex: 1 }}>{c.name}</span>
                                    <span style={{ opacity: 0.4, fontSize: '10px' }}>({c.code})</span>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Step 2: City Targeting */}
                  <div className="geo-field" style={{ position: 'relative' }} ref={cityDropdownRef}>
                     <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>
                        2. Target Geographic City Area
                     </span>
                     <div style={{ position: 'relative' }}>
                        <input 
                           className="elite-input-compact"
                           style={{ background: '#f8f9fa' }}
                           placeholder="Search cities within region..."
                           value={project.defaultLocation || ''}
                           onFocus={() => {
                             setIsManualLocationSearch(true);
                             setShowCityDropdown(true);
                           }}
                           onChange={(e) => {
                             setIsManualLocationSearch(true);
                             setIsCityLoading(true); // Instant visual feedback
                             setProject({...project, defaultLocation: e.target.value});
                           }}
                        />
                        {showCityDropdown && citySuggestions.length > 0 && (
                           <div className="autocomplete-list-inline">
                              {citySuggestions.map((s, idx) => (
                                 <div key={idx} className="autocomplete-item-inline" onClick={() => {
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
                                 }}>
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
                           className="elite-input-compact"
                           style={{ background: '#f8f9fa', flex: 1 }}
                           placeholder="e.g. 2000"
                           value={project.pincode || ''}
                           onChange={e => setProject({...project, pincode: e.target.value})}
                        />
                        <div 
                          onClick={() => setProject({...project, usePincode: !project.usePincode})}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: '130px' }}
                        >
                          <div className={`tick-box ${project.usePincode ? 'active' : ''}`}>
                             {project.usePincode && <span style={{ color: '#fff', fontSize: '11px' }}>✓</span>}
                          </div>
                          <span className={`tick-label ${project.usePincode ? 'active' : ''}`}>Enforce Sync</span>
                        </div>
                     </div>
                  </div>

                  {/* Step 4: Coordinates */}
                  <div className="geo-field">
                     <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>
                        4. High Precision GPS Node
                     </span>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <input className="elite-input-compact" style={{ background: '#f8f9fa' }} value={project.defaultLat || ''} readOnly placeholder="Latitude" />
                        <input className="elite-input-compact" style={{ background: '#f8f9fa' }} value={project.defaultLng || ''} readOnly placeholder="Longitude" />
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
