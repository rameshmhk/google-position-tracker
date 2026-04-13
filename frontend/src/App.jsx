import React, { useState, useEffect } from 'react';
import './index.css';

const App = () => {
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const [selectedKeyIds, setSelectedKeyIds] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  
  const [showProjModal, setShowProjModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showEditKeyModal, setShowEditKeyModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, status: '', estimate: 0 });
  const [globalApiKey, setGlobalApiKey] = useState('');
  const [newProj, setNewProj] = useState({ name: '', url: '', targetRegion: 'au', businessName: '', serperApiKey: '', schedule: 'instant' });
  const [editProj, setEditProj] = useState(null);
  const [editingKey, setEditingKey] = useState(null);
  const [newKeys, setNewKeys] = useState('');

  const [globalScrapingdogApiKey, setGlobalScrapingdogApiKey] = useState('');
  const [globalSerpapiKey, setGlobalSerpapiKey] = useState('');
  const [scrapingMode, setScrapingMode] = useState('hybrid');

  // Derived unique locations for the current project
  const uniqueLocations = keywords
    .filter(k => k.location && (k.lat || k.lng))
    .reduce((acc, current) => {
      const exists = acc.find(item => 
        item.location === current.location && 
        item.lat === current.lat && 
        item.lng === current.lng
      );
      if (!exists) acc.push({ location: current.location, lat: current.lat, lng: current.lng });
      return acc;
    }, []);

  const API_BASE = 'http://localhost:5000/api';

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
      const res = await fetch(`${API_BASE}/projects`);
      const data = await res.json();
      setProjects(data);
      if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
    } catch (err) { console.error('Projects fetch error:', err); }
  };

  const fetchKeywords = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/projects/${id}/keywords`);
      const data = await res.json();
      setKeywords(data);
    } catch (err) { console.error('Keywords fetch error:', err); }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      const data = await res.json();
      setGlobalApiKey(data.globalSerperApiKey || '');
      setGlobalScrapingdogApiKey(data.globalScrapingdogApiKey || '');
      setGlobalSerpapiKey(data.globalSerpapiKey || '');
      setScrapingMode(data.scrapingMode || 'hybrid');
    } catch (err) { console.error('Settings fetch error:', err); }
  };

  const handleSaveSettings = async () => {
    try {
      await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          globalSerperApiKey: globalApiKey,
          globalScrapingdogApiKey: globalScrapingdogApiKey,
          globalSerpapiKey: globalSerpapiKey,
          scrapingMode 
        })
      });
      setShowSettingsModal(false);
      alert("✅ Global Settings Saved!");
    } catch (err) { console.error('Save settings error:', err); }
  };

  const handleCreateProject = async () => {
    if (!newProj.name || !newProj.url) return;
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProj)
      });
      const added = await res.json();
      setProjects([...projects, added]);
      setSelectedId(added.id);
      setShowProjModal(false);
      setNewProj({ name: '', url: '', targetRegion: 'au', businessName: '', serperApiKey: '', schedule: 'instant' });
    } catch (err) { console.error('Create project error:', err); }
  };

  const handleUpdateProject = async () => {
    if (!editProj) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${editProj.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProj)
      });
      const updated = await res.json();
      setProjects(projects.map(p => String(p.id) === String(updated.id) ? updated : p));
      setShowEditModal(false);
    } catch (err) { console.error('Update project error:', err); }
  };

  const handleToggleProjectStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: keyArray })
      });
      
      if (!res.ok) {
        const rawText = await res.text();
        console.error('[DEBUG] Raw Response:', rawText);
        try {
          const errData = JSON.parse(rawText);
          throw new Error(errData.error || 'Server error');
        } catch (e) {
          throw new Error(`Connection issue (Not JSON). Server sent: ${rawText.substring(0, 50)}...`);
        }
      }

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
      const res = await fetch(`${API_BASE}/keywords/${id}/toggle-pause`, { method: 'POST' });
      const data = await res.json();
      setKeywords(prev => prev.map(k => String(k.id) === String(id) ? { ...k, status: data.status } : k));
    } catch (err) { console.error('Toggle pause error:', err); }
  };

  const handleToggleMaps = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/keywords/${id}/toggle-maps`, { method: 'POST' });
      const data = await res.json();
      setKeywords(prev => prev.map(k => String(k.id) === String(id) ? { ...k, mapsStatus: data.mapsStatus } : k));
    } catch (err) { console.error('Toggle maps error:', err); }
  };

  const handleToggleOrganic = async (id) => {
    try {
      const url = `${API_BASE}/keywords/${id}/toggle-organic`;
      const res = await fetch(url, { method: 'POST' });
      if (!res.ok) throw new Error(`Server returned ${res.status} for ${url}`);
      const data = await res.json();
      setKeywords(prev => prev.map(k => String(k.id) === String(id) ? { ...k, organicStatus: data.organicStatus } : k));
    } catch (err) { 
      console.error('Toggle organic error:', err);
      alert(`❌ Toggle Failed: ${err.message}`);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedKeyIds.length === 0) return;
    try {
      if (action === 'delete') {
        if (!window.confirm(`Delete ${selectedKeyIds.length} keywords?`)) return;
        for (const id of selectedKeyIds) {
          await fetch(`${API_BASE}/keywords/${id}`, { method: 'DELETE' });
        }
        setKeywords(prev => prev.filter(k => !selectedKeyIds.includes(k.id)));
      } else {
        const newStatus = action === 'pause' ? 'paused' : 'active';
        await fetch(`${API_BASE}/keywords/bulk-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedKeyIds, status: newStatus })
        });
        setKeywords(prev => prev.map(k => selectedKeyIds.includes(k.id) ? { ...k, status: newStatus } : k));
      }
      setSelectedKeyIds([]);
    } catch (err) { console.error('Bulk action error:', err); }
  };

  const handleDeleteKeyword = async (id) => {
    if (!window.confirm('Delete this keyword?')) return;
    try {
      await fetch(`${API_BASE}/keywords/${id}`, { method: 'DELETE' });
      setKeywords(prev => prev.filter(k => k.id !== id));
      setSelectedKeyIds(prev => prev.filter(kid => kid !== id));
    } catch (err) { console.error('Delete keyword error:', err); }
  };

  const handleSaveAll = async () => {
    if (!selectedId) return;
    try {
      console.log(`[UI] Syncing all keywords for project ${selectedId}...`);
      const res = await fetch(`${API_BASE}/keywords/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedId, keywords })
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ All changes saved successfully!");
      }
    } catch (err) { console.error('Sync error:', err); }
  };

  const handleUpdateKeyword = async () => {
    if (!editingKey) return;
    try {
      const res = await fetch(`${API_BASE}/keywords/${editingKey.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: editingKey.text, 
          location: editingKey.location,
          lat: editingKey.lat,
          lng: editingKey.lng
        })
      });
      const updated = await res.json();
      setKeywords(prev => prev.map(k => String(k.id) === String(updated.id) ? updated : k));
      setShowEditKeyModal(false);
      setEditingKey(null);
    } catch (err) { console.error('Update keyword error:', err); }
  };

  const handleDeleteProject = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete entire project and all its keywords?')) return;
    try {
      await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
      const updated = projects.filter(p => p.id !== id);
      setProjects(updated);
      if (selectedId === id && updated.length > 0) setSelectedId(updated[0].id);
      else if (updated.length === 0) setSelectedId(null);
    } catch (err) { console.error('Delete project error:', err); }
  };

  const handleCheck = async () => {
    const project = projects.find(p => String(p.id) === String(selectedId));
    if (!project) return;
    
    const activeKeywords = keywords.filter(k => k.status === 'active');
    if (activeKeywords.length === 0) {
      alert("❌ No active keywords to check!");
      return;
    }

    console.log(`[UI] Starting sequential check for ${activeKeywords.length} keywords...`);
    setIsChecking(true);
    setScanProgress({ 
      current: 0, 
      total: activeKeywords.length, 
      status: 'Initializing browser...', 
      estimate: activeKeywords.length * 15 
    });

    try {
      // ONE FAST CALL FOR THE WHOLE PROJECT
      const res = await fetch(`${API_BASE}/check-project/${selectedId}`, { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        console.log(`[BatchUI] Project check successful: processed ${data.count} keywords.`);
        // Refresh keywords once
        fetchKeywords(selectedId);
      }
    } catch (err) { 
      console.error('Batch project check error:', err);
    } finally { 
      setIsChecking(false);
    }
  };

  const handleVerify = (k) => {
    const project = projects.find(p => p.id === selectedId);
    if (!project) return;
    
    const tld = project.targetRegion === 'au' ? 'google.com.au' : 'google.com';
    const query = encodeURIComponent(k.text);
    
    // Generate UULE if location exists
    let uule = '';
    if (k.location) {
      const canonical = k.location.toLowerCase().includes('australia') ? k.location : `${k.location},Australia`;
      const UULE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
      const key = UULE_CHARS[canonical.length] || 'A';
      const encoded = btoa(canonical).replace(/=/g, '');
      uule = `&uule=w+CAIQICI${key}${encoded}`;
    }

    const url = `https://www.${tld}/search?q=${query}${uule}`;
    window.open(url, '_blank');
  };

  const formatRank = (pos) => {
    if (pos === 'Blocked') return 'Blocked';
    if (!pos || pos === 0) return 'N/A';
    const num = Number(pos);
    if (isNaN(num)) return pos;
    const page = Math.ceil(num / 10);
    const pOnPage = num % 10 === 0 ? 10 : num % 10;
    return `${page}//${pOnPage}`;
  };

  const activeProject = projects.find(p => p.id === selectedId);

  return (
    <div className="app-container">
      <div className="sidebar">
        <h1 className="logo">RankTracker Pro</h1>
        <div className="sidebar-header">
          <span>PROJECTS</span>
          <button className="add-btn" onClick={() => setShowProjModal(true)}>+</button>
        </div>
        <div className="project-list">
          {projects.map(p => (
            <div 
              key={p.id} 
              className={`project-item ${selectedId === p.id ? 'active' : ''} ${p.status === 'paused' ? 'paused-proj' : ''}`}
              onClick={() => setSelectedId(p.id)}
            >
              <div className="proj-dot" style={{ background: p.status === 'active' ? 'var(--accent-cyan)' : '#ff9800' }}></div>
              <span style={{flex: 1}}>{p.name}</span>
              <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setEditProj(p); setShowEditModal(true); }}>⚙️</button>
              <button className="icon-btn delete-proj" onClick={(e) => handleDeleteProject(p.id, e)}>🗑️</button>
            </div>
          ))}
        </div>
        
        <div className="sidebar-footer">
          <button className="btn-secondary w-full" style={{marginBottom: '10px'}} onClick={() => setShowSettingsModal(true)}>
            ⚙️ Global Settings
          </button>
          <button className="btn-secondary w-full" onClick={() => window.open(`${API_BASE}/download-excel`, '_blank')}>
            📊 Download Excel Report
          </button>
        </div>
      </div>

      <main className="main-content">
        <header className="header">
          <div className="project-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <h2>{activeProject?.name || 'Select a Project'}</h2>
              {activeProject && (
                <button 
                  className={`status-chip ${activeProject.status}`}
                  onClick={() => handleToggleProjectStatus(activeProject.id, activeProject.status)}
                >
                  {activeProject.status === 'active' ? '🟢 Active' : '🟠 Paused'}
                </button>
              )}
            </div>
            <div className="project-badges">
              <span className="badge-region">📍 Google {activeProject?.targetRegion?.toUpperCase() || 'Global'}</span>
              <span className="badge-url">🔗 {activeProject?.url}</span>
              {activeProject?.businessName && <span className="badge-identity">🏢 {activeProject.businessName}</span>}
              <span className="badge-schedule">⏰ {activeProject?.schedule || 'Manual'} Scan</span>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={() => setShowKeyModal(true)}>+ Add Keywords</button>
            <button className="btn-save" onClick={handleSaveAll} title="Save current keyword list to database">💾 Save Changes</button>
            <button 
              className="btn-primary" 
              onClick={handleCheck}
              disabled={isChecking || !selectedId}
            >
              {isChecking ? 'Checking...' : 'Check All Rankings'}
            </button>
          </div>
        </header>

        {/* PROGRESS BAR REMOVED PER USER REQUEST */}


        {selectedKeyIds.length > 0 && (
          <div className="bulk-action-bar">
            <span>{selectedKeyIds.length} keywords selected</span>
            <div className="bulk-btns">
              <button onClick={() => handleBulkAction('resume')}>▶️ Resume</button>
              <button onClick={() => handleBulkAction('pause')}>⏸️ Pause</button>
              <button className="bulk-del" onClick={() => handleBulkAction('delete')}>🗑️ Delete</button>
            </div>
          </div>
        )}

        <section className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedKeyIds.length === keywords.length && keywords.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedKeyIds(keywords.map(k => k.id));
                      else setSelectedKeyIds([]);
                    }}
                  />
                </th>
                <th>Keyword</th>
                <th style={{ minWidth: '150px' }}>Target Location</th>
                <th>Organic</th>
                <th>Maps (Pack)</th>
                <th>Toggle Mapping</th>
                <th>Toggle Organic</th>
                <th>Source</th>
                <th>Status</th>
                <th style={{textAlign: 'right'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {keywords.map(k => (
                <tr key={k.id} style={{ opacity: k.status === 'paused' ? 0.5 : 1 }}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedKeyIds.includes(k.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedKeyIds([...selectedKeyIds, k.id]);
                        else setSelectedKeyIds(selectedKeyIds.filter(id => id !== k.id));
                      }}
                    />
                  </td>
                  <td>{k.text}</td>
                  <td style={{ color: 'var(--text-dim)', fontSize: '13px' }}>
                    {k.location || 'Default (Project)'}
                    {(k.lat || k.lng) ? (
                      <div style={{ fontSize: '10px', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                        📍 {k.lat}, {k.lng}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <span className="rank-badge organic-badge">{formatRank(k.organic)}</span>
                  </td>
                  <td>
                    <span className={`rank-badge maps-badge ${k.maps > 0 ? 'found' : ''}`}>
                      {k.maps > 0 ? `#${k.maps}` : 'N/A'}
                    </span>
                  </td>
                  <td style={{ opacity: k.mapsStatus === 'paused' ? 0.6 : 1 }}>
                    <button 
                      className={`btn-toggle ${k.mapsStatus === 'active' ? 'active' : 'paused'}`}
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      onClick={() => handleToggleMaps(k.id)}
                    >
                      {k.mapsStatus === 'active' ? 'Active' : 'Paused'}
                    </button>
                  </td>
                  <td style={{ opacity: (k.organicStatus || 'active') === 'paused' ? 0.6 : 1 }}>
                    <button 
                      className={`btn-toggle ${(k.organicStatus || 'active') === 'active' ? 'active' : 'paused'}`}
                      style={{ padding: '4px 8px', fontSize: '11px', background: (k.organicStatus || 'active') === 'active' ? 'var(--info)' : '#444' }}
                      onClick={() => handleToggleOrganic(k.id)}
                    >
                      {(k.organicStatus || 'active') === 'active' ? 'Active' : 'Paused'}
                    </button>
                  </td>
                  <td>
                    {k.source && (
                      <span className="source-tag" title={`Fetched via ${k.source}`}>
                        {k.source === 'Browser' ? '🌐' : '⚡'} {k.source}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="status-dot" style={{ color: k.status === 'active' ? '#4CAF50' : '#ff9800' }}>●</span> 
                    {k.status === 'active' ? 'Live' : 'Paused'}
                  </td>
                  <td style={{textAlign: 'right'}}>
                    <button className="action-icon-btn" onClick={() => handleVerify(k)} title="Verify on Google">
                      🔍
                    </button>
                    <button className="action-icon-btn" style={{ marginLeft: '10px' }} onClick={() => { setEditingKey(k); setShowEditKeyModal(true); }}>
                      ✏️
                    </button>
                    <button className="action-icon-btn" style={{ marginLeft: '10px' }} onClick={() => handleTogglePause(k.id)}>
                      {k.status === 'active' ? '⏸️' : '▶️'}
                    </button>
                    <button className="delete-icon-btn" style={{ marginLeft: '10px' }} onClick={() => handleDeleteKeyword(k.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
              {keywords.length === 0 && (
                <tr><td colSpan="6" style={{textAlign: 'center', padding: '40px', color: 'var(--text-dim)'}}>No keywords added yet.</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </main>

      {/* Add Project Modal */}
      {showProjModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add New Project</h3>
            <input 
              placeholder="Name (e.g. My Website)" 
              value={newProj.name}
              onChange={e => setNewProj({...newProj, name: e.target.value})}
            />
            <input 
              placeholder="URL (e.g. example.com)" 
              value={newProj.url}
              onChange={e => setNewProj({...newProj, url: e.target.value})}
            />
            <input 
              placeholder="Business Name (for Google Maps)" 
              value={newProj.businessName}
              onChange={e => setNewProj({...newProj, businessName: e.target.value})}
            />
            <input 
              placeholder="Serper.dev API Key (Optional)" 
              value={newProj.serperApiKey}
              onChange={e => setNewProj({...newProj, serperApiKey: e.target.value})}
              type="password"
            />
            <div className="form-group">
              <label>Target Region</label>
              <select value={newProj.targetRegion} onChange={e => setNewProj({...newProj, targetRegion: e.target.value})}>
                <option value="au">Australia (.au)</option>
                <option value="us">USA (.us)</option>
                <option value="gb">UK (.uk)</option>
                <option value="in">India (.in)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Scan Schedule</label>
              <select value={newProj.schedule} onChange={e => setNewProj({...newProj, schedule: e.target.value})}>
                <option value="instant">Manual Only</option>
                <option value="daily">Daily Auto-Scan</option>
                <option value="weekly">Weekly Auto-Scan</option>
              </select>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowProjModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateProject}>Save Project</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && editProj && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Project Settings</h3>
            <input 
              placeholder="Name" 
              value={editProj.name}
              onChange={e => setEditProj({...editProj, name: e.target.value})}
            />
            <input 
              placeholder="URL" 
              value={editProj.url}
              onChange={e => setEditProj({...editProj, url: e.target.value})}
            />
            <input 
              placeholder="Business Name" 
              value={editProj.businessName}
              onChange={e => setEditProj({...editProj, businessName: e.target.value})}
            />
            <input 
              placeholder="Serper.dev API Key" 
              value={editProj.serperApiKey}
              onChange={e => setEditProj({...editProj, serperApiKey: e.target.value})}
              type="password"
            />
            <div className="form-group">
              <label>Target Region</label>
              <select value={editProj.targetRegion} onChange={e => setEditProj({...editProj, targetRegion: e.target.value})}>
                <option value="au">Australia (.au)</option>
                <option value="us">USA (.us)</option>
                <option value="gb">UK (.uk)</option>
                <option value="in">India (.in)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Scraping Strategy</label>
              <select value={editProj.scrapingStrategy || 'inherit'} onChange={e => setEditProj({...editProj, scrapingStrategy: e.target.value})}>
                <option value="inherit">Inherit Global Settings</option>
                <option value="hybrid">Fast Hybrid (API Priority)</option>
                <option value="browser_only">Real Browser Only (High Accuracy)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Scan Schedule</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select style={{ flex: 1 }} value={editProj.schedule} onChange={e => setEditProj({...editProj, schedule: e.target.value})}>
                  <option value="instant">Manual Only</option>
                  <option value="daily">Daily Auto-Scan</option>
                  <option value="weekly">Weekly Auto-Scan</option>
                </select>
                {editProj.schedule === 'weekly' && (
                  <select style={{ flex: 1 }} value={editProj.scheduleDay || 'Friday'} onChange={e => setEditProj({...editProj, scheduleDay: e.target.value})}>
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

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdateProject}>Update Project</button>
            </div>
          </div>
        </div>
      )}

      {/* Keyword Modal */}
      {showKeyModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Bulk Add Keywords</h3>
            <p style={{fontSize: '12px', color: 'var(--text-dim)', marginBottom: '5px'}}>Format: <code style={{color: 'var(--accent-cyan)'}}>Keyword | City | Lat | Lng</code> (e.g. seo agency | Melbourne | -37.81 | 144.96)</p>
            <textarea 
              rows="8"
              placeholder="seo agency | Melbourne&#10;digital marketing | Sydney"
              value={newKeys}
              onChange={e => setNewKeys(e.target.value)}
            />
            
            {uniqueLocations.length > 0 && (
              <div className="recent-locations-container">
                <h5>📍 Quick Coordinates (Click to Add to list)</h5>
                <div className="location-chips">
                  {uniqueLocations.map((loc, idx) => (
                    <div 
                      key={idx} 
                      className="location-chip" 
                      onClick={() => setNewKeys(prev => {
                        const lines = prev.split('\n');
                        const lastLine = lines[lines.length - 1];
                        if (lastLine.includes('|')) {
                           // If last line already has data, assume new line
                           return prev + `\n | ${loc.location} | ${loc.lat} | ${loc.lng}`;
                        }
                        return prev + ` | ${loc.location} | ${loc.lat} | ${loc.lng}`;
                      })}
                    >
                      <span>{loc.location}</span>
                      <span className="coords">({loc.lat}, {loc.lng})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button onClick={() => setShowKeyModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddKeywords}>Add Keywords</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Keyword Modal */}
      {showEditKeyModal && editingKey && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Keyword</h3>
            <div className="form-group">
              <label>Keyword Text</label>
              <input 
                value={editingKey.text}
                onChange={e => setEditingKey({...editingKey, text: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Target Location (City/Region)</label>
              <input 
                placeholder="e.g., Sydney"
                value={editingKey.location}
                onChange={e => setEditingKey({...editingKey, location: e.target.value})}
              />
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Latitude (Optional)</label>
                <input 
                  type="number"
                  step="any"
                  placeholder="e.g. -33.86"
                  value={editingKey.lat || ''}
                  onChange={e => setEditingKey({...editingKey, lat: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Longitude (Optional)</label>
                <input 
                  type="number"
                  step="any"
                  placeholder="e.g. 151.20"
                  value={editingKey.lng || ''}
                  onChange={e => setEditingKey({...editingKey, lng: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>

            {uniqueLocations.length > 0 && (
              <div className="recent-locations-container">
                <h5>📍 Use Existing Coordinates</h5>
                <div className="location-chips">
                  {uniqueLocations.map((loc, idx) => (
                    <div 
                      key={idx} 
                      className="location-chip" 
                      onClick={() => setEditingKey({ ...editingKey, location: loc.location, lat: loc.lat, lng: loc.lng })}
                    >
                      <span>{loc.location}</span>
                      <span className="coords">({loc.lat}, {loc.lng})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button onClick={() => setShowEditKeyModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleUpdateKeyword}>Update Keyword</button>
            </div>
          </div>
        </div>
      )}
      {/* Global Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay">
          <div className="modal settings-modal">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
              <h3 style={{margin: 0}}>⚙️ Global Engine Settings</h3>
              <button className="close-x" onClick={() => setShowSettingsModal(false)}>×</button>
            </div>
            
            <div className="form-group">
              <label style={{marginBottom: '10px', display: 'block'}}>Scraping Engine Strategy</label>
              <div className="mode-option-grid">
                <div 
                  className={`mode-card ${scrapingMode === 'hybrid' ? 'active' : ''}`} 
                  onClick={() => setScrapingMode('hybrid')}
                >
                  <span className="benefit-tag">⚡ Fast & Efficient</span>
                  <h4>Hybrid Mode</h4>
                  <p>Uses high-speed APIs first to save resources. Uses browser only as a fallback for missing data.</p>
                </div>
                <div 
                  className={`mode-card ${scrapingMode === 'browser_only' ? 'active' : ''}`} 
                  onClick={() => setScrapingMode('browser_only')}
                >
                  <span className="benefit-tag">📍 Hyper-Local</span>
                  <h4>Real Browser Only</h4>
                  <p>100% Accuracy. Simulates a real user with exact GPS coordinates. Best for Local Map Pack tracking.</p>
                </div>
              </div>
            </div>

            <div className="api-section">
              {/* Serper Card */}
              <div className="api-service-card">
                <div className="api-header">
                  <span className="api-name">🚀 Serper.dev (Primary)</span>
                  <span className="api-meta">2,500 scans FREE</span>
                </div>
                <p className="api-instruction">
                  Visit <a href="https://serper.dev" target="_blank" rel="noreferrer" style={{color: 'var(--accent-cyan)'}}>Serper.dev</a> to get your key. This is the fastest engine.
                </p>
                <div className="api-input-wrapper">
                  <input 
                    type="password" 
                    placeholder="Enter Serper API Key..." 
                    value={globalApiKey} 
                    onChange={e => setGlobalApiKey(e.target.value)} 
                  />
                  <span className="input-icon">🔑</span>
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                {/* Scrapingdog Card */}
                <div className="api-service-card">
                  <div className="api-header">
                    <span className="api-name">🐕 Scrapingdog</span>
                    <span className="api-meta">1K Free</span>
                  </div>
                  <div className="api-input-wrapper">
                    <input 
                      type="password" 
                      placeholder="Backup Key..." 
                      value={globalScrapingdogApiKey} 
                      onChange={e => setGlobalScrapingdogApiKey(e.target.value)} 
                    />
                  </div>
                </div>

                {/* SerpApi Card */}
                <div className="api-service-card">
                  <div className="api-header">
                    <span className="api-name">🐍 SerpApi</span>
                    <span className="api-meta">250 Free</span>
                  </div>
                  <div className="api-input-wrapper">
                    <input 
                      type="password" 
                      placeholder="Backup Key..." 
                      value={globalSerpapiKey} 
                      onChange={e => setGlobalSerpapiKey(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pro-tip">
              <h5>💡 Optimization Tip</h5>
              <p>
                Running a local business scan? <strong>Real Browser Only</strong> mode combined with <strong>GPS Lat/Lng</strong> provides the most precise hyper-local results.
              </p>
            </div>

            <div className="settings-footer">
              <button className="btn-secondary" onClick={() => setShowSettingsModal(false)}>Close</button>
              <button className="btn-primary" onClick={handleSaveSettings}>Save & Apply Global Settings</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
