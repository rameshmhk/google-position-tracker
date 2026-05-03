import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import '../index.css';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import API_BASE_URL from '../config/apiConfig';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, Legend, AreaChart, Area
} from 'recharts';

// Persistent cache for city autocomplete in dashboard
const cityAutocompleteCache = new Map();

const Dashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [extensionOnline, setExtensionOnline] = useState(false);

  /* HIDING EXTENSION STATUS CHECK
  useEffect(() => {
    if (!user?.id) return;
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/extension/status?userId=${user.id}`);
        const data = await res.json();
        setExtensionOnline(data.isOnline);
      } catch (err) { console.error("Extension status check failed", err); }
    };
    checkStatus();
    const timer = setInterval(checkStatus, 15000); // Check every 15s
    return () => clearInterval(timer);
  }, [user?.id]);
  */
  const [projects, setProjects] = useState([]);

  const [selectedId, setSelectedId] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const [selectedKeyIds, setSelectedKeyIds] = useState([]);
  const [checkingIds, setCheckingIds] = useState([]);
  const [isChecking, setIsChecking] = useState(false);

  // Project Location Autocomplete States
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [isCityLoading, setIsCityLoading] = useState(false);
  const cityDropdownRef = useRef(null);
  
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showEditKeyModal, setShowEditKeyModal] = useState(false);
  const [serperQuotaActive, setSerperQuotaActive] = useState(true);
  const [sdogQuotaActive, setSdogQuotaActive] = useState(true);
  const [serpapiQuotaActive, setSerpapiQuotaActive] = useState(true);
  const [proxyActive, setProxyActive] = useState(true);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, status: '', estimate: 0 });
  const [editingKey, setEditingKey] = useState(null);
  const [newKeys, setNewKeys] = useState('');
  const [historyViewDate, setHistoryViewDate] = useState(null);
  const [isManualLocationSearch, setIsManualLocationSearch] = useState(false);
  const [expandedKeyIds, setExpandedKeyIds] = useState([]);
  const [visibleCounts, setVisibleCounts] = useState({}); // { keyId: { p: 5, m: 5, map: 5 } }


  const getRankChange = (history, type) => {
    if (!history || history.length < 2) return { diff: 0, trend: 'stable' };
    
    // History is usually sorted by date in backend, but let's be sure
    const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const latest = sorted[0][type] || 0;
    const previous = sorted[1][type] || 0;

    if (latest === 0 && previous === 0) return { diff: 0, trend: 'stable' };
    
    // If it wasn't ranked before but is now
    if (previous === 0 && latest > 0) return { diff: latest, trend: 'up', isNew: true };
    // If it was ranked but lost it
    if (latest === 0 && previous > 0) return { diff: previous, trend: 'down', isLost: true };

    const diff = previous - latest; // Lower number is better rank (e.g., 10 -> 7 is +3)
    if (diff > 0) return { diff, trend: 'up' };
    if (diff < 0) return { diff: Math.abs(diff), trend: 'down' };
    return { diff: 0, trend: 'stable' };
  };

  // AHREFS DESIGN TOKEN: Status labels
  const STATUS_LABELS = {
    active: { label: 'SYNCHRONIZED', color: 'var(--accent)' },
    paused: { label: 'PENDING', color: '#94a3b8' }
  };

  const API_BASE = `${API_BASE_URL}/api`;

  const activeProject = useMemo(() => projects.find(p => p.id === selectedId), [projects, selectedId]);

  useEffect(() => {
    fetchProjects();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (selectedId) fetchKeywords(selectedId);
    setSelectedKeyIds([]);
  }, [selectedId]);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setProjects(data);
      if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
    } catch (err) { console.error('Projects fetch error:', err); }
  };

  const fetchKeywords = async (id, silent = false) => {
    try {
      const res = await fetch(`${API_BASE}/projects/${id}/keywords`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setKeywords(data);
    } catch (err) { console.error('Keywords fetch error:', err); }
  };



  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setSerperQuotaActive(data.serperQuotaActive !== false);
      setSdogQuotaActive(data.scrapingdogQuotaActive !== false);
      setSerpapiQuotaActive(data.serpapiQuotaActive !== false);
      setProxyActive(data.proxyActive !== false);
    } catch (err) { console.error('Settings fetch error:', err); }
  };

  const handleQuotaErrors = (quotaErrors) => {
    if (!quotaErrors || quotaErrors.length === 0) return;
    if (quotaErrors.includes('QUOTA_EXCEEDED')) setSerperQuotaActive(false);
    if (quotaErrors.includes('SDOG_QUOTA_EXCEEDED')) setSdogQuotaActive(false);
    if (quotaErrors.includes('SERPAPI_QUOTA_EXCEEDED')) setSerpapiQuotaActive(false);
    if (quotaErrors.includes('PROXY_FAILURE')) setProxyActive(false);
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm("⚠️ Are you sure you want to PERMANENTLY delete this project and all its keywords?")) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setProjects(projects.filter(p => String(p.id) !== String(id)));
        if (String(selectedId) === String(id)) {
          setSelectedId(null);
          setKeywords([]);
        }
      }
    } catch (err) { console.error('Delete project error:', err); }
  };

  const handleToggleProjectStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const updated = await res.json();
      setProjects(projects.map(p => p.id === id ? updated : p));
    } catch (err) { console.error('Toggle project status error:', err); }
  };

  const handleAddKeywords = async () => {
    if (!selectedId) {
      alert("❌ Please select a project from the sidebar first!");
      return;
    }
    if (!newKeys.trim()) return;
    const keyArray = newKeys.split('\n').filter(k => k.trim());
    
    try {
      const res = await fetch(`${API_BASE}/projects/${selectedId}/keywords`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ keywords: keyArray })
      });
      
      if (!res.ok) throw new Error("Add keywords failed");

      fetchKeywords(selectedId);
      setShowKeyModal(false);
      setNewKeys('');
    } catch (err) { 
      console.error('Add keywords error:', err);
      alert(`❌ Error: ${err.message}`);
    }
  };

  const handleTogglePause = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/keywords/${id}/toggle-pause`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setKeywords(prev => prev.map(k => String(k.id) === String(id) ? { ...k, status: data.status } : k));
    } catch (err) { console.error('Toggle pause error:', err); }
  };

  const handleToggleMaps = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/keywords/${id}/toggle-maps`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setKeywords(prev => prev.map(k => String(k.id) === String(id) ? { ...k, mapsStatus: data.mapsStatus } : k));
    } catch (err) { console.error('Toggle maps error:', err); }
  };

  const handleToggleOrganic = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/keywords/${id}/toggle-organic`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setKeywords(prev => prev.map(k => String(k.id) === String(id) ? { ...k, organicStatus: data.organicStatus } : k));
    } catch (err) { console.error('Toggle organic error:', err); }
  };

  const handleBulkAction = async (action) => {
    if (selectedKeyIds.length === 0) return;
    try {
      if (action === 'delete') {
        if (!window.confirm(`Delete ${selectedKeyIds.length} keywords?`)) return;
        for (const id of selectedKeyIds) {
          await fetch(`${API_BASE}/keywords/${id}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
        }
        setKeywords(prev => prev.filter(k => !selectedKeyIds.includes(k.id)));
        setSelectedKeyIds([]);
      } else {
        const newStatus = action === 'pause' ? 'paused' : 'active';
        await fetch(`${API_BASE}/keywords/bulk-status`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ ids: selectedKeyIds, status: newStatus })
        });
        setKeywords(prev => prev.map(k => selectedKeyIds.includes(k.id) ? { ...k, status: newStatus } : k));
      }
    } catch (err) { console.error('Bulk action error:', err); }
  };

  const handleBulkToggle = async (type, status) => {
    if (selectedKeyIds.length === 0) return;
    try {
      const endpoint = type === 'maps' ? '/keywords/bulk-maps-status' : '/keywords/bulk-organic-status';
      await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ids: selectedKeyIds, status })
      });
      setKeywords(prev => prev.map(k => {
        if (selectedKeyIds.includes(k.id)) {
          return type === 'maps' ? { ...k, mapsStatus: status } : { ...k, organicStatus: status };
        }
        return k;
      }));
    } catch (err) { console.error(`Bulk ${type} toggle error:`, err); }
  };

  const handleDeleteKeyword = async (id) => {
    if (!window.confirm('Delete this keyword?')) return;
    try {
      await fetch(`${API_BASE}/keywords/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setKeywords(prev => prev.filter(k => k.id !== id));
      setSelectedKeyIds(prev => prev.filter(kid => kid !== id));
    } catch (err) { console.error('Delete keyword error:', err); }
  };

  const handleUpdateKeyword = async () => {
    if (!editingKey) return;
    try {
      const res = await fetch(`${API_BASE}/keywords/${editingKey.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          text: editingKey.text, 
          location: editingKey.location,
          lat: editingKey.lat,
          lng: editingKey.lng,
          pincode: editingKey.pincode,
          usePincode: editingKey.activePriority === 'pincode',
          activePriority: editingKey.activePriority || 'city'
        })
      });
      const updated = await res.json();
      setKeywords(prev => prev.map(k => String(k.id) === String(updated.id) ? updated : k));
      setShowEditKeyModal(false);
      setEditingKey(null);
    } catch (err) { console.error('Update keyword error:', err); }
  };

  const handleCheck = async () => {
    if (!selectedId) return;
    const activeKeywords = keywords.filter(k => k.status === 'active');
    if (activeKeywords.length === 0) {
      alert("❌ No active keywords to check!");
      return;
    }

    setIsChecking(true);
    setCheckingIds(prev => [...new Set([...prev, ...activeKeywords.map(k => k.id)])]);

    try {
      const res = await fetch(`${API_BASE}/check-project/${selectedId}`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        // Essential: Re-fetch keywords to show "QUEUED (EXTENSION)" status in the table
        fetchKeywords(selectedId);
        if (data.quotaErrors) handleQuotaErrors(data.quotaErrors);
      }
    } catch (err) { console.error('Check project error:', err); }
    finally { setIsChecking(false); setCheckingIds([]); }
  };

  const handleCheckSelected = async () => {
    if (selectedKeyIds.length === 0 || !selectedId) return;
    setIsChecking(true);
    setCheckingIds(prev => [...new Set([...prev, ...selectedKeyIds])]);
    
    try {
      const res = await fetch(`${API_BASE}/keywords/check-selection`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ projectId: selectedId, keywordIds: selectedKeyIds })
      });
      const data = await res.json();
      if (data.success) {
        fetchKeywords(selectedId);
        setSelectedKeyIds([]);
        if (data.quotaErrors) handleQuotaErrors(data.quotaErrors);
      }
    } catch (err) { console.error('Selective check error:', err); }
    finally { setIsChecking(false); setCheckingIds([]); }
  };

  const handleCheckIndividual = async (id) => {
    setIsChecking(true);
    setCheckingIds(prev => [...new Set([...prev, id])]);
    try {
      const res = await fetch(`${API_BASE}/check-keyword/${id}`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        // Refresh keywords to show "QUEUED" status for extension tasks
        fetchKeywords(selectedId);
        if (data.quotaErrors) handleQuotaErrors(data.quotaErrors);
      }
    } catch (err) { console.error('Individual check error:', err); }
    finally { setIsChecking(false); setCheckingIds(prev => prev.filter(cid => cid !== id)); }
  };

  const handleVerify = (k, page = 0, device = 'desktop') => {
    const project = activeProject;
    if (!project) return;
    
    const REGION_TO_TLD = { 'au': 'google.com.au', 'us': 'google.com', 'gb': 'google.co.uk', 'uk': 'google.co.uk', 'in': 'google.co.in' };
    const tld = REGION_TO_TLD[project.targetRegion] || 'google.com';
    const query = encodeURIComponent(k.text);
    
    let uuleParam = '';
    const priority = k.activePriority || 'city';
    const kwPincode = k.pincode || project.pincode || '';
    const baseLoc = k.location || project.defaultLocation || '';

    let finalLocation = '';
    if (priority === 'pincode' && kwPincode) {
      finalLocation = kwPincode;
    } else if (priority === 'city' && baseLoc) {
      const kwUsePincode = k.usePincode !== undefined ? k.usePincode : project.usePincode;
      if (kwUsePincode && kwPincode && !baseLoc.includes(kwPincode)) {
        finalLocation = `${baseLoc}, ${kwPincode}`;
      } else {
        finalLocation = baseLoc;
      }
    } else {
      finalLocation = baseLoc || kwPincode || '';
    }

    if (finalLocation) {
      const REGION_TO_COUNTRY = { 'au': 'Australia', 'us': 'United States', 'gb': 'United Kingdom', 'uk': 'United Kingdom', 'in': 'India' };
      const country = REGION_TO_COUNTRY[project.targetRegion] || 'Australia';
      const canonical = finalLocation.toLowerCase().includes(country.toLowerCase()) ? finalLocation : `${finalLocation}, ${country}`;
      
      const UULE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
      const key = UULE_CHARS[canonical.length] || 'A';
      // Use UTF-8 compatible base64 encoding (matches Node.js Buffer behavior)
      const uuleEncoded = btoa(unescape(encodeURIComponent(canonical))).replace(/=/g, '');
      uuleParam = `&uule=w+CAIQICI${key}${uuleEncoded}`;
    }

    const start = page * 10;
    const deviceParam = device === 'mobile' ? '&adtest=on' : '';
    const typeParam = device === 'maps' ? '&tbm=lcl' : '';
    const url = `https://www.${tld}/search?q=${query}${uuleParam}&gl=${project.targetRegion || 'au'}&start=${start}${deviceParam}${typeParam}&pws=0&hl=en`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Location Autocomplete Logic with Caching
  useEffect(() => {
    const targetCity = showEditKeyModal ? editingKey?.location : '';
    const targetRegion = activeProject?.targetRegion || '';

    if (!targetCity || targetCity.length < 2 || !showEditKeyModal) {
      setCitySuggestions([]);
      return;
    }

    const cacheKey = `${targetCity.toLowerCase().trim()}_${targetRegion}`;
    if (cityAutocompleteCache.has(cacheKey)) {
      setCitySuggestions(cityAutocompleteCache.get(cacheKey));
      setIsCityLoading(false);
      if (isManualLocationSearch) setShowCityDropdown(true);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCityLoading(true);
      try {
        const countryParam = targetRegion ? `&countrycode=${targetRegion}` : '';
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(targetCity)}${countryParam}&limit=10&lang=en&osm_tag=place`);
        const data = await res.json();
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
        cityAutocompleteCache.set(cacheKey, suggestions);
        setCitySuggestions(suggestions);
        if (isManualLocationSearch) setShowCityDropdown(true);
      } catch (err) { console.error("City fetch failed", err); }
      finally { setIsCityLoading(false); }
    }, 400);

    return () => clearTimeout(timer);
  }, [editingKey?.location, showEditKeyModal, activeProject?.targetRegion, isManualLocationSearch]);

  return (
    <div className="app-container" style={{ background: '#f8f9fa', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Helmet>
        <title>Dashboard | Ranking Anywhere</title>
      </Helmet>

      {!serperQuotaActive && (
        <div style={{ background: 'linear-gradient(90deg, #ef4444, #b91c1c)', color: '#fff', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', fontWeight: '800', fontSize: '13px', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)', zIndex: 1000 }}>
          <span style={{fontSize: '20px'}}>⚠️</span>
          <span>CRITICAL: YOUR SERPER API QUOTA HAS BEEN DEPLETED. SCANS WILL FAIL UNTIL CREDITS ARE ADDED.</span>
          <button onClick={() => navigate('/settings')} style={{ background: '#fff', color: '#ef4444', border: 'none', padding: '6px 16px', borderRadius: '4px', fontWeight: '900', fontSize: '11px', cursor: 'pointer', marginLeft: '20px' }}>PROFILE SETTINGS</button>
        </div>
      )}

      {!sdogQuotaActive && (
        <div style={{ background: 'linear-gradient(90deg, #f97316, #ea580c)', color: '#fff', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', fontWeight: '800', fontSize: '13px', boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)', zIndex: 999 }}>
          <span style={{fontSize: '20px'}}>🚨</span>
          <span>SCRAPINGDOG QUOTA DEPLETED: HTML FALLBACK SCANNING IS NOW DISABLED.</span>
          <button onClick={() => navigate('/settings')} style={{ background: '#fff', color: '#f97316', border: 'none', padding: '6px 16px', borderRadius: '4px', fontWeight: '900', fontSize: '11px', cursor: 'pointer', marginLeft: '20px' }}>UPDATE KEY</button>
        </div>
      )}

      {!serpapiQuotaActive && (
        <div style={{ background: 'linear-gradient(90deg, #8b5cf6, #6d28d9)', color: '#fff', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', fontWeight: '800', fontSize: '13px', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)', zIndex: 998 }}>
          <span style={{fontSize: '20px'}}>🛡️</span>
          <span>SERPAPI QUOTA DEPLETED: SECONDARY BACKUP SCANNING IS DISABLED.</span>
          <button onClick={() => navigate('/settings')} style={{ background: '#fff', color: '#8b5cf6', border: 'none', padding: '6px 16px', borderRadius: '4px', fontWeight: '900', fontSize: '11px', cursor: 'pointer', marginLeft: '20px' }}>UPDATE KEY</button>
        </div>
      )}

      {false && !proxyActive && (
        <div style={{ background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)', color: '#fff', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', fontWeight: '800', fontSize: '13px', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)', zIndex: 997 }}>
          <span style={{fontSize: '20px'}}>🌐</span>
          <span>PROXY CLUSTER FAILURE: REAL BROWSER FALLBACK IS CURRENTLY UNAVAILABLE.</span>
          <button onClick={() => navigate('/settings')} style={{ background: '#fff', color: '#3b82f6', border: 'none', padding: '6px 16px', borderRadius: '4px', fontWeight: '900', fontSize: '11px', cursor: 'pointer', marginLeft: '20px' }}>CHECK PROXIES</button>
        </div>
      )}

      {/* HIDING EXTENSION ASSISTANT BANNER
      <div style={{ background: 'rgba(29, 43, 68, 0.95)', borderBottom: '1px solid rgba(255,153,0,0.2)', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ background: 'var(--accent)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '900' }}>NEW</span>
          <span style={{ color: '#fff', fontSize: '12px', fontWeight: '600' }}>Want to save API credits? Download the Browser Extension to track rankings for free.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
             <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: extensionOnline ? '#10b981' : '#ef4444', boxShadow: extensionOnline ? '0 0 10px #10b981' : 'none' }}></span>
             <span style={{ color: extensionOnline ? '#10b981' : '#ef4444', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>
               {extensionOnline ? 'Extension Connected' : 'Extension Offline'}
             </span>
          </div>
          <span style={{ color: '#94a3b8', fontSize: '11px' }}>Your User ID: <code style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{user?.id}</code></span>
          <a href="/extension.zip" download style={{ background: 'var(--accent)', color: '#fff', textDecoration: 'none', padding: '5px 15px', borderRadius: '4px', fontSize: '11px', fontWeight: '900' }}>DOWNLOAD ADD-ON</a>
        </div>
      </div>
      */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside className={`sidebar ${isMobileMenuOpen ? 'active' : ''}`} style={{ background: '#1D2B44', borderRight: '1px solid rgba(255,255,255,0.05)', color: '#fff', width: '280px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div className="logo" style={{ color: '#fff', fontSize: '20px', fontWeight: '900', letterSpacing: '-0.8px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--accent)', fontSize: '22px' }}>▲</span> Ranking Anywhere <span style={{ fontWeight: '400', opacity: 0.5, fontSize: '12px' }}>PRO</span>
          </div>
          <div className="sidebar-header" style={{ color: '#94a3b8', fontSize: '10px', fontWeight: '900', letterSpacing: '1.5px', marginBottom: '15px' }}>
            PROJECT INTELLIGENCE
            <button className="add-btn" onClick={() => navigate('/project-settings/new')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer', marginLeft: '10px' }}>+</button>
          </div>
          <div className="project-list" style={{ flex: 1, overflowY: 'auto' }}>
            {projects.map(p => (
              <div key={p.id} className={`project-item ${selectedId === p.id ? 'active' : ''}`} onClick={() => setSelectedId(p.id)} style={{ padding: '12px 16px', borderRadius: '4px', marginBottom: '4px', cursor: 'pointer', background: selectedId === p.id ? 'rgba(255,255,255,0.05)' : 'transparent', borderLeft: selectedId === p.id ? '3px solid var(--accent)' : '3px solid transparent', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: selectedId === p.id ? '#fff' : '#cbd5e1', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{p.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>{p.url.replace('https://', '')}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/project-settings/${p.id}`); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '4px', opacity: 0.6 }} title="Settings">⚙️</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '4px', opacity: 0.6 }} title="Delete Project">🗑️</button>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.status === 'active' ? 'var(--accent)' : '#475569' }}></div>
                </div>
              </div>
            ))}
          </div>
          <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', marginTop: 'auto' }}>
            <button onClick={() => navigate('/settings')} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>👤 Profile Settings</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #ffb347)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#fff', fontSize: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', border: '2px solid rgba(255,255,255,0.1)' }}>
                {(() => {
                  if (!user?.name) return '??';
                  const parts = user.name.split(' ').filter(Boolean);
                  if (parts.length >= 2) return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
                  return user.name.substring(0, 2).toUpperCase();
                })()}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.name || 'Authenticated User'}</div>
                <button onClick={logout} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer', padding: 0 }}>Logout Node</button>
              </div>
            </div>
          </div>
        </aside>
        <main className="main-content" style={{ flex: 1, background: '#f8f9fa', overflowY: 'auto', padding: '30px' }}>
          <header className="dashboard-header" style={{ marginBottom: '30px', background: '#fff', padding: '24px', borderRadius: '4px', border: '1px solid #e1e1e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900', color: '#1D2B44' }}>{activeProject?.name || 'Select Project'}</h1>
                
                {activeProject?.scrapingStrategy === 'api_only' && (
                  <div 
                    onClick={() => navigate('/settings')}
                    style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', padding: '4px 10px', borderRadius: '100px', fontSize: '9px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '5px', border: '1px solid rgba(16, 185, 129, 0.2)', cursor: 'pointer' }}
                    title="API Stream Mode - Click to Manage"
                  >
                    🚀 API STREAM
                  </div>
                )}
                {activeProject?.scrapingStrategy === 'direct_proxy' && (
                  <div 
                    onClick={() => navigate('/settings')}
                    style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', padding: '4px 10px', borderRadius: '100px', fontSize: '9px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '5px', border: '1px solid rgba(59, 130, 246, 0.2)', cursor: 'pointer' }}
                    title="Direct Proxy Mode - Click to Manage"
                  >
                    🌐 DIRECT PROXY
                  </div>
                )}

                {activeProject && <button onClick={() => handleToggleProjectStatus(activeProject.id, activeProject.status)} style={{ fontSize: '10px', padding: '4px 10px' }} className={`pro-badge-status clickable ${activeProject.status}`}>{activeProject.status === 'active' ? '● LIVE' : '○ PAUSED'}</button>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={() => navigate(`/project-insights/${selectedId}`)}
                className="pro-badge-status active clickable"
                style={{ background: 'rgba(255, 153, 0, 0.1)', border: '1px solid rgba(255, 153, 0, 0.3)', color: '#f97316', padding: '5px 10px', fontSize: '9px', fontWeight: '900', letterSpacing: '0.5px' }}
              >
                📊 INSIGHTS NODE
              </button>
              <button onClick={() => setShowKeyModal(true)} style={{ padding: '6px 12px', borderRadius: '4px', fontWeight: '800', fontSize: '10px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#64748b' }}>+ KEYWORDS</button>
              <button className="pro-button" style={{ padding: '8px 16px', fontSize: '10px', minWidth: '130px' }} onClick={handleCheck} disabled={isChecking || !selectedId || activeProject?.status === 'paused'}>{isChecking ? '⏳ SCANNING...' : '🚀 CHECK RANKINGS'}</button>
            </div>
          </header>
          {selectedKeyIds.length > 0 && (
            <div style={{ position: 'sticky', top: '20px', zIndex: 100, marginBottom: '30px', background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '12px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ color: '#fff', fontWeight: '800' }}>{selectedKeyIds.length} SELECTED</div>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button className="pro-button" onClick={handleCheckSelected}>BATCH SCAN</button>
                  <button onClick={() => handleBulkAction('delete')} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>DELETE</button>
                  <button onClick={() => setSelectedKeyIds([])} style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>✖</button>
                </div>
              </div>
            </div>
          )}
          {selectedId && keywords.length > 0 && (
            <div className="elite-card">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 24px' }}><input type="checkbox" checked={selectedKeyIds.length === keywords.length} onChange={(e) => setSelectedKeyIds(e.target.checked ? keywords.map(k => k.id) : [])} /></th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '900' }}>KEYWORD</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '900' }}>LOCATION</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '900' }}>ORGANIC</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '900' }}>MAPS</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', fontWeight: '900' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map(k => (
                    <React.Fragment key={k.id}>
                      <tr style={{ borderBottom: '1px solid #f1f5f9', background: expandedKeyIds.includes(k.id) ? '#f8fafc' : 'transparent' }}>
                        <td style={{ padding: '12px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <input type="checkbox" checked={selectedKeyIds.includes(k.id)} onChange={() => setSelectedKeyIds(prev => prev.includes(k.id) ? prev.filter(id => id !== k.id) : [...prev, k.id])} />
                            <button 
                              onClick={() => setExpandedKeyIds(prev => prev.includes(k.id) ? prev.filter(id => id !== k.id) : [...prev, k.id])}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', color: '#64748b', transition: '0.2s', transform: expandedKeyIds.includes(k.id) ? 'rotate(90deg)' : 'rotate(0deg)' }}
                            >
                              ▶
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: '600', color: '#1e293b' }}>{k.text}</td>
                        <td style={{ padding: '12px 16px', fontSize: '11px', color: '#64748b' }}>{k.location || 'Default'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                               <div style={{ 
                                 padding: '4px 10px', 
                                 borderRadius: '6px', 
                                 background: (() => {
                                    const rank = k.rank || k.organic || 0;
                                    if (rank > 0 && rank <= 3) return 'rgba(16, 185, 129, 0.1)';
                                    if (rank > 0 && rank <= 10) return 'rgba(52, 211, 153, 0.05)';
                                    return '#f8fafc';
                                 })(),
                                 display: 'flex',
                                 alignItems: 'center',
                                 gap: '6px'
                               }}>
                                  <span style={{ 
                                     fontSize: (k.rank || k.organic || k.displayRank === 'Queued (Extension)') ? '16px' : '16px', 
                                     fontWeight: '900', 
                                     color: k.displayRank === 'Queued (Extension)' ? '#3b82f6' : ((k.rank || k.organic) && (k.rank || k.organic) <= 10 ? '#10b981' : (k.rank || k.organic) ? '#f97316' : '#94a3b8') 
                                   }}>
                                     {/* HIDING EXTENSION QUEUED TEXT */}
                                     {((k.rank || k.organic) ? `#${k.rank || k.organic}` : 'DNS')}
                                   </span>
                                  {(() => {
                                    const { diff, trend } = getRankChange(k.history, 'organic');
                                    if (trend === 'up') return <span style={{ color: '#10b981', fontSize: '10px', fontWeight: '900', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 4px', borderRadius: '4px' }}>▲{diff}</span>;
                                    if (trend === 'down') return <span style={{ color: '#ef4444', fontSize: '10px', fontWeight: '900', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 4px', borderRadius: '4px' }}>▼{diff}</span>;
                                    return null;
                                  })()}
                               </div>
                               <button className={checkingIds.includes(k.id) && k.organicStatus === 'active' ? 'checking-spin' : ''} onClick={() => handleCheckIndividual(k.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', opacity: checkingIds.includes(k.id) && k.organicStatus === 'active' ? 1 : 0.5 }}>🔄</button>
                            </div>
                            <button onClick={() => handleToggleOrganic(k.id)} className={`elite-mini-toggle-pill ${k.organicStatus === 'active' ? 'active' : ''}`}>
                              {k.organicStatus === 'active' ? 'ACTIVE' : 'PAUSED'}
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                               <div style={{ 
                                 padding: '4px 10px', 
                                 borderRadius: '6px', 
                                 background: (() => {
                                    const rank = k.mapsRank || k.maps || 0;
                                    if (rank > 0 && rank <= 3) return 'rgba(16, 185, 129, 0.1)';
                                    if (rank > 0 && rank <= 10) return 'rgba(52, 211, 153, 0.05)';
                                    return '#f8fafc';
                                 })(),
                                 display: 'flex',
                                 alignItems: 'center',
                                 gap: '6px'
                               }}>
                                  <span style={{ fontSize: '16px', fontWeight: '900', color: (k.mapsRank || k.maps) && (k.mapsRank || k.maps) <= 10 ? '#10b981' : (k.mapsRank || k.maps) ? '#f97316' : '#94a3b8' }}>
                                    {(k.mapsRank || k.maps) ? `#${k.mapsRank || k.maps}` : 'DNS'}
                                  </span>
                                  {(() => {
                                    const { diff, trend } = getRankChange(k.history, 'maps');
                                    if (trend === 'up') return <span style={{ color: '#10b981', fontSize: '10px', fontWeight: '900', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 4px', borderRadius: '4px' }}>▲{diff}</span>;
                                    if (trend === 'down') return <span style={{ color: '#ef4444', fontSize: '10px', fontWeight: '900', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 4px', borderRadius: '4px' }}>▼{diff}</span>;
                                    return null;
                                  })()}
                               </div>
                               <button className={checkingIds.includes(k.id) && k.mapsStatus === 'active' ? 'checking-spin' : ''} onClick={() => handleCheckIndividual(k.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', opacity: checkingIds.includes(k.id) && k.mapsStatus === 'active' ? 1 : 0.5 }}>🔄</button>
                            </div>
                            <button onClick={() => handleToggleMaps(k.id)} className={`elite-mini-toggle-pill ${k.mapsStatus === 'active' ? 'active' : ''}`}>
                              {k.mapsStatus === 'active' ? 'ACTIVE' : 'PAUSED'}
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button onClick={() => handleCheckIndividual(k.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} title="Run Check">⚡</button>
                          <button onClick={() => { setEditingKey(k); setShowEditKeyModal(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} title="Edit Settings">✏️</button>
                          <button onClick={() => handleDeleteKeyword(k.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} title="Delete">🗑️</button>
                        </td>
                      </tr>
                      {expandedKeyIds.includes(k.id) && (
                        <tr style={{ background: '#f8fafc' }}>
                          <td colSpan="6" style={{ padding: '0 24px 20px 60px' }}>
                            <div style={{ background: '#fff', borderRadius: '12px', padding: '15px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                               <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                                  {/* Desktop Section */}
                                  <div>
                                     <div style={{ fontSize: '9px', fontWeight: '900', color: '#94a3b8', marginBottom: '10px', letterSpacing: '1px' }}>🖥️ DESKTOP VERIFICATION</div>
                                     <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxWidth: '300px' }}>
                                        {Array.from({ length: visibleCounts[k.id]?.p || 5 }).map((_, i) => (
                                           <button key={i} onClick={() => handleVerify(k, i, 'desktop')} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', padding: '5px 8px', fontSize: '10px', fontWeight: '900', cursor: 'pointer' }}>P{i+1}</button>
                                        ))}
                                        {(visibleCounts[k.id]?.p || 5) < 20 && (
                                          <button onClick={() => setVisibleCounts(prev => ({ ...prev, [k.id]: { ...(prev[k.id] || {p:5, m:5, map:5}), p: (prev[k.id]?.p || 5) + 5 } }))} style={{ background: '#f1f5f9', color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', fontWeight: '900', cursor: 'pointer' }}>+</button>
                                        )}
                                     </div>
                                  </div>
                                  
                                  {/* Mobile Section */}
                                  <div>
                                     <div style={{ fontSize: '9px', fontWeight: '900', color: '#94a3b8', marginBottom: '10px', letterSpacing: '1px' }}>📱 MOBILE VERIFICATION</div>
                                     <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxWidth: '300px' }}>
                                        {Array.from({ length: visibleCounts[k.id]?.m || 5 }).map((_, i) => (
                                           <button key={i} onClick={() => handleVerify(k, i, 'mobile')} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', padding: '5px 8px', fontSize: '10px', fontWeight: '900', cursor: 'pointer' }}>M{i+1}</button>
                                        ))}
                                        {(visibleCounts[k.id]?.m || 5) < 20 && (
                                          <button onClick={() => setVisibleCounts(prev => ({ ...prev, [k.id]: { ...(prev[k.id] || {p:5, m:5, map:5}), m: (prev[k.id]?.m || 5) + 5 } }))} style={{ background: '#f1f5f9', color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', fontWeight: '900', cursor: 'pointer' }}>+</button>
                                        )}
                                     </div>
                                  </div>

                                  {/* Map Section */}
                                  <div>
                                     <div style={{ fontSize: '9px', fontWeight: '900', color: '#94a3b8', marginBottom: '10px', letterSpacing: '1px' }}>📍 LOCAL MAP PACK</div>
                                     <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxWidth: '300px' }}>
                                        {Array.from({ length: visibleCounts[k.id]?.map || 5 }).map((_, i) => (
                                           <button key={i} onClick={() => handleVerify(k, 0, 'maps')} style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: '4px', padding: '5px 8px', fontSize: '10px', fontWeight: '900', cursor: 'pointer' }}>MAP {i+1}</button>
                                        ))}
                                        {(visibleCounts[k.id]?.map || 5) < 20 && (
                                          <button onClick={() => setVisibleCounts(prev => ({ ...prev, [k.id]: { ...(prev[k.id] || {p:5, m:5, map:5}), map: (prev[k.id]?.map || 5) + 5 } }))} style={{ background: '#f1f5f9', color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', fontWeight: '900', cursor: 'pointer' }}>+</button>
                                        )}
                                     </div>
                                  </div>
                               </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
      {showKeyModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Keywords</h3>
            <textarea value={newKeys} onChange={e => setNewKeys(e.target.value)} rows="8" style={{ width: '100%', padding: '10px' }} placeholder="Enter keywords (one per line)" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button onClick={() => setShowKeyModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddKeywords}>Add</button>
            </div>
          </div>
        </div>
      )}
      {showEditKeyModal && editingKey && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px', width: '95%', padding: '0', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ background: '#1D2B44', padding: '15px 25px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', letterSpacing: '0.5px' }}>🛰️ GEOGRAPHIC OVERRIDE</h3>
              <button onClick={() => setShowEditKeyModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div style={{ padding: '20px 25px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>KEYWORD IDENTIFIER</label>
                <input 
                  value={editingKey.text} 
                  onChange={e => setEditingKey({...editingKey, text: e.target.value})} 
                  className="elite-input"
                  style={{ width: '100%', fontSize: '14px', fontWeight: '700', padding: '10px 15px' }} 
                />
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                  <h4 style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase' }}>Satellite Parameters</h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {/* Mode 1: City */}
                  <div style={{ position: 'relative' }} ref={cityDropdownRef}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b' }}>1. CITY / AREA TARGET</label>
                      <div 
                        onClick={() => setEditingKey({...editingKey, activePriority: 'city'})}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                      >
                        <span style={{ fontSize: '9px', fontWeight: '900', color: editingKey.activePriority === 'city' || !editingKey.activePriority ? '#10b981' : '#cbd5e1' }}>PRIORITY</span>
                        <div style={{ width: '14px', height: '14px', borderRadius: '4px', border: '2px solid', borderColor: editingKey.activePriority === 'city' || !editingKey.activePriority ? '#10b981' : '#cbd5e1', background: editingKey.activePriority === 'city' || !editingKey.activePriority ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px' }}>
                          {(editingKey.activePriority === 'city' || !editingKey.activePriority) && '✓'}
                        </div>
                      </div>
                    </div>
                    <input 
                      value={editingKey.location || ''} 
                      onChange={e => { setIsManualLocationSearch(true); setEditingKey({...editingKey, location: e.target.value}); }} 
                      placeholder="Search City..." 
                      className="elite-input"
                      style={{ width: '100%', background: '#fff', padding: '10px 15px', fontSize: '13px' }} 
                    />
                    {showCityDropdown && citySuggestions.length > 0 && (
                      <div className="autocomplete-list" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '5px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        {citySuggestions.map((s, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => { 
                              setEditingKey({
                                ...editingKey, 
                                location: s.display, 
                                lat: s.lat, 
                                lng: s.lng, 
                                pincode: s.pincode,
                                activePriority: 'city'
                              }); 
                              setShowCityDropdown(false); 
                            }} 
                            className="autocomplete-item"
                            style={{ padding: '10px 15px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #f1f5f9' }}
                          >
                            {s.display}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mode 2: Pincode */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b' }}>2. POSTAL / ZIP CODE</label>
                      <div 
                        onClick={() => setEditingKey({...editingKey, activePriority: 'pincode'})}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                      >
                        <span style={{ fontSize: '9px', fontWeight: '900', color: editingKey.activePriority === 'pincode' ? '#10b981' : '#cbd5e1' }}>PRIORITY</span>
                        <div style={{ width: '14px', height: '14px', borderRadius: '4px', border: '2px solid', borderColor: editingKey.activePriority === 'pincode' ? '#10b981' : '#cbd5e1', background: editingKey.activePriority === 'pincode' ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px' }}>
                          {editingKey.activePriority === 'pincode' && '✓'}
                        </div>
                      </div>
                    </div>
                    <input 
                      value={editingKey.pincode || ''} 
                      onChange={e => setEditingKey({...editingKey, pincode: e.target.value})} 
                      placeholder="e.g. 2000" 
                      className="elite-input"
                      style={{ width: '100%', background: '#fff', padding: '10px 15px', fontSize: '13px' }} 
                    />
                  </div>

                  {/* Mode 3: GPS */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b' }}>3. HIGH PRECISION GPS NODE</label>
                      <div 
                        onClick={() => setEditingKey({...editingKey, activePriority: 'coordinates'})}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                      >
                        <span style={{ fontSize: '9px', fontWeight: '900', color: editingKey.activePriority === 'coordinates' ? '#10b981' : '#cbd5e1' }}>PRIORITY</span>
                        <div style={{ width: '14px', height: '14px', borderRadius: '4px', border: '2px solid', borderColor: editingKey.activePriority === 'coordinates' ? '#10b981' : '#cbd5e1', background: editingKey.activePriority === 'coordinates' ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px' }}>
                          {editingKey.activePriority === 'coordinates' && '✓'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        value={editingKey.lat || ''} 
                        onChange={e => setEditingKey({...editingKey, lat: e.target.value})} 
                        placeholder="Latitude" 
                        className="elite-input"
                        style={{ flex: 1, background: '#fff', padding: '10px 15px', fontSize: '13px' }} 
                      />
                      <input 
                        value={editingKey.lng || ''} 
                        onChange={e => setEditingKey({...editingKey, lng: e.target.value})} 
                        placeholder="Longitude" 
                        className="elite-input"
                        style={{ flex: 1, background: '#fff', padding: '10px 15px', fontSize: '13px' }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button 
                  onClick={() => setShowEditKeyModal(false)}
                  style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '12px' }}
                >
                  CANCEL
                </button>
                <button 
                  className="btn-primary" 
                  onClick={handleUpdateKeyword}
                  style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 30px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 8px 20px rgba(255, 153, 0, 0.2)', fontSize: '12px' }}
                >
                  SAVE OVERRIDES
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
