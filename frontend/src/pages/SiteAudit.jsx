import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/apiConfig';
import '../index.css';

// Error Boundary Component to prevent WSOD
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("Audit UI Error:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '100px 20px', textAlign: 'center' }}>
          <h2 style={{ color: '#ef4444' }}>⚠️ Something went wrong while rendering the report.</h2>
          <p>Please try scanning another URL or refresh the page.</p>
          <button onClick={() => window.location.reload()} className="pro-button" style={{ marginTop: '20px' }}>REFRESH PAGE</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const SiteAuditContent = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [scanStep, setScanStep] = useState(0);

  const scanSteps = [
    "Establishing secure connection...",
    "Crawling full HTML DOM tree...",
    "Auditing On-Page SEO...",
    "Analyzing Technical Architecture...",
    "Measuring Load Performance...",
    "Checking Mobile Usability...",
    "Verifying Social & Schema Tags...",
    "Generating Prioritized Recommendations..."
  ];

  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setScanStep(prev => (prev < scanSteps.length - 1 ? prev + 1 : prev));
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleAudit = async (e) => {
    if (e) e.preventDefault();
    if (!url) return;
    
    setIsLoading(true);
    setReport(null);
    setError(null);
    setScanStep(0);

    try {
      const res = await fetch(`${API_BASE_URL}/api/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `Server error: ${res.status}`);
      
      setTimeout(() => {
        setReport(data);
        setIsLoading(false);
      }, 500);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (grade?.startsWith('A')) return '#10b981';
    if (grade?.startsWith('B')) return '#3b82f6';
    if (grade?.startsWith('C')) return '#f59e0b';
    if (grade?.startsWith('D')) return '#ef4444';
    return '#64748b';
  };

  return (
    <div className="seoptimer-style" style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      <Helmet>
        <title>Professional SEO Audit | Ranking Anywhere Intelligence</title>
      </Helmet>

      {/* Header */}
      <nav style={{ padding: '15px 40px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width: '32px', height: '32px', background: '#2e5bff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '900' }}>R</div>
            <span style={{ fontWeight: '800', fontSize: '18px', color: '#1e293b' }}>Ranking Anywhere <span style={{ color: '#2e5bff' }}>PRO</span></span>
         </div>
         <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', fontWeight: '700', color: '#64748b', cursor: 'pointer' }}>LOGIN</button>
            <button onClick={() => navigate('/register')} style={{ background: '#2e5bff', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>FREE TRIAL</button>
         </div>
      </nav>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
        
        {!report && !isLoading && (
          <div style={{ textAlign: 'center', padding: '80px 0', animation: 'fadeIn 0.6s ease' }}>
             <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#1e293b', marginBottom: '20px', letterSpacing: '-1.5px' }}>Audit Your Website SEO</h1>
             <p style={{ fontSize: '18px', color: '#64748b', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
               Get a professional, comprehensive SEO audit of any URL in seconds. Built for SEO experts and agencies.
             </p>
             <form onSubmit={handleAudit} style={{ display: 'flex', gap: '10px', maxWidth: '650px', margin: '0 auto', background: '#fff', padding: '10px', borderRadius: '15px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
                <input 
                  type="text" 
                  placeholder="Enter website URL (e.g., example.com)" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  style={{ flex: 1, border: 'none', padding: '15px 20px', outline: 'none', fontSize: '16px', color: '#1e293b', fontWeight: '600' }}
                />
                <button type="submit" style={{ background: '#2e5bff', color: '#fff', border: 'none', padding: '0 30px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>QUICK AUDIT</button>
             </form>
             {error && <p style={{ color: '#ef4444', marginTop: '20px', fontWeight: '700' }}>⚠️ {error}</p>}
          </div>
        )}

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
             <div className="seoptimer-loader" style={{ width: '80px', height: '80px', border: '6px solid #e2e8f0', borderTop: '6px solid #2e5bff', borderRadius: '50%', margin: '0 auto 30px', animation: 'spin 1s linear infinite' }}></div>
             <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', marginBottom: '10px' }}>Analyzing {url}...</h2>
             <p style={{ color: '#64748b', fontSize: '18px', fontWeight: '600' }}>{scanSteps[scanStep]}</p>
          </div>
        )}

        {report && (
          <div style={{ animation: 'slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
            
            {/* Top Grade Hero */}
            <div style={{ background: '#fff', borderRadius: '24px', padding: '60px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '60px', marginBottom: '40px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
               <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '180px', height: '180px', borderRadius: '50%', border: `12px solid ${getGradeColor(report.grade)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', position: 'relative' }}>
                     <span style={{ fontSize: '72px', fontWeight: '900', color: '#1e293b' }}>{report.grade || '—'}</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Overall Grade</div>
               </div>
               <div>
                  <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', marginBottom: '20px' }}>Your Website Audit is Complete!</h2>
                  <p style={{ fontSize: '16px', color: '#64748b', lineHeight: '1.7', marginBottom: '30px' }}>
                    Your page is mostly optimized, but there are a few areas that need attention. We have analyzed <strong>{url}</strong> and provided actionable recommendations below.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px' }}>
                     {report.categories && Object.entries(report.categories).map(([key, cat]) => (
                        <div key={key} style={{ textAlign: 'center' }}>
                           <div style={{ width: '45px', height: '45px', borderRadius: '50%', border: `3px solid ${getGradeColor(cat.grade)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '14px', fontWeight: '900', color: '#1e293b' }}>{cat.grade}</div>
                           <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{cat.label}</div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Recommendations Section */}
            <div style={{ background: '#fff', borderRadius: '24px', padding: '40px', border: '1px solid #e2e8f0', marginBottom: '40px' }}>
               <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', marginBottom: '30px' }}>Recommendations</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {report.recommendations?.map((rec, i) => (
                     <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#f8fafc', borderRadius: '15px', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                           <div style={{ background: '#2e5bff', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '900' }}>{i + 1}</div>
                           <div>
                              <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>{rec.task}</div>
                              <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>{rec.category}</div>
                           </div>
                        </div>
                        <div style={{ padding: '6px 15px', background: rec.priority === 'High' ? '#fee2e2' : (rec.priority === 'Medium' ? '#fef9c3' : '#f1f5f9'), color: rec.priority === 'High' ? '#991b1b' : (rec.priority === 'Medium' ? '#854d0e' : '#64748b'), borderRadius: '100px', fontSize: '11px', fontWeight: '900' }}>{rec.priority.toUpperCase()} PRIORITY</div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Detailed Results (On-Page SEO) */}
            <div style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
               <div style={{ padding: '25px 40px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b' }}>On-Page SEO Results</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: `3px solid ${getGradeColor(report.categories?.seo?.grade)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#1e293b' }}>{report.categories?.seo?.grade || '—'}</div>
                  </div>
               </div>
               <div style={{ padding: '40px' }}>
                  
                  {/* Title Tag */}
                  <div style={{ display: 'flex', gap: '30px', marginBottom: '40px', paddingBottom: '40px', borderBottom: '1px solid #f1f5f9' }}>
                     <div style={{ fontSize: '24px' }}>{(report.details?.title?.length || 0) > 30 ? '✅' : '❌'}</div>
                     <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', marginBottom: '10px' }}>Title Tag</h4>
                        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '15px' }}>Your page has a Title Tag, but ideally it should be between 30 and 65 characters.</p>
                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', fontSize: '14px', color: '#1e293b', fontWeight: '700', border: '1px solid #f1f5f9' }}>{report.details?.title?.text || 'Missing'}</div>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', marginTop: '10px' }}>Length: {report.details?.title?.length || 0} characters</div>
                     </div>
                  </div>

                  {/* Meta Description */}
                  <div style={{ display: 'flex', gap: '30px', marginBottom: '40px', paddingBottom: '40px', borderBottom: '1px solid #f1f5f9' }}>
                     <div style={{ fontSize: '24px' }}>{(report.details?.description?.length || 0) > 70 ? '✅' : '❌'}</div>
                     <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', marginBottom: '10px' }}>Meta Description Tag</h4>
                        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '15px' }}>A Meta Description is important for search engines to understand the content of your page.</p>
                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>{report.details?.description?.text || 'Missing'}</div>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', marginTop: '10px' }}>Length: {report.details?.description?.length || 0} characters</div>
                     </div>
                  </div>

                  {/* Heading Tags */}
                  <div style={{ display: 'flex', gap: '30px' }}>
                     <div style={{ fontSize: '24px' }}>{report.details?.headings?.h1 === 1 ? '✅' : '⚠️'}</div>
                     <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', marginBottom: '10px' }}>Header Tag Usage</h4>
                        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>Your page is making use of Header Tags. We recommend using exactly one H1 tag per page.</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '15px' }}>
                           {[1,2,3,4,5,6].map(i => (
                              <div key={i} style={{ textAlign: 'center', background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                                 <div style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8' }}>H{i}</div>
                                 <div style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b' }}>{report.details?.headings?.all[`h${i}`]?.length || 0}</div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>

               </div>
            </div>

            {/* Final CTA */}
            <div style={{ marginTop: '50px', background: '#2e5bff', padding: '60px', borderRadius: '30px', textAlign: 'center', color: '#fff' }}>
               <h2 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '20px' }}>Improve Your Score with Ranking Anywhere</h2>
               <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
                 Unlock daily historical tracking, competitor insights, and advanced technical monitoring. Join thousands of SEO experts.
               </p>
               <button onClick={() => navigate('/register')} style={{ background: '#fff', color: '#2e5bff', border: 'none', padding: '15px 40px', borderRadius: '12px', fontSize: '18px', fontWeight: '900', cursor: 'pointer' }}>START 14-DAY FREE TRIAL</button>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

const SiteAudit = () => (
  <ErrorBoundary>
    <SiteAuditContent />
  </ErrorBoundary>
);

export default SiteAudit;
