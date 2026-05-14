import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/apiConfig';
import { useNavigate } from 'react-router-dom';

const TrueCaller = () => {
    const [stats, setStats] = useState({ totalDevices: 0, spamDevices: 0, highRiskIps: 0 });
    const [reputations, setReputations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCountry, setFilterCountry] = useState('All');
    const [filterCity, setFilterCity] = useState('All');
    const [expandedId, setExpandedId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchReputations();
    }, []);

    const fetchReputations = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/track-data`);
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    const groups = data.data.reduce((acc, click) => {
                        const key = click.fingerprint || 'no-fingerprint';
                        if (!acc[key]) {
                            acc[key] = {
                                fingerprint: key,
                                lastIp: click.ipAddress,
                                totalClicks: 0,
                                spamClicks: 0,
                                lastSeen: click.clickedAt,
                                city: click.city || 'Unknown',
                                country: click.country || 'Unknown',
                                isp: click.isp,
                                isSuspicious: false,
                                history: []
                            };
                        }
                        acc[key].totalClicks++;
                        acc[key].history.push(click);
                        if (click.isSuspicious) acc[key].spamClicks++;
                        if (new Date(click.clickedAt) > new Date(acc[key].lastSeen)) {
                            acc[key].lastSeen = click.clickedAt;
                        }
                        if (click.isSuspicious) acc[key].isSuspicious = true;
                        return acc;
                    }, {});

                    const sortedRep = Object.values(groups).sort((a, b) => b.totalClicks - a.totalClicks);
                    setReputations(sortedRep);
                    
                    setStats({
                        totalDevices: Object.keys(groups).length,
                        spamDevices: Object.values(groups).filter(g => g.isSuspicious).length,
                        highRiskIps: new Set(data.data.filter(c => c.isSuspicious).map(c => c.ipAddress)).size
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching reputations:', err);
        } finally {
            setLoading(false);
        }
    };

    const countries = ['All', ...new Set(reputations.map(r => r.country))];
    const cities = ['All', ...new Set(reputations.filter(r => filterCountry === 'All' || r.country === filterCountry).map(r => r.city))];

    return (
        <div style={{ background: '#0f172a', minHeight: '100vh', color: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
            <Navbar />
            
            <main style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
                <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                            <div style={{ background: '#3b82f6', color: '#fff', padding: '8px 12px', borderRadius: '12px', fontSize: '20px' }}>🛡️</div>
                            <h1 style={{ fontSize: '36px', fontWeight: '900', margin: 0 }}>TrueCaller for Ads</h1>
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '16px' }}>Network-wide Forensic Identity & Reputation Tracking</p>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ background: '#1e293b', padding: '15px 25px', borderRadius: '16px', border: '1px solid #334155' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginBottom: '5px' }}>Total Identities</div>
                            <div style={{ fontSize: '24px', fontWeight: '900' }}>{stats.totalDevices}</div>
                        </div>
                        <div style={{ background: '#1e293b', padding: '15px 25px', borderRadius: '16px', border: '1px solid #334155', borderLeft: '4px solid #ef4444' }}>
                            <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: '800', textTransform: 'uppercase', marginBottom: '5px' }}>Spam Entities</div>
                            <div style={{ fontSize: '24px', fontWeight: '900', color: '#ef4444' }}>{stats.spamDevices}</div>
                        </div>
                    </div>
                </header>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                    <div style={{ flex: 1, background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155', display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: '#94a3b8' }}>Filter By:</span>
                        <select 
                            value={filterCountry} 
                            onChange={(e) => setFilterCountry(e.target.value)}
                            style={{ background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}
                        >
                            {countries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select 
                            value={filterCity} 
                            onChange={(e) => setFilterCity(e.target.value)}
                            style={{ background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}
                        >
                            {cities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input 
                            type="text" 
                            placeholder="Search IP or DNA..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', padding: '8px 15px', borderRadius: '8px', color: '#fff' }}
                        />
                    </div>
                </div>

                <section style={{ background: '#1e293b', borderRadius: '24px', border: '1px solid #334155', overflow: 'hidden' }}>
                    <div style={{ padding: '25px', borderBottom: '1px solid #334155' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Identity Reputation Feed</h2>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(15, 23, 42, 0.5)', textAlign: 'left' }}>
                                <th style={{ padding: '20px', fontSize: '12px', fontWeight: '800', color: '#64748b' }}>HARDWARE DNA (FINGERPRINT)</th>
                                <th style={{ padding: '20px', fontSize: '12px', fontWeight: '800', color: '#64748b' }}>LAST KNOWN IP</th>
                                <th style={{ padding: '20px', fontSize: '12px', fontWeight: '800', color: '#64748b' }}>LOCATION</th>
                                <th style={{ padding: '20px', fontSize: '12px', fontWeight: '800', color: '#64748b' }}>LIFETIME CLICKS</th>
                                <th style={{ padding: '20px', fontSize: '12px', fontWeight: '800', color: '#64748b' }}>TRUST SCORE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reputations
                                .filter(r => (filterCountry === 'All' || r.country === filterCountry))
                                .filter(r => (filterCity === 'All' || r.city === filterCity))
                                .filter(r => r.fingerprint.includes(searchQuery) || r.lastIp.includes(searchQuery))
                                .map((rep, idx) => {
                                    const isExpanded = expandedId === rep.fingerprint;
                                    const trustScore = Math.max(0, 100 - (rep.spamClicks * 20));
                                    return (
                                        <React.Fragment key={idx}>
                                        <tr 
                                            onClick={() => setExpandedId(isExpanded ? null : rep.fingerprint)}
                                            style={{ borderBottom: '1px solid #334155', transition: '0.2s', cursor: 'pointer', background: isExpanded ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }} 
                                            className="row-hover"
                                        >
                                            <td style={{ padding: '20px' }}>
                                                <div style={{ fontFamily: 'monospace', color: '#3b82f6', fontSize: '13px', fontWeight: 'bold' }}>{rep.fingerprint.substring(0, 15)}...</div>
                                                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>{isExpanded ? 'Click to collapse' : 'Click to see history'}</div>
                                            </td>
                                            <td style={{ padding: '20px' }}>
                                                <div style={{ fontWeight: 'bold' }}>{rep.lastIp}</div>
                                                <div style={{ fontSize: '10px', color: '#64748b' }}>{rep.isp?.substring(0, 20)}</div>
                                            </td>
                                            <td style={{ padding: '20px' }}>
                                                <div style={{ fontSize: '13px' }}>📍 {rep.city}, {rep.country}</div>
                                                <div style={{ fontSize: '10px', color: '#64748b' }}>Last: {new Date(rep.lastSeen).toLocaleTimeString()}</div>
                                            </td>
                                            <td style={{ padding: '20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '18px', fontWeight: '900' }}>{rep.totalClicks}</span>
                                                    {rep.spamClicks > 0 && <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>{rep.spamClicks} SPAM</span>}
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px' }}>
                                                <div style={{ width: '100px', height: '8px', background: '#0f172a', borderRadius: '10px', overflow: 'hidden', marginBottom: '8px' }}>
                                                    <div style={{ width: `${trustScore}%`, height: '100%', background: trustScore > 70 ? '#10b981' : (trustScore > 40 ? '#f59e0b' : '#ef4444') }}></div>
                                                </div>
                                                <span style={{ fontSize: '12px', fontWeight: '900', color: trustScore > 70 ? '#10b981' : (trustScore > 40 ? '#f59e0b' : '#ef4444') }}>
                                                    {trustScore}% TRUSTED
                                                </span>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan="5" style={{ padding: '20px', background: '#0f172a' }}>
                                                    <div style={{ padding: '20px', borderLeft: '4px solid #3b82f6' }}>
                                                        <h3 style={{ fontSize: '14px', marginBottom: '15px', color: '#94a3b8' }}>Forensic Interaction Timeline</h3>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                            {rep.history.sort((a, b) => new Date(b.clickedAt) - new Date(a.clickedAt)).map((h, i) => (
                                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#1e293b', borderRadius: '8px', border: '1px solid #334155' }}>
                                                                    <div>
                                                                        <span style={{ color: h.isSuspicious ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{h.isSuspicious ? '⚠ Suspicious Click' : '✓ Normal Visit'}</span>
                                                                        <span style={{ margin: '0 10px', color: '#64748b' }}>|</span>
                                                                        <span style={{ color: '#fff' }}>{h.websiteUrl}</span>
                                                                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                                                                            Source: {h.source} | IP: {h.ipAddress} | Actions: {h.actions ? JSON.parse(h.actions).length : 0} interactions
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ textAlign: 'right' }}>
                                                                        <div style={{ fontSize: '12px' }}>{new Date(h.clickedAt).toLocaleString()}</div>
                                                                        <button 
                                                                            onClick={(e) => { e.stopPropagation(); navigate(`/live-session/${h.id}`); }}
                                                                            style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', marginTop: '5px' }}>
                                                                            REPLAY SESSION
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        </React.Fragment>
                                    );
                                })}
                        </tbody>
                    </table>
                </section>
            </main>
            <Footer />
            <style>{`
                .row-hover:hover {
                    background: rgba(59, 130, 246, 0.05);
                }
            `}</style>
        </div>
    );
};

export default TrueCaller;
