import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config/apiConfig';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, AreaChart, Area
} from 'recharts';

const ProjectInsights = () => {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const API_BASE = `${API_BASE_URL}/api`;

  const [project, setProject] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      
      const pRes = await fetch(`${API_BASE}/projects`, { headers });
      const pData = await pRes.json();
      const activeP = pData.find(p => String(p.id) === String(id));
      setProject(activeP);

      const kRes = await fetch(`${API_BASE}/projects/${id}/keywords`, { headers });
      const kData = await kRes.json();
      setKeywords(kData);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankChange = (history, type) => {
    if (!history || history.length < 2) return { diff: 0, trend: 'stable' };
    const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
    const latest = sorted[0][type] || 0;
    const previous = sorted[1][type] || 0;
    if (latest === 0 && previous === 0) return { diff: 0, trend: 'stable' };
    if (previous === 0 && latest > 0) return { diff: latest, trend: 'up', isNew: true };
    if (latest === 0 && previous > 0) return { diff: previous, trend: 'down', isLost: true };
    const diff = previous - latest;
    if (diff > 0) return { diff, trend: 'up' };
    if (diff < 0) return { diff: Math.abs(diff), trend: 'down' };
    return { diff: 0, trend: 'stable' };
  };

  const distributionData = useMemo(() => {
    const dist = [
      { name: 'Top 1', count: 0, color: '#10b981' },
      { name: 'Top 3', count: 0, color: '#34d399' },
      { name: 'Top 10', count: 0, color: '#6ee7b7' },
      { name: 'Top 50', count: 0, color: '#f97316' },
      { name: '100+', count: 0, color: '#94a3b8' },
    ];
    keywords.forEach(k => {
      const rank = k.rank || k.organic || 0;
      if (rank === 1) dist[0].count++;
      else if (rank <= 3 && rank > 0) dist[1].count++;
      else if (rank <= 10 && rank > 0) dist[2].count++;
      else if (rank <= 50 && rank > 0) dist[3].count++;
      else dist[4].count++;
    });
    return dist;
  }, [keywords]);

  const trendData = useMemo(() => {
    const historyMap = {};
    keywords.forEach(k => {
      if (k.history) {
        k.history.forEach(h => {
          if (!historyMap[h.date]) historyMap[h.date] = { total: 0, count: 0 };
          const rank = h.organic || 0;
          if (rank > 0) {
            historyMap[h.date].total += rank;
            historyMap[h.date].count++;
          }
        });
      }
    });
    return Object.keys(historyMap).sort().map(date => ({
      date: date.split('-').slice(1).join('/'),
      avgRank: historyMap[date].count > 0 ? Number((historyMap[date].total / historyMap[date].count).toFixed(1)) : 0
    })).slice(-30);
  }, [keywords]);

  const [matrixView, setMatrixView] = useState('daily'); // 'daily' or 'weekly'

  const matrixData = useMemo(() => {
    if (matrixView === 'daily') {
      // Generate last 10 days range leading up to today
      const sortedDates = [];
      for (let i = 9; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        sortedDates.push(d.toISOString().split('T')[0]);
      }

      const rows = keywords.map(k => {
        const dateColumns = sortedDates.map(date => {
          const entry = k.history?.find(h => h.date === date);
          if (!entry || !entry.organic) return '—';
          const page = Math.floor((entry.organic - 1) / 10) + 1;
          const pos = ((entry.organic - 1) % 10) + 1;
          return `${page} // ${pos}`;
        });

        return {
          text: k.text,
          columns: dateColumns
        };
      });

      return { headers: sortedDates, rows, isWeekly: false };
    } else {
      // Weekly Logic: Last 8 weeks aligned with user's scan day
      const weeklyHeaders = [];
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const customDayName = project?.scanDay || 'Monday'; // Default to Monday if not set
      const targetDayIndex = daysOfWeek.indexOf(customDayName);

      for (let i = 7; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - (i * 7));
        
        // Snap to the target day of that week
        const currentDayIndex = d.getDay();
        let diff = targetDayIndex - currentDayIndex;
        // If we are looking for a day that hasn't happened yet this week, go back to last week's that day
        if (i === 0 && diff > 0) diff -= 7; 
        
        d.setDate(d.getDate() + diff);
        weeklyHeaders.push(d.toISOString().split('T')[0]);
      }

      const rows = keywords.map(k => {
        const weekColumns = weeklyHeaders.map((targetDateStr, i) => {
          const targetDate = new Date(targetDateStr);
          const nextWeekDate = new Date(targetDate);
          nextWeekDate.setDate(nextWeekDate.getDate() + 7);

          // Find the entry EXACTLY on that day, or the closest one in that week range
          const exactEntry = k.history?.find(h => h.date === targetDateStr);
          if (exactEntry?.organic) {
            const page = Math.floor((exactEntry.organic - 1) / 10) + 1;
            const pos = ((exactEntry.organic - 1) % 10) + 1;
            return `${page} // ${pos}`;
          }

          // Fallback: Find the latest entry in the 7 days LEADING UP to this date
          const rangeEntries = k.history?.filter(h => {
            const hDate = new Date(h.date);
            const sevenDaysAgo = new Date(targetDate);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return hDate > sevenDaysAgo && hDate <= targetDate;
          }).sort((a, b) => new Date(b.date) - new Date(a.date));

          const entry = rangeEntries?.[0];
          if (!entry || !entry.organic) return '—';
          const page = Math.floor((entry.organic - 1) / 10) + 1;
          const pos = ((entry.organic - 1) % 10) + 1;
          return `${page} // ${pos}`;
        });

        return {
          text: k.text,
          columns: weekColumns
        };
      });

      return { headers: weeklyHeaders, rows, isWeekly: true };
    }
  }, [keywords, matrixView]);

  const dailyBreakdown = useMemo(() => {
    const dates = new Set();
    keywords.forEach(k => k.history?.forEach(h => dates.add(h.date)));
    const sortedDates = Array.from(dates).sort((a, b) => new Date(b) - new Date(a));
    
    return sortedDates.map(date => {
      let improved = 0;
      let declined = 0;
      let rankedCount = 0;
      let totalRank = 0;

      keywords.forEach(k => {
        const hEntry = k.history?.find(h => h.date === date);
        if (hEntry) {
          const rank = hEntry.organic || 0;
          if (rank > 0) {
            rankedCount++;
            totalRank += rank;
          }
          // Compare this date with the date before it in history
          const hIdx = k.history.findIndex(h => h.date === date);
          const prevEntry = k.history[hIdx - 1]; // This assumes history is sorted ASC in DB
          if (prevEntry) {
            const diff = (prevEntry.organic || 101) - (rank || 101);
            if (diff > 0) improved++;
            if (diff < 0) declined++;
          }
        }
      });

      return {
        date,
        avgRank: rankedCount > 0 ? (totalRank / rankedCount).toFixed(1) : 'DNS',
        improved,
        declined,
        totalChecked: keywords.length
      };
    });
  }, [keywords]);

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>🔍 Analyzing Node Data...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>
      <Helmet>
        <title>Project Insights | {project?.name || 'Loading'}</title>
      </Helmet>

      <aside style={{ width: '260px', background: '#0F172A', color: '#fff', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', boxShadow: '10px 0 30px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '40px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div 
            onClick={() => navigate('/dashboard')}
            style={{ color: '#fff', fontSize: '14px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.8 }}
          >
             <span style={{ fontSize: '18px' }}>←</span> DASHBOARD
          </div>
        </div>
        <div style={{ flex: 1, padding: '40px 25px' }}>
           <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '2px', marginBottom: '12px' }}>INTELLIGENCE NODE</div>
              <div style={{ color: '#fff', fontWeight: '900', fontSize: '18px', marginBottom: '6px', letterSpacing: '-0.5px' }}>{project?.name}</div>
              <div style={{ fontSize: '12px', color: '#64748b', wordBreak: 'break-all' }}>{project?.url.replace('https://', '')}</div>
           </div>
        </div>
        <div style={{ padding: '30px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
           <button onClick={() => navigate('/settings')} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>System Config</button>
        </div>
      </aside>

      <main style={{ marginLeft: '260px', flex: 1, padding: '50px 60px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          <header style={{ marginBottom: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '30px', height: '2px', background: 'var(--accent)' }}></div>
                <span style={{ fontSize: '11px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '2px' }}>PROJECT ANALYTICS</span>
              </div>
              <h1 style={{ margin: 0, fontSize: '36px', fontWeight: '900', color: '#1e293b', letterSpacing: '-1.5px' }}>Node Performance</h1>
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
               <button onClick={() => navigate(`/project-settings/${id}`)} style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '10px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>PROJECT SETTINGS</button>
               <button className="pro-button" style={{ padding: '10px 24px' }} onClick={fetchData}>RUN DIAGNOSTICS</button>
            </div>
          </header>

          {/* Statistics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
            {[
              { label: 'Total Inventory', val: keywords.length, color: '#1e293b', bg: '#fff' },
              { label: 'Market Visibility', val: `${keywords.filter(k => (k.rank || k.organic || 0) <= 10 && (k.rank || k.organic || 0) > 0).length}`, color: '#10b981', bg: '#f0fdf4' },
              { label: 'Avg. Node Position', val: trendData.length > 0 ? `#${trendData[trendData.length-1].avgRank}` : 'DNS', color: '#f97316', bg: '#fff7ed' },
              { label: 'Intelligence Level', val: project?.scrapingStrategy?.replace('_', ' ').split(' ')[0].toUpperCase(), color: '#3b82f6', bg: '#f0f9ff' }
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, padding: '30px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>{s.label}</div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: s.color, letterSpacing: '-1px' }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Graphs Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', marginBottom: '40px' }}>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#1e293b', marginBottom: '30px' }}>📈 RANKING TREND (AVERAGE POSITION)</h3>
              <div style={{ height: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis reversed={true} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="avgRank" stroke="var(--accent)" strokeWidth={4} fillOpacity={1} fill="url(#colorTrend)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#1e293b', marginBottom: '30px' }}>📊 VISIBILITY DISTRIBUTION</h3>
              <div style={{ height: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distributionData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={30}>
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Daily History Table */}
          <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '25px 30px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#1e293b' }}>📅 DAILY RANKING PERFORMANCE</h3>
               <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>History (Last 30 Days)</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '15px 30px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b' }}>DATE</th>
                  <th style={{ padding: '15px 30px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b' }}>AVG RANK</th>
                  <th style={{ padding: '15px 30px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b' }}>IMPROVED</th>
                  <th style={{ padding: '15px 30px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b' }}>DECLINED</th>
                  <th style={{ padding: '15px 30px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b' }}>VISIBILITY</th>
                </tr>
              </thead>
              <tbody>
                {dailyBreakdown.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '15px 30px', fontWeight: '700', color: '#1e293b' }}>{new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td style={{ padding: '15px 30px' }}>
                       <span style={{ padding: '4px 12px', borderRadius: '100px', background: row.avgRank === 'DNS' ? '#f1f5f9' : '#fff7ed', color: row.avgRank === 'DNS' ? '#94a3b8' : '#ea580c', fontWeight: '800', fontSize: '13px' }}>
                         #{row.avgRank}
                       </span>
                    </td>
                    <td style={{ padding: '15px 30px' }}>
                      <span style={{ color: '#10b981', fontWeight: '800' }}>{row.improved > 0 ? `▲ ${row.improved}` : '—'}</span>
                    </td>
                    <td style={{ padding: '15px 30px' }}>
                      <span style={{ color: '#ef4444', fontWeight: '800' }}>{row.declined > 0 ? `▼ ${row.declined}` : '—'}</span>
                    </td>
                    <td style={{ padding: '15px 30px' }}>
                       <div style={{ width: '100px', height: '6px', background: '#f1f5f9', borderRadius: '100px', overflow: 'hidden' }}>
                          <div style={{ width: `${(row.improved / (row.improved + row.declined || 1)) * 100}%`, height: '100%', background: '#10b981' }}></div>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Matrix Comparison Table (Spreadsheet Style) */}
          <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', marginTop: '40px' }}>
             <div style={{ padding: '25px 30px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#1e293b' }}>📊 KEYWORD COMPARISON MATRIX</h3>
                  <select 
                    value={matrixView} 
                    onChange={(e) => setMatrixView(e.target.value)}
                    style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 12px', fontSize: '11px', fontWeight: '800', color: '#64748b', cursor: 'pointer', outline: 'none' }}
                  >
                    <option value="daily">Daily View</option>
                    <option value="weekly">Weekly View</option>
                  </select>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800' }}>PAGE // POSITION FORMAT</div>
             </div>
             <div style={{ overflowX: 'auto' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                 <thead>
                   <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                     <th style={{ padding: '12px 20px', textAlign: 'left', background: '#f8fafc', fontSize: '10px', fontWeight: '900', color: '#64748b', borderRight: '1px solid #f1f5f9', width: '200px', letterSpacing: '1px' }}>TARGETED KEYWORDS</th>
                     {matrixData.headers.map((date, i) => (
                       <th key={i} style={{ padding: '12px 10px', textAlign: 'center', background: i === matrixData.headers.length - 1 ? 'rgba(16, 185, 129, 0.05)' : 'transparent', fontSize: '10px', fontWeight: '900', color: i === matrixData.headers.length - 1 ? '#10b981' : '#94a3b8', borderRight: '1px solid #f1f5f9' }}>
                         {matrixView === 'daily' 
                           ? new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase()
                           : `WK ${i + 1}`
                         }
                         {matrixView === 'weekly' && <div style={{ fontSize: '8px', opacity: 0.6, marginTop: '2px' }}>{new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}</div>}
                       </th>
                     ))}
                   </tr>
                 </thead>
                <tbody>
                  {matrixData.rows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 20px', fontWeight: '800', color: '#334155', borderRight: '1px solid #f1f5f9', fontSize: '12px' }}>{row.text}</td>
                      {matrixData.headers.map((date, i) => {
                        const entry = keywords[idx].history?.find(h => h.date === date);
                        const currentRank = entry?.organic || 0;
                        
                        // Find previous available rank to compare
                        let prevRank = 0;
                        for (let j = i - 1; j >= 0; j--) {
                          const prevDate = matrixData.headers[j];
                          const prevEntry = keywords[idx].history?.find(h => h.date === prevDate);
                          if (prevEntry?.organic) {
                            prevRank = prevEntry.organic;
                            break;
                          }
                        }
                        
                        // If no prev rank in the 10-day matrix, look further back in history
                        if (prevRank === 0 && keywords[idx].history) {
                          const olderHistory = keywords[idx].history
                            .filter(h => h.date < matrixData.headers[0])
                            .sort((a, b) => new Date(b.date) - new Date(a.date));
                          if (olderHistory.length > 0) prevRank = olderHistory[0].organic;
                        }

                        let bgColor = 'transparent';
                        let textColor = '#1e293b';
                        if (currentRank > 0) {
                          if (prevRank === 0 || currentRank < prevRank) { 
                            // First entry or Improved
                            bgColor = '#dcfce7'; 
                            textColor = '#166534';
                          } else if (currentRank > prevRank) {
                            // Declined
                            bgColor = '#fee2e2'; 
                            textColor = '#991b1b';
                          } else {
                            // Stable
                            bgColor = '#fef9c3'; 
                            textColor = '#854d0e';
                          }
                        }

                        const page = currentRank > 0 ? Math.floor((currentRank - 1) / 10) + 1 : 0;
                        const pos = currentRank > 0 ? ((currentRank - 1) % 10) + 1 : 0;
                        const displayVal = currentRank > 0 ? `${page} // ${pos}` : '—';

                        return (
                          <td key={i} style={{ 
                            padding: '10px 10px', 
                            textAlign: 'center', 
                            fontWeight: '800', 
                            color: textColor, 
                            borderRight: '1px solid #f1f5f9', 
                            fontSize: '11px', 
                            background: bgColor 
                          }}>
                            {displayVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ProjectInsights;
