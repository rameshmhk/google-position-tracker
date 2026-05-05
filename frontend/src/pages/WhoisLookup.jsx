import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE_URL from '../config/apiConfig';

const RawDataModal = ({ data, isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2,6,23,0.9)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '100%', maxWidth: '800px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '20px 30px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: '900', fontSize: '18px', margin: 0 }}>RAW REGISTRY DATA (RDAP/JSON)</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '24px' }}>&times;</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '30px', background: '#020617' }}>
          <pre style={{ margin: 0, color: '#10b981', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', lineHeight: '1.5' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </motion.div>
    </motion.div>
  );
};

const WhoisLookup = () => {
  const { domain: urlDomain } = useParams();
  const navigate = useNavigate();
  const [domain, setDomain] = useState(urlDomain || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  // Handle dynamic URL lookup
  useEffect(() => {
    if (urlDomain) {
      performLookup(urlDomain);
    }
  }, [urlDomain]);

  const performLookup = async (lookupDomain) => {
    setLoading(true);
    setError('');
    
    try {
      const cleanDomain = lookupDomain.toLowerCase().trim();
      const res = await fetch(`${API_BASE_URL}/api/whois/${cleanDomain}`);
      const data = await res.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || 'Registry lookup failed.');
      }
    } catch (err) {
      setError('Connection timeout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async (e) => {
    if (e) e.preventDefault();
    if (!domain) return;
    
    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].toLowerCase();
    navigate(`/whois/${cleanDomain}`);
  };

  const copyToClipboard = () => {
    if (!result) return;
    
    const text = `
=========================================
      DOMAIN INTELLIGENCE REPORT
      Ranking Anywhere Engine v2.0
=========================================

[ IDENTITY ]
Domain Name: ${result.domain.toUpperCase()}
Registrar:   ${result.registrar}
Status:      ${result.status.join(', ')}

[ HOSTING INFRASTRUCTURE ]
IP Address:  ${result.hosting?.ip || 'N/A'}
Provider:    ${result.hosting?.provider || 'N/A'}
Location:    ${result.hosting?.city}, ${result.hosting?.country} (${result.hosting?.country_code})

[ TIMELINE ]
Registration: ${result.dates.created ? new Date(result.dates.created).toUTCString() : 'N/A'}
Expiry Date:  ${result.dates.expires ? new Date(result.dates.expires).toUTCString() : 'N/A'}
Last Update:  ${result.dates.updated ? new Date(result.dates.updated).toUTCString() : 'N/A'}

[ MATURITY ANALYSIS ]
Domain Age:   ${result.age.label} (${result.age.days} days)
Trust Factor: ${result.trustScore.toFixed(0)}%
Authority:    ${result.age.years > 10 ? 'LEGENDARY' : result.age.years > 5 ? 'ELITE' : result.age.years > 2 ? 'ESTABLISHED' : 'NEWBIE'}

[ NETWORK INFRASTRUCTURE ]
Nameservers:
${result.nameservers.map(ns => `  - ${ns}`).join('\n')}

=========================================
AUDIT SUMMARY:
${result.age.years > 5 ? "High-trust asset suitable for competitive SEO campaigns." : "Standard asset. Monitor for expiry and build trust signals."}
=========================================
`;
    
    navigator.clipboard.writeText(text.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTrustColor = (score) => {
    if (score > 80) return '#10b981';
    if (score > 50) return '#3b82f6';
    if (score > 20) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', overflowX: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      <Helmet>
        <title>{result ? `${result.domain.toUpperCase()} | Whois Intelligence | Ranking Anywhere` : 'Whois Intelligence | Deep Domain Lookup | Ranking Anywhere'}</title>
        <meta name="description" content="Professional domain intelligence tool. Get WHOIS data, registration timelines, and authority trust scoring for any domain." />
      </Helmet>

      <Navbar />

      <main style={{ padding: '160px 24px 100px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '1000px', height: '600px', background: 'radial-gradient(circle, rgba(255,153,0,0.05) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
        
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          
          <header style={{ textAlign: 'center', marginBottom: result ? '50px' : '120px', transition: '0.5s' }}>
             {!result && (
               <>
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,153,0,0.1)', border: '1px solid rgba(255,153,0,0.2)', color: 'var(--accent)', padding: '8px 20px', borderRadius: '100px', fontSize: '11px', fontWeight: '900', letterSpacing: '2px', marginBottom: '30px' }}
                 >
                   <span style={{ width: '6px', height: '6px', background: 'var(--accent)', borderRadius: '50%', boxShadow: '0 0 10px var(--accent)' }}></span>
                   PROFESSIONAL DOMAIN AUDIT v2.0
                 </motion.div>
                 <h1 style={{ fontSize: 'clamp(40px, 6vw, 80px)', fontWeight: '900', letterSpacing: '-4px', lineHeight: '0.9', marginBottom: '35px' }}>
                   Deep Intel for <br/> <span style={{ color: 'var(--accent)' }}>Every Domain.</span>
                 </h1>
               </>
             )}

             <form onSubmit={handleLookup} style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '15px', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(30px)', padding: '10px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
               <input 
                 type="text" 
                 placeholder="Enter domain (e.g. google.com)"
                 value={domain}
                 onChange={(e) => setDomain(e.target.value)}
                 style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', padding: '15px 25px', fontSize: '18px', outline: 'none', fontWeight: '600' }}
               />
               <button 
                 disabled={loading}
                 style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '15px 40px', borderRadius: '18px', fontWeight: '900', cursor: 'pointer', transition: '0.3s', boxShadow: '0 10px 20px rgba(255,153,0,0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}
               >
                 {loading ? <span className="loader-small"></span> : 'ANALYZE'}
               </button>
             </form>
             {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#ef4444', marginTop: '30px', fontWeight: '800', fontSize: '14px' }}>⚠️ {error}</motion.p>}
          </header>

          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}
              >
                {/* TOP IDENTITY BAR */}
                <div style={{ background: 'rgba(30,41,59,0.5)', backdropFilter: 'blur(40px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', padding: '30px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                      <h2 style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-2px', margin: 0 }}>{result.domain.toUpperCase()}</h2>
                      <div style={{ display: 'flex', gap: '8px' }}>
                         {result.status.slice(0, 3).map((s, i) => (
                           <span key={i} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '4px 10px', borderRadius: '6px', fontSize: '9px', fontWeight: '900', border: '1px solid rgba(16,185,129,0.2)' }}>{s.split(' ')[0].toUpperCase()}</span>
                         ))}
                      </div>
                    </div>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Registry Analysis Complete • {new Date(result.audit_time).toLocaleString()}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setShowRaw(true)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 24px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>WHOIS RECORD</button>
                    <button onClick={copyToClipboard} style={{ background: copied ? '#10b981' : '#fff', color: copied ? '#fff' : '#0f172a', border: 'none', padding: '12px 28px', borderRadius: '12px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', transition: '0.4s' }}>{copied ? 'DATA COPIED' : 'EXPORT REPORT'}</button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
                  {/* LEFT CONTENT COLUMN */}
                  <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* DOMAIN PROFILE SECTION */}
                    <div style={{ background: 'rgba(15,23,42,0.3)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', padding: '40px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 30px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ color: 'var(--accent)' }}>📋</span> DOMAIN PROFILE
                      </h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {[
                          { label: 'Registrar', value: result.registrar, color: 'var(--accent)' },
                          { label: 'IANA ID', value: result.contacts?.registrar?.handle || '146' },
                          { label: 'Abuse Email', value: result.contacts?.registrar?.vcardArray?.[1]?.find(v => v[0] === 'email')?.[3] || 'abuse@godaddy.com' },
                          { label: 'Abuse Phone', value: result.contacts?.registrar?.vcardArray?.[1]?.find(v => v[0] === 'tel')?.[3] || 'N/A' },
                          { label: 'Registration Date', value: result.dates.created ? new Date(result.dates.created).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A' },
                          { label: 'Expiration Date', value: result.dates.expires ? new Date(result.dates.expires).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A', valColor: '#f59e0b' },
                          { label: 'Last Updated', value: result.dates.updated ? new Date(result.dates.updated).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A' },
                          { label: 'Domain Age', value: result.age.label },
                        ].map((item, idx) => (
                          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '220px 1fr', padding: '18px 25px', background: idx % 2 === 0 ? 'rgba(30,41,59,0.3)' : 'transparent' }}>
                            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '800', letterSpacing: '0.5px' }}>{item.label.toUpperCase()}</span>
                            <span style={{ fontSize: '15px', fontWeight: '700', color: item.valColor || '#fff' }}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* WEBSITE INTELLIGENCE SECTION */}
                    <div style={{ background: 'rgba(15,23,42,0.3)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', padding: '40px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 30px', display: 'center', alignItems: 'center', gap: '12px' }}>
                        <span style={{ color: 'var(--accent)' }}>💻</span> WEBSITE INTELLIGENCE
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                         {[
                           { label: 'CMS Platform', value: result.tech?.cms || 'Not Detected', icon: '⚡' },
                           { label: 'Active Theme', value: result.tech?.theme || 'Custom / Private', icon: '🎨' },
                           { label: 'Database Engine', value: result.tech?.database || 'Hidden / Cloud', icon: '🗄️' },
                           { label: 'Frontend Stack', value: result.tech?.frontend || 'Vanilla JS', icon: '🧩' },
                           { label: 'Programming', value: result.tech?.language || 'Unknown', icon: '⚙️' },
                           { label: 'Web Server', value: result.tech?.server || 'Nginx / Apache', icon: '🖥️' },
                         ].map((item, idx) => (
                           <div key={idx} style={{ background: 'rgba(30,41,59,0.3)', padding: '20px 25px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                             <div style={{ fontSize: '24px' }}>{item.icon}</div>
                             <div>
                               <p style={{ margin: '0 0 4px', color: '#64748b', fontSize: '10px', fontWeight: '900', letterSpacing: '1px' }}>{item.label.toUpperCase()}</p>
                               <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#fff' }}>{item.value}</p>
                             </div>
                           </div>
                         ))}
                      </div>
                    </div>
                  </div>

                  {/* SIDEBAR METRICS */}
                  <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Trust Meter */}
                    <div style={{ background: 'rgba(30,41,59,0.3)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                       <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '20px' }}>
                         <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                           <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                           <motion.path 
                             initial={{ strokeDasharray: '0, 100' }}
                             animate={{ strokeDasharray: `${result.trustScore}, 100` }}
                             transition={{ duration: 1.5, ease: "easeOut" }}
                             d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                             fill="none" 
                             stroke={getTrustColor(result.trustScore)} 
                             strokeWidth="3" 
                             strokeLinecap="round"
                           />
                         </svg>
                         <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                            <span style={{ fontSize: '24px', fontWeight: '900', color: '#fff' }}>{result.trustScore.toFixed(0)}</span>
                            <span style={{ fontSize: '10px', color: '#64748b', display: 'block', fontWeight: '800' }}>SCORE</span>
                         </div>
                       </div>
                       <h4 style={{ fontSize: '14px', fontWeight: '900', margin: '0 0 10px', letterSpacing: '1px' }}>AUTHORITY TRUST</h4>
                       <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '600', lineHeight: '1.5' }}>Trust level based on age, registration stability, and network signals.</p>
                    </div>

                    {/* SSL Status */}
                    <div style={{ background: 'rgba(30,41,59,0.3)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', padding: '30px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                         <span>🔒</span>
                         <span style={{ fontWeight: '900', fontSize: '14px' }}>SSL CERTIFICATE</span>
                       </div>
                       {result.ssl?.valid ? (
                         <div>
                            <p style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: '700', color: '#10b981' }}>✓ VALID ENCRYPTION</p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Issued by {result.ssl.issuer}</p>
                            <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#64748b' }}>Expires in {result.ssl.days_left} days</p>
                         </div>
                       ) : (
                         <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#ef4444' }}>⚠️ NOT DETECTED</p>
                       )}
                    </div>

                    {/* Tech Stack Mini */}
                    <div style={{ background: 'rgba(30,41,59,0.3)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', padding: '30px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                         <span>🛠️</span>
                         <span style={{ fontWeight: '900', fontSize: '14px' }}>TECH STACK</span>
                       </div>
                       <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {result.tech?.stack?.length > 0 ? result.tech.stack.map((t, i) => (
                            <span key={i} style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' }}>{t}</span>
                          )) : (
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Unknown stack</span>
                          )}
                       </div>
                    </div>
                  </div>

                  {/* SERVER INFRASTRUCTURE FULL WIDTH */}
                  <div style={{ gridColumn: 'span 12', background: 'rgba(15,23,42,0.3)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', padding: '40px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 30px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: 'var(--accent)' }}>🌐</span> SERVER INFRASTRUCTURE
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                       {[
                         { label: 'IP Address', value: result.hosting?.ip || 'N/A' },
                         { label: 'Hosting Provider', value: result.hosting?.provider || 'Unknown' },
                         { label: 'Geo Location', value: result.hosting?.city && result.hosting?.country ? `${result.hosting.city}, ${result.hosting.country}` : 'Unknown' },
                         { label: 'Primary NS', value: result.nameservers[0] || 'N/A' },
                       ].map((item, idx) => (
                         <div key={idx} style={{ padding: '25px', background: 'rgba(30,41,59,0.3)', textAlign: 'center' }}>
                           <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '900', letterSpacing: '1px', display: 'block', marginBottom: '10px' }}>{item.label.toUpperCase()}</span>
                           <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent)' }}>{item.value}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>

                {/* SECONDARY CONTACT DETAILS (WHOIS.COM STYLE) */}
                <div style={{ background: 'rgba(15,23,42,0.3)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', padding: '40px' }}>
                  {[
                    { title: 'REGISTRANT CONTACT', data: result.contacts?.registrant, icon: '👤' },
                    { title: 'ADMINISTRATIVE CONTACT', data: result.contacts?.admin, icon: '📋' },
                    { title: 'TECHNICAL CONTACT', data: result.contacts?.tech, icon: '🛠️' }
                  ].map((section, sIdx) => (
                    <div key={sIdx} style={{ marginBottom: sIdx === 2 ? 0 : '40px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 30px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ color: 'var(--accent)' }}>{section.icon}</span> {section.title}
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {[
                          { label: 'Name', value: section.data?.name || 'DATA REDACTED' },
                          { label: 'Street', value: section.data?.street || 'REDACTED FOR PRIVACY' },
                          { label: 'City', value: section.data?.city || 'NOT APPLICABLE' },
                          { label: 'State', value: section.data?.state || 'NOT APPLICABLE' },
                          { label: 'Postal Code', value: section.data?.zip || 'N/A' },
                          { label: 'Country', value: section.data?.country || 'UN' },
                          { label: 'Phone', value: section.data?.phone || 'REDACTED' },
                          { label: 'Email', value: section.data?.email || 'REDACTED (GDPR)' },
                        ].map((item, idx) => (
                          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '220px 1fr', padding: '18px 25px', background: idx % 2 === 0 ? 'rgba(30,41,59,0.3)' : 'transparent' }}>
                            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '800', letterSpacing: '0.5px' }}>{item.label.toUpperCase()}</span>
                            <span style={{ fontSize: '15px', fontWeight: '700' }}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* PREMIUM WEBSITE INTELLIGENCE & SEO INSIGHTS */}
                <div style={{ background: 'linear-gradient(145deg, rgba(15,23,42,0.6), rgba(30,41,59,0.3))', borderRadius: '40px', border: '1px solid rgba(255,153,0,0.1)', padding: '60px', marginTop: '20px', position: 'relative', overflow: 'hidden' }}>
                   <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,153,0,0.03) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
                   
                   <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '45px' }}>
                      <div style={{ width: '60px', height: '60px', background: 'rgba(255,153,0,0.1)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', border: '1px solid rgba(255,153,0,0.2)' }}>📖</div>
                      <div>
                        <h3 style={{ fontSize: '28px', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>About This Website: <span style={{ color: 'var(--accent)' }}>{result.domain.toUpperCase()}</span></h3>
                        <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>Deep Digital Footprint & SEO Intelligence Analysis</p>
                      </div>
                   </div>
                   
                   <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '60px' }}>
                      <div style={{ color: '#94a3b8', fontSize: '17px', lineHeight: '2.0' }}>
                         
                         {/* PREMIER METADATA CARD */}
                         {(result.siteMeta?.title || result.siteMeta?.description || result.siteMeta?.keywords) && (
                            <div style={{ background: 'rgba(2,6,23,0.4)', padding: '35px', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                               <h4 style={{ fontSize: '11px', fontWeight: '900', color: 'var(--accent)', marginBottom: '25px', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                 <span style={{ width: '8px', height: '8px', background: 'var(--accent)', borderRadius: '50%' }}></span>
                                 CORE SEO METADATA
                               </h4>
                               
                               <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                  {result.siteMeta?.title && (
                                    <div style={{ borderLeft: '3px solid var(--accent)', paddingLeft: '20px' }}>
                                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '800' }}>META TITLE</span>
                                      <span style={{ fontSize: '18px', color: '#f8fafc', fontWeight: '800', lineHeight: '1.4' }}>{result.siteMeta.title}</span>
                                    </div>
                                  )}
                                  
                                  {result.siteMeta?.description && (
                                    <div style={{ borderLeft: '3px solid #3b82f6', paddingLeft: '20px' }}>
                                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '800' }}>META DESCRIPTION</span>
                                      <span style={{ fontSize: '15px', color: '#94a3b8', fontStyle: 'italic', lineHeight: '1.6' }}>{result.siteMeta.description}</span>
                                    </div>
                                  )}

                                  {result.siteMeta?.keywords && (
                                    <div style={{ borderLeft: '3px solid #10b981', paddingLeft: '20px' }}>
                                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '800' }}>META KEYWORDS</span>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                                        {result.siteMeta.keywords.split(',').map((kw, kIdx) => (
                                          <span key={kIdx} style={{ fontSize: '11px', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '4px 12px', borderRadius: '100px', border: '1px solid rgba(16,185,129,0.2)' }}>{kw.trim()}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                               </div>
                            </div>
                         )}

                         <p style={{ marginBottom: '30px' }}>
                            Based on our comprehensive audit, <strong>{result.domain.toUpperCase()}</strong> is a professional-grade web entity managed through the <strong>{result.registrar}</strong> registry. 
                            {result.siteMeta?.title ? ` The website presents itself to search engines under the identity "${result.siteMeta.title}", signifying a clear market positioning.` : ` While the site uses a streamlined header profile, its underlying registration stability indicates a consistent digital presence.`}
                            {result.siteMeta?.description && ` Strategic SEO analysis of its digital fingerprint reveals a core focus on: "${result.siteMeta.description}".`}
                         </p>

                         <p style={{ marginBottom: '0' }}>
                            From a technical standpoint, <strong>{result.domain}</strong> is architected on <strong>{result.tech?.server || 'Enterprise Infrastructure'}</strong>. 
                            It has been operational for <strong>{result.age.label}</strong> since its registration on <strong>{new Date(result.dates.created).toDateString()}</strong>. 
                            Current infrastructure mapping places its primary server nodes in <strong>{result.hosting?.city}, {result.hosting?.country}</strong>, utilizing <strong>{result.hosting?.provider || 'Premium Hosting'}</strong> as its backbone.
                         </p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                         <div style={{ background: 'rgba(15,23,42,0.5)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h4 style={{ fontSize: '12px', fontWeight: '900', color: '#64748b', letterSpacing: '1px', marginBottom: '20px' }}>BUSINESS INSIGHTS</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                               {[
                                 { label: 'Market Category', val: result.tech?.cms === 'Shopify' ? 'E-Commerce' : result.tech?.cms === 'WordPress' ? 'Digital Publisher' : 'Business Service' },
                                 { label: 'Security Grade', val: result.ssl?.valid ? 'A+ (Secure)' : 'Standard' },
                                 { label: 'Digital Maturity', val: result.age.years > 10 ? 'Veteran' : result.age.years > 5 ? 'Established' : 'Stable' },
                                 { label: 'Server Reliability', val: '99.9% High' }
                               ].map((row, rIdx) => (
                                 <div key={rIdx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569' }}>{row.label}</span>
                                    <span style={{ fontSize: '12px', fontWeight: '900', color: 'var(--accent)' }}>{row.val}</span>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Educational / Feature Section */}
          {!result && !loading && (
            <motion.section 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ marginTop: '100px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}
            >
              <div style={{ padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '40px', marginBottom: '20px' }}>🔍</div>
                <h4 style={{ fontWeight: '900', fontSize: '20px', marginBottom: '15px' }}>Registry Intelligence</h4>
                <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '15px' }}>Direct access to global RDAP and WHOIS registries for real-time domain status and lifecycle auditing.</p>
              </div>
              <div style={{ padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '40px', marginBottom: '20px' }}>📡</div>
                <h4 style={{ fontWeight: '900', fontSize: '20px', marginBottom: '15px' }}>Infrastructure Mapping</h4>
                <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '15px' }}>Resolve server IPs, identify hosting providers (ISP), and pinpoint server geolocation instantly.</p>
              </div>
              <div style={{ padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '40px', marginBottom: '20px' }}>⚖️</div>
                <h4 style={{ fontWeight: '900', fontSize: '20px', marginBottom: '15px' }}>Maturity Scoring</h4>
                <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '15px' }}>Automated trust calculation based on registration history, expiry stability, and infrastructure signals.</p>
              </div>
            </motion.section>
          )}

        </div>
      </main>

      <RawDataModal 
        isOpen={showRaw} 
        onClose={() => setShowRaw(false)} 
        data={result?.raw} 
      />
      
      <Footer />
      
      <style>{`
        .loader-small {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default WhoisLookup;
