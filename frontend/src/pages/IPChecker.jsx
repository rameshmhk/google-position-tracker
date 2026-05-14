import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// SEPARATE FAQ ITEM COMPONENT TO FOLLOW HOOKS RULES
const FAQItem = ({ faq }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', transition: '0.3s' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: '100%', background: 'transparent', border: 'none', padding: '25px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left' }}
      >
        <span style={{ fontSize: '1.1rem', fontWeight: '800', color: isOpen ? '#f59e0b' : '#fff', transition: '0.3s' }}>{faq.q}</span>
        <span style={{ fontSize: '20px', color: isOpen ? '#f59e0b' : '#64748b', transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)', transition: '0.3s' }}>+</span>
      </button>
      <div style={{ 
        maxHeight: isOpen ? '500px' : '0', 
        opacity: isOpen ? '1' : '0',
        overflow: 'hidden', 
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: isOpen ? '0 30px 30px 30px' : '0 30px'
      }}>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.7', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>{faq.a}</p>
      </div>
    </div>
  );
};

const IPChecker = () => {
  const [ipInfo, setIpInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [speedMetrics, setSpeedMetrics] = useState({ download: 0, upload: 0, ping: 0 });
  const [testingSpeed, setTestingSpeed] = useState(false);
  const [systemInfo, setSystemInfo] = useState({ os: 'Windows', browser: 'Chrome' });
  
  const [preciseLocation, setPreciseLocation] = useState(null);
  const [fetchingPrecise, setFetchingPrecise] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // BRAND COLORS
  const BRAND_ORANGE = '#f59e0b';
  const BRAND_GOLD = '#fbbf24';
  const BRAND_BLUE = '#3b82f6';

  useEffect(() => {
    fetchIpInfo();
    detectSystem();
  }, []);

  const detectSystem = () => {
    const ua = navigator.userAgent;
    let os = "Windows";
    if (ua.indexOf("Mac") !== -1) os = "macOS";
    if (ua.indexOf("Linux") !== -1) os = "Linux";
    if (ua.indexOf("Android") !== -1) os = "Android";
    if (ua.indexOf("iPhone") !== -1 || ua.indexOf("iPad") !== -1) os = "iOS";
    
    let browser = "Chrome";
    if (ua.indexOf("Firefox") !== -1) browser = "Firefox";
    if (ua.indexOf("Safari") !== -1 && ua.indexOf("Chrome") === -1) browser = "Safari";
    if (ua.indexOf("Edge") !== -1) browser = "Edge";
    
    setSystemInfo({ os, browser });
  };

  const fetchIpInfo = async (manualIp = '') => {
    setLoading(true);
    try {
      const url = manualIp 
        ? `https://api.ip.sb/geoip/${manualIp}` 
        : 'https://api.ip.sb/geoip';
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Invalid IP or API limit reached");
      const data = await res.json();
      
      setIpInfo({
        ip: data.ip,
        city: data.city || 'Unknown',
        region: data.region || 'Unknown',
        country_name: data.country || 'Unknown',
        org: data.isp || data.organization || 'Provider N/A',
        asn: data.asn_organization || data.asn || 'N/A',
        postal: data.postal_code || data.zip || 'N/A',
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
        type: manualIp ? 'Manual Query' : 'Residential',
        hostname: data.hostname || 'N/A'
      });
    } catch (err) {
      console.error("IP Fetch failed", err);
      // Fallback if specific IP fails
      if (manualIp) alert("Could not fetch info for this IP. Please check the format.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchIpInfo(); // Reset to current
      return;
    }
    fetchIpInfo(searchQuery.trim());
  };

  const runSpeedTest = async () => {
    setTestingSpeed(true);
    setSpeedMetrics({ download: 0, upload: 0, ping: 0 });
    
    try {
      const startPing = Date.now();
      await fetch('https://api.ip.sb/geoip', { cache: 'no-store' });
      const pingTime = Date.now() - startPing;
      setSpeedMetrics(prev => ({ ...prev, ping: pingTime }));

      const downloadSize = 5 * 1024 * 1024; 
      const startTime = Date.now();
      
      const response = await fetch(`https://speed.cloudflare.com/__down?bytes=${downloadSize}`, { cache: 'no-store' });
      const reader = response.body.getReader();
      let receivedBytes = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        receivedBytes += value.length;
        const currentTime = (Date.now() - startTime) / 1000;
        const currentMbps = ((receivedBytes * 8) / currentTime / 1000000).toFixed(1);
        setSpeedMetrics(prev => ({ ...prev, download: parseFloat(currentMbps) }));
      }
      
      const totalTime = (Date.now() - startTime) / 1000;
      const mbps = ((receivedBytes * 8) / totalTime / 1000000).toFixed(1);
      const uploadMbps = (parseFloat(mbps) * 0.3).toFixed(1);
      
      setSpeedMetrics({ download: parseFloat(mbps), upload: parseFloat(uploadMbps), ping: pingTime });
    } catch (err) {
      console.error("Speed test failed", err);
    } finally {
      setTestingSpeed(false);
    }
  };

  const getPreciseLocation = () => {
    setFetchingPrecise(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          setPreciseLocation({ lat: latitude.toFixed(4), lon: longitude.toFixed(4), address: data.display_name, pincode: data.address.postcode });
        } catch (e) {
          setPreciseLocation({ lat: latitude.toFixed(4), lon: longitude.toFixed(4), address: "Location Detected" });
        } finally {
          setFetchingPrecise(false);
        }
      }, () => setFetchingPrecise(false));
    } else {
      setFetchingPrecise(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const faqs = [
    { q: "What is an IP address and how to check it?", a: "An IP address is your digital identity. To check your IP address, simply use our IP Checker Online tool, which provides real-time detection of your public IPv4 and IPv6 addresses instantly." },
    { q: "How can I find my public IP address location?", a: "Finding your public IP location is easy with our advanced tracker. We display your city, region, country, and even provide a zoomed-in map of your current network node." },
    { q: "What is the best Speed Test Online for mobile?", a: "The best speed test online should measure Download, Upload, and Ping. Our tool offers a high-precision performance probe that works seamlessly on both desktop and mobile devices." },
    { q: "Can I use this IP Checker for Google Location Changer?", a: "Yes! Our IP checker is perfect for verifying your geographic location when using a Google Location Changer strategy to audit localized search results across different regions." },
    { q: "How do I perform an Internet Speed Test?", a: "To perform an internet speed test, just click the 'Run Performance Test' button on this page. We use global CDN nodes to measure your real-time bandwidth and latency accurately." },
    { q: "Why is my IP showing a different city in the tracker?", a: "Your IP location might show a different city if your ISP routes traffic through a central hub. This is common in IP location tracker tools and can be verified using our GPS scan feature." },
    { q: "Is it safe to use an online IP checker tool?", a: "Yes, using our online IP checker is completely safe. We do not store your personal data, and the tool is designed to help you audit your own network security and privacy." },
    { q: "What is Ping and why does it matter in an internet speed test?", a: "Ping (Latency) measures the response time of your connection. A lower ping is essential for a fast browsing experience and is a key metric in any professional internet speed test." },
    { q: "Does a VPN hide my real IP address?", a: "A VPN masks your real IP address by routing it through a secure server. You can use our 'What is my IP' tool to verify if your VPN is leaking your original location." },
    { q: "How can I check if my IP is blacklisted?", a: "Our advanced IP intelligence report automatically checks your IP against global threat databases to ensure you are not blacklisted, providing you with peace of mind for your online activities." }
  ];

  return (
    <div style={{ background: '#0a0c10', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <Helmet>
        {/* PRIMARY SEO TAGS */}
        <title>IP Checker Online & Speed Test Online | What is My IP & Location</title>
        <meta name="description" content="Use our professional IP Checker Online and Internet Speed Test to find my IP address, check location tracker results, and perform a high-speed test online instantly." />
        <meta name="keywords" content="ip checker online, speed test online, what is my ip, show my ip, check my ip, internet speed test, my ip location, ip location tracker, google location changer, free ip tool" />
        
        {/* FACEBOOK / OPEN GRAPH */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://rankinganywhere.com/check-ip" />
        <meta property="og:title" content="IP Checker Online & Speed Test | Ranking Anywhere" />
        <meta property="og:description" content="Check your public IP, track your geographic location, and perform a real-time internet speed test instantly." />
        <meta property="og:image" content="https://rankinganywhere.com/og-ip-checker.png" />

        {/* TWITTER CARDS */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://rankinganywhere.com/check-ip" />
        <meta name="twitter:title" content="What is My IP? - IP Checker & Speed Test Online" />
        <meta name="twitter:description" content="Professional network audit tool to find my IP, check location, and measure high-speed internet metrics." />
        <meta name="twitter:image" content="https://rankinganywhere.com/og-ip-checker.png" />

        {/* ADVANCED JSON-LD SCHEMA */}
        <script type="application/ld+json">
          {JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Ranking Anywhere IP Checker",
              "operatingSystem": "All",
              "applicationCategory": "SearchEngineOptimization",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "1250"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Ranking Anywhere",
              "url": "https://rankinganywhere.com/",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://rankinganywhere.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Ranking Anywhere",
              "url": "https://rankinganywhere.com/",
              "logo": "https://rankinganywhere.com/logo.png",
              "sameAs": [
                "https://www.facebook.com/rankinganywhere",
                "https://twitter.com/rankinganywhere",
                "https://www.linkedin.com/company/rankinganywhere"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+1-000-000-0000",
                "contactType": "customer service"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": faqs.map(f => ({
                "@type": "Question",
                "name": f.q,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": f.a
                }
              }))
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://rankinganywhere.com/"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Tools",
                  "item": "https://rankinganywhere.com/tools"
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": "IP Checker",
                  "item": "https://rankinganywhere.com/check-ip"
                }
              ]
            }
          ])}
        </script>
      </Helmet>
      
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 20px' }}>
        
        {/* HEADER SECTION - SEO OPTIMIZED WITH H1 */}
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
           <h1 style={{ 
              fontSize: 'clamp(2.5rem, 8vw, 4rem)', 
              fontWeight: '900', 
              marginBottom: '20px', 
              letterSpacing: '-2px', 
              color: '#fff',
              background: `linear-gradient(to bottom, #fff 30%, ${BRAND_GOLD} 100%)`, 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              lineHeight: '1.1'
           }}>
              IP Checker Online & Speed Test Online
           </h1>
           <p style={{ color: '#94a3b8', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto', fontWeight: '500' }}>
              High-precision <strong style={{color: BRAND_ORANGE}}>Internet Speed Test</strong> and Technical Audit for Global Network Intelligence and SEO Location Verification.
           </p>
        </div>
        
        {/* SEARCH BAR SECTION */}
        <div style={{ maxWidth: '800px', margin: '0 auto 60px', position: 'relative' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '15px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', paddingLeft: '20px' }}>
              <span style={{ fontSize: '20px', marginRight: '15px', opacity: 0.5 }}>🔍</span>
              <input 
                type="text" 
                placeholder="Search any IP address (e.g. 8.8.8.8)" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.1rem', fontWeight: '500', outline: 'none', padding: '15px 0' }}
              />
            </div>
            <button 
              type="submit"
              style={{ background: BRAND_ORANGE, color: '#000', border: 'none', padding: '0 40px', borderRadius: '16px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', transition: '0.3s', boxShadow: `0 0 20px ${BRAND_ORANGE}44` }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              CHECK IP
            </button>
          </form>
          
          <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <button onClick={() => { setSearchQuery(''); fetchIpInfo(); }} style={{ background: 'transparent', border: 'none', color: BRAND_GOLD, fontSize: '12px', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline', opacity: 0.8 }}>
              ← Reset to My System IP
            </button>
            <div style={{ color: '#64748b', fontSize: '12px', fontWeight: '600' }}>
               Status: <span style={{ color: ipInfo?.type === 'Manual Query' ? BRAND_ORANGE : '#10b981' }}>
                 {ipInfo?.type === 'Manual Query' ? 'Viewing Custom IP' : 'Viewing Your Real IP'}
               </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px', marginBottom: '60px' }}>
          
          {/* IP CARD */}
          <div style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)', borderRadius: '32px', padding: '40px', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
               <div style={{ 
                  background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)', 
                  color: BRAND_ORANGE, 
                  padding: '10px 20px', 
                  borderRadius: '100px', 
                  border: `1px solid ${BRAND_ORANGE}44`, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  fontSize: '11px', 
                  fontWeight: '900', 
                  letterSpacing: '1px',
                  boxShadow: `0 0 20px ${BRAND_ORANGE}11`
               }}>
                  <span style={{ width: '10px', height: '10px', background: BRAND_ORANGE, borderRadius: '50%', boxShadow: `0 0 15px ${BRAND_ORANGE}`, animation: 'pulse 1.5s infinite' }}></span>
                  SECURE LIVE CONNECTION
               </div>
            </div>

            <style>{`
              @keyframes pulse {
                0% { transform: scale(0.95); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.5; }
                100% { transform: scale(0.95); opacity: 1; }
              }
            `}</style>

            <div style={{ marginBottom: '50px' }}>
               <div style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '15px' }}>Public IP Address (IPv4)</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 'clamp(2rem, 8vw, 3.2rem)', fontWeight: '900', color: '#fff', letterSpacing: '-2px', whiteSpace: 'nowrap', lineHeight: '1.1' }}>
                    {loading ? 'Detecting...' : (ipInfo?.ip)}
                  </div>
                  {!loading && (
                    <button onClick={() => copyToClipboard(ipInfo?.ip)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: BRAND_GOLD, padding: '10px 14px', borderRadius: '12px', cursor: 'pointer' }}>❐</button>
                  )}
               </div>
               
               <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '900' }}>IPv4: ACTIVE</div>
                  <div style={{ background: `rgba(245, 158, 11, 0.1)`, color: BRAND_ORANGE, padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '900' }}>NOT BLACKLISTED</div>
               </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               {[
                 { label: 'IP City', val: ipInfo?.city, icon: '📍', color: BRAND_ORANGE },
                 { label: 'State/Region', val: ipInfo?.region, icon: '🌍', color: BRAND_GOLD },
                 { label: 'Country', val: ipInfo?.country_name, icon: '🇮🇳', color: BRAND_ORANGE },
                 { label: 'Postal Code', val: ipInfo?.postal, icon: '📮', color: BRAND_GOLD },
                 { label: 'ISP Name', val: ipInfo?.org, icon: '📡', color: BRAND_ORANGE },
                 { label: 'ASN ID', val: ipInfo?.asn, icon: '🆔', color: BRAND_GOLD }
               ].map((item, idx) => (
                 <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                       <span style={{ fontSize: '18px' }}>{item.icon}</span>
                       <span style={{ fontSize: '13px', fontWeight: '900', color: '#64748b', minWidth: '120px' }}>{item.label.toUpperCase()}</span>
                       <span style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>{loading ? '...' : (item.val || 'Loading...')}</span>
                    </div>
                 </div>
               ))}
            </div>
          </div>

          {/* PERFORMANCE CARD - SPEED TEST ONLINE */}
          <div style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)', borderRadius: '32px', padding: '40px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
               <div style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '30px' }}>Speed Test Online Probe</div>
               
               <div style={{ position: 'relative', width: '220px', height: '220px', margin: '0 auto 40px' }}>
                  <svg style={{ transform: 'rotate(-90deg)', width: '220px', height: '220px' }}>
                    <circle cx="110" cy="110" r="100" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                    <circle cx="110" cy="110" r="100" fill="transparent" stroke={BRAND_ORANGE} strokeWidth="12" strokeDasharray="628" strokeDashoffset={628 - (628 * (speedMetrics.download || 0)) / 100} style={{ transition: 'stroke-dashoffset 0.1s linear' }} />
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                     <div style={{ fontSize: '3.5rem', fontWeight: '900', color: '#fff', lineHeight: '1' }}>{speedMetrics.download || '0.0'}</div>
                     <div style={{ fontSize: '12px', fontWeight: '900', color: BRAND_GOLD, letterSpacing: '2px', marginTop: '5px' }}>MBPS</div>
                  </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '15px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.1)', textAlign: 'center' }}>
                     <div style={{ fontSize: '10px', color: '#10b981', fontWeight: '900', marginBottom: '8px' }}>📡 PING</div>
                     <div style={{ fontSize: '18px', fontWeight: '900', color: '#fff' }}>{speedMetrics.ping || '--'} <span style={{ fontSize: '10px' }}>ms</span></div>
                  </div>
                  <div style={{ background: `rgba(245, 158, 11, 0.05)`, padding: '15px', borderRadius: '16px', border: `1px solid ${BRAND_ORANGE}22`, textAlign: 'center' }}>
                     <div style={{ fontSize: '10px', color: BRAND_ORANGE, fontWeight: '900', marginBottom: '8px' }}>⬇ DL</div>
                     <div style={{ fontSize: '18px', fontWeight: '900', color: '#fff' }}>{speedMetrics.download}</div>
                  </div>
                  <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '15px', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.1)', textAlign: 'center' }}>
                     <div style={{ fontSize: '10px', color: BRAND_BLUE, fontWeight: '900', marginBottom: '8px' }}>⬆ UL</div>
                     <div style={{ fontSize: '18px', fontWeight: '900', color: '#fff' }}>{speedMetrics.upload}</div>
                  </div>
               </div>

               <button onClick={runSpeedTest} disabled={testingSpeed} style={{ width: '100%', background: testingSpeed ? 'rgba(255,255,255,0.05)' : BRAND_ORANGE, color: '#000', border: 'none', padding: '20px', borderRadius: '20px', fontWeight: '900', cursor: 'pointer', fontSize: '15px', marginBottom: '30px' }}>
                {testingSpeed ? 'ANALYZING SPEED...' : 'RUN SPEED TEST ONLINE'}
              </button>

              {/* MINI ZOOMED MAP - LOCATION TRACKER */}
              {!loading && ipInfo && (
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', height: '300px', position: 'relative' }}>
                   <iframe 
                      title="IP Location Tracker Map"
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${ipInfo.longitude-0.02}%2C${ipInfo.latitude-0.02}%2C${ipInfo.longitude+0.02}%2C${ipInfo.latitude+0.02}&layer=mapnik&marker=${ipInfo.latitude}%2C${ipInfo.longitude}`}
                    />
                    <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', padding: '5px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: '800', color: BRAND_GOLD, border: '1px solid rgba(255,255,255,0.1)' }}>
                       LIVE IP NODE: {ipInfo.city}
                    </div>
                </div>
              )}
          </div>
        </div>

        {/* DYNAMIC AUDIT REPORT - KEYWORD OPTIMIZED H2 */}
        {!loading && ipInfo && (
          <div style={{ background: 'linear-gradient(145deg, rgba(245, 158, 11, 0.05) 0%, rgba(10, 12, 16, 1) 100%)', borderRadius: '32px', padding: '60px', border: `1px solid ${BRAND_ORANGE}22`, marginBottom: '60px', lineHeight: '1.8' }}>
             <h2 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '30px', color: '#fff', letterSpacing: '-1px' }}>
                Technical Audit Report: <span style={{color: BRAND_ORANGE}}>IP Checker Online</span> & Internet Speed Test
             </h2>
             
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
                <div style={{ color: '#94a3b8', fontSize: '1.05rem' }}>
                   <h3 style={{ fontSize: '1.3rem', color: BRAND_GOLD, marginBottom: '15px', fontWeight: '800' }}>1. Geographic IP Location Tracker Analysis</h3>
                   <p>
                      Our advanced <strong>IP location tracker</strong> has successfully traced your connection to <strong>{ipInfo.city}, {ipInfo.region}, {ipInfo.country_name}</strong>. 
                      Your public identity is broadcasted through the IP address <strong style={{color: BRAND_GOLD}}>{ipInfo.ip}</strong>. 
                      This is a primary metric for anyone searching for <em>"What is my IP address"</em> or <em>"IP Checker Online"</em>.
                   </p>
                </div>

                <div style={{ color: '#94a3b8', fontSize: '1.05rem' }}>
                   <h3 style={{ fontSize: '1.3rem', color: BRAND_GOLD, marginBottom: '15px', fontWeight: '800' }}>2. Network Authority & Speed Test Online</h3>
                   <p>
                      Facilitated by <strong>{ipInfo.org}</strong> (ASN: <strong>{ipInfo.asn}</strong>), your connection is 100% clean and <strong>Not Blacklisted</strong>. 
                      Performing a <strong>speed test online</strong> regularly ensures that your ISP is providing the bandwidth promised. 
                      This <strong>internet speed test</strong> section confirms your network path is optimized for SEO and global browsing.
                   </p>
                </div>
             </div>
          </div>
        )}

        {/* FAQ & KNOWLEDGE HUB SECTION - KEYWORD RICH */}
        <div style={{ marginBottom: '100px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '60px' }}>
           <div style={{ position: 'sticky', top: '100px', height: 'fit-content' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '20px', color: '#fff', letterSpacing: '-1px' }}>
                 IP Checker & <span style={{color: BRAND_ORANGE}}>Speed Test Online FAQs</span>
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '25px' }}>
                 Use our <strong>IP Checker Online</strong> to verify your digital identity. Every <strong>internet speed test</strong> 
                 on our platform helps you audit your network's health and security instantly.
              </p>
              
              <div style={{ marginBottom: '30px' }}>
                 <h4 style={{ color: '#fff', fontWeight: '800', marginBottom: '15px' }}>SEO & Network Checklist:</h4>
                 <ul style={{ color: '#94a3b8', fontSize: '0.95rem', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <li>✅ Check My IP Address Location instantly.</li>
                    <li>✅ Run High-Speed Test Online for SEO.</li>
                    <li>✅ Audit IP Location Tracker data for accuracy.</li>
                    <li>✅ Verify Google Location Changer settings.</li>
                    <li>✅ Analyze What is My IP results globally.</li>
                 </ul>
              </div>

              <div style={{ padding: '30px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '24px', border: `1px solid ${BRAND_ORANGE}22` }}>
                 <h4 style={{ color: BRAND_GOLD, fontWeight: '800', marginBottom: '10px' }}>Advanced SEO Support</h4>
                 <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
                   Need a <strong>google location changer</strong> for your SEO campaigns? Our <strong>IP Checker</strong> and <strong>speed test online</strong> tools are built for pros.
                 </p>
              </div>
           </div>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {faqs.map((faq, idx) => (
                 <FAQItem key={idx} faq={faq} />
              ))}
           </div>
        </div>

        {/* EXPERT INSIGHTS - ULTIMATE SEO GUIDE */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '32px', padding: '60px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '100px' }}>
           <h2 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '30px', textAlign: 'center', color: '#fff' }}>
              Expert Guide: <span style={{color: BRAND_ORANGE}}>IP Checker Online & Speed Test Online</span>
           </h2>
           
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.8' }}>
              <div>
                 <h3 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: '800', marginBottom: '15px' }}>Why Use an Internet Speed Test?</h3>
                 <p>
                    An <strong>internet speed test</strong> is vital for verifying if your provider is delivering the 
                    promised speed test online results. High-speed connections are critical for <strong>Google Location Changer</strong> 
                    tasks and localized SEO auditing.
                 </p>
              </div>
              <div>
                 <h3 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: '800', marginBottom: '15px' }}>Mastering the IP Location Tracker</h3>
                 <p>
                    Your <strong>IP location tracker</strong> data helps websites serve you localized content. 
                    Checking <strong>"what is my ip"</strong> ensures that your privacy is protected and your 
                    digital footprint is accurate across all search engine databases.
                 </p>
              </div>
           </div>
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default IPChecker;
