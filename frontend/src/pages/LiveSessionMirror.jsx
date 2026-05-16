import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/apiConfig';

const LiveSessionMirror = () => {
  const { clickId } = useParams();
  const [events, setEvents] = useState([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollP, setScrollP] = useState(0);
  const [lastSeen, setLastSeen] = useState(null);
  const [clickDetails, setClickDetails] = useState(null);
  const [allActiveUsers, setAllActiveUsers] = useState([]);
  const navigate = useNavigate();
  const pollInterval = useRef(null);

  useEffect(() => {
    fetchSessionDetails();
    fetchAllActiveUsers();
    startPolling();
    
    const usersInterval = setInterval(fetchAllActiveUsers, 10000);
    return () => {
      clearInterval(pollInterval.current);
      clearInterval(usersInterval);
    };
  }, [clickId]);

  const fetchSessionDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { window.location.href = '/login'; return; }
      const res = await fetch(`${API_BASE_URL}/api/track-data`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        const found = data.data.find(c => c.id === clickId);
        setClickDetails(found);
      }
    } catch (e) { console.error(e); }
  };

  const fetchAllActiveUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { window.location.href = '/login'; return; }
      const res = await fetch(`${API_BASE_URL}/api/track-data`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        // Filter users active in last 15 minutes
        const active = data.data.filter(c => new Date(c.clickedAt) > new Date(Date.now() - 15 * 60 * 1000));
        
        // Group by IP to show only the latest session for each unique visitor
        const ipMap = new Map();
        active.forEach(user => {
            if (!ipMap.has(user.ipAddress) || new Date(user.clickedAt) > new Date(ipMap.get(user.ipAddress).clickedAt)) {
                ipMap.set(user.ipAddress, user);
            }
        });
        setAllActiveUsers(Array.from(ipMap.values()));
      }
    } catch (e) { console.error(e); }
  };

  const startPolling = () => {
    if (pollInterval.current) clearInterval(pollInterval.current);
    pollInterval.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/session-events/${clickId}`);
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          const allEvents = data.data;
          setEvents(allEvents);
          
          // Get latest mouse move
          const moves = allEvents.filter(e => e.type === 'move');
          if (moves.length > 0) {
            const latest = moves[moves.length - 1];
            setMousePos({ x: latest.x, y: latest.y });
            setLastSeen(new Date(latest.timestamp));
          }

          // Get latest scroll
          const scrolls = allEvents.filter(e => e.type === 'scroll');
          if (scrolls.length > 0) {
            setScrollP(scrolls[scrolls.length - 1].scrollP);
          }
        }
      } catch (e) { console.error(e); }
    }, 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />
      
      <main style={{ padding: '40px 20px', maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
              <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981', animation: 'pulse 2s infinite' }}></div>
              <span style={{ fontSize: '12px', fontWeight: '900', color: '#10b981', letterSpacing: '1px' }}>LIVE SESSION MIRROR</span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0 }}>Watching: {clickDetails?.ipAddress || 'Loading...'}</h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '5px' }}>📍 {clickDetails?.city}, {clickDetails?.country} • {clickDetails?.browser} on {clickDetails?.os}</p>
          </div>
          <button 
            onClick={() => navigate('/live-traffic')}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            ← Stop Monitoring
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 350px', gap: '30px' }}>
          
          {/* Left Sidebar: Active Sessions List */}
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', padding: '25px', height: 'fit-content', position: 'sticky', top: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
               <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
               <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Visitors</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '650px', overflowY: 'auto', paddingRight: '5px' }}>
               {allActiveUsers.length === 0 ? (
                 <div style={{ padding: '20px', textAlign: 'center', color: '#475569', fontSize: '12px' }}>No other active sessions.</div>
               ) : (
                  (() => {
                    const ipMap = new Map();
                    allActiveUsers.forEach(user => {
                        if (!ipMap.has(user.ipAddress) || new Date(user.clickedAt) > new Date(ipMap.get(user.ipAddress).clickedAt)) {
                            ipMap.set(user.ipAddress, user);
                        }
                    });
                    const uniqueUsers = Array.from(ipMap.values()).sort((a,b) => new Date(b.clickedAt) - new Date(a.clickedAt));

                    return uniqueUsers.map(user => (
                      <div 
                        key={user.id}
                        onClick={() => navigate(`/live-session/${user.id}`)}
                        style={{ 
                          padding: '15px', 
                          background: user.id === clickId ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.03)', 
                          borderRadius: '16px', 
                          border: '1px solid',
                          borderColor: user.id === clickId ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.05)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: user.id === clickId ? '0 10px 20px rgba(0,0,0,0.2)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                          if (user.id !== clickId) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (user.id !== clickId) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '18px' }}>{user.deviceType === 'Mobile' ? '📱' : '💻'}</span>
                          <span style={{ fontSize: '14px', fontWeight: '800', color: user.id === clickId ? '#3b82f6' : '#fff' }}>{user.ipAddress}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                          <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {user.city}, {user.country}</span>
                          <span style={{ fontWeight: 'bold' }}>{new Date(user.clickedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ));
                  })()
               )}
            </div>
          </div>

          {/* Center: Live Viewport Representation */}
          <div style={{ position: 'relative', background: '#1e293b', borderRadius: '24px', border: '1px solid #334155', height: '750px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.05)', padding: '12px 25px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', zIndex: 10, backdropFilter: 'blur(10px)' }}>
              <span style={{ color: '#94a3b8' }}>USER VIEWPORT: <span style={{ color: '#fff' }}>{clickDetails?.sessionData ? JSON.parse(clickDetails.sessionData).resolution : '1920x1080'}</span></span>
              <span style={{ color: '#94a3b8' }}>SCROLL DEPTH: <span style={{ color: '#3b82f6' }}>{scrollP}%</span></span>
            </div>

            {/* REAL WEBSITE MIRROR (IFRAME) */}
            <div style={{ 
                width: '100%', 
                height: '5000px', 
                transform: `translateY(-${scrollP}%)`,
                transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                position: 'relative',
                background: '#fff'
            }}>
                <iframe 
                    src={clickDetails ? `${clickDetails.websiteUrl}${clickDetails.exitPage || ''}` : 'about:blank'}
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        border: 'none', 
                        pointerEvents: 'none', 
                        filter: 'contrast(0.9) brightness(0.8)' 
                    }}
                    title="Session Mirror"
                />

                {/* The "Ghost" Cursor */}
                <div style={{ 
                    position: 'absolute', 
                    left: mousePos.x, 
                    top: mousePos.y,
                    width: '24px', 
                    height: '24px', 
                    background: '#f59e0b', 
                    borderRadius: '50%', 
                    boxShadow: '0 0 30px rgba(245, 158, 11, 0.5)',
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    zIndex: 100,
                    pointerEvents: 'none',
                    display: events.length > 0 ? 'block' : 'none'
                }}>
                    <div style={{ position: 'absolute', top: '30px', left: '25px', background: '#f59e0b', color: '#000', padding: '5px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '900', whiteSpace: 'nowrap', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
                        USER CURSOR
                    </div>
                </div>
            </div>

            {events.length === 0 && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', zIndex: 20 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '60px', marginBottom: '20px', animation: 'float 3s ease-in-out infinite' }}>📡</div>
                        <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '900' }}>Waiting for User Movement...</h3>
                        <p style={{ color: '#94a3b8', marginTop: '10px' }}>Session is active, awaiting real-time behavioral signal.</p>
                    </div>
                </div>
            )}
          </div>

          {/* Right Sidebar: Session Intel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div style={{ background: '#1e293b', padding: '25px', borderRadius: '24px', border: '1px solid #334155', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '14px', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '900' }}>Real-time Signal</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <IntelItem label="Current Page" value={clickDetails?.exitPage || '/'} />
                    <IntelItem label="Last Movement" value={lastSeen ? lastSeen.toLocaleTimeString() : 'N/A'} />
                    <IntelItem label="Total Events" value={events.length} />
                    <IntelItem label="Network" value={clickDetails?.isp || 'Unknown'} />
                </div>
            </div>

            <div style={{ background: '#1e293b', padding: '25px', borderRadius: '24px', border: '1px solid #334155', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '14px', color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '900' }}>User Journey</h3>
                <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
                    User entered via <span style={{ color: '#fff', fontWeight: 'bold' }}>{clickDetails?.source}</span> and has visited <span style={{ color: '#10b981', fontWeight: '900' }}>{clickDetails?.pagesVisited ? JSON.parse(clickDetails.pagesVisited).length : 1}</span> pages so far.
                </div>
                <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '900', marginBottom: '10px', letterSpacing: '1px' }}>LIVE ACTION LOG</div>
                    <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                        {events.slice(-8).reverse().map((e, i) => (
                            <div key={i} style={{ fontSize: '11px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.02)', color: '#cbd5e1' }}>
                                <span style={{ color: '#64748b', marginRight: '8px' }}>[{new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span> 
                                User {e.type === 'move' ? 'moved mouse' : 'scrolled page'}
                            </div>
                        ))}
                    </div>
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
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>
      <Footer />
    </div>
  );
};

const IntelItem = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: '900', color: '#fff', maxWidth: '180px', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
);

export default LiveSessionMirror;
