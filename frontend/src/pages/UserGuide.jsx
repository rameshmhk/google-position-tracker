import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

const StepCard = ({ number, title, children, color = '#2563eb' }) => (
  <motion.div 
    whileHover={{ translateY: -5 }}
    style={{ 
      background: '#fff', 
      borderRadius: '24px', 
      padding: '40px', 
      border: '1px solid #f1f5f9',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 20px 25px -5px rgba(0,0,0,0.03)',
      marginBottom: '40px'
    }}
  >
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
      <div style={{ 
        background: color, 
        color: '#fff', 
        width: '40px', 
        height: '40px', 
        borderRadius: '12px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontSize: '18px', 
        fontWeight: '900',
        flexShrink: 0
      }}>{number}</div>
      <div>
        <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginBottom: '15px', letterSpacing: '-0.5px' }}>{title}</h3>
        <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#475569' }}>{children}</div>
      </div>
    </div>
  </motion.div>
);

const UserGuide = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b' }}>
      <Helmet>
        <title>Master Guide | Ranking Anywhere Documentation</title>
        <meta name="description" content="Official technical manual for Ranking Anywhere. Learn how to use our geographic intelligence engine, enterprise scraping infrastructure, and UULE metadata logic." />
        <meta name="keywords" content="seo guide, rank tracking documentation, uule logic, geographic intelligence, ranking anywhere manual" />
        <script type="application/ld+json">
          {JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "Master Guide | Ranking Anywhere",
              "description": "Technical manual for our geographic intelligence engine and enterprise scraping infrastructure."
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Ranking Anywhere",
              "url": "https://rankinganywhere.com/"
            },
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Ranking Anywhere",
              "url": "https://rankinganywhere.com/",
              "logo": "https://rankinganywhere.com/logo.png"
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
                  "name": "Master Guide",
                  "item": "https://rankinganywhere.com/guide"
                }
              ]
            }
          ])}
        </script>
      </Helmet>

      <Navbar />

      {/* Modern Header */}
      <header style={{ background: '#0f172a', padding: '140px 24px', color: '#fff', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 20% 30%, rgba(255,153,0,0.05) 0%, transparent 70%)' }}></div>
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,153,0,0.1)', color: 'var(--accent)', padding: '6px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: '900', letterSpacing: '2px', marginBottom: '25px' }}>TECHNICAL MANUAL v4.0</div>
          <h1 style={{ fontSize: '64px', fontWeight: '900', letterSpacing: '-4px', marginBottom: '20px', lineHeight: '0.9' }}>Mastering <span style={{ color: 'var(--accent)' }}>Anywhere.</span></h1>
          <p style={{ fontSize: '20px', color: '#94a3b8', maxWidth: '600px', margin: '0 auto', lineHeight: '1.5' }}>
            A deep-dive into our geographic intelligence engine and enterprise scraping infrastructure.
          </p>
        </div>
      </header>

      <main style={{ maxWidth: '1100px', margin: '-60px auto 120px auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        
        {/* SECTION 1: PUBLIC TOOLS */}
        <div style={{ marginBottom: '100px' }}>
          <div style={{ fontSize: '12px', fontWeight: '900', color: '#64748b', letterSpacing: '3px', marginBottom: '30px', textAlign: 'center' }}>TRACK A: THE PUBLIC UTILITY</div>
          
          <StepCard number="01" title="Free Live Verification" color="#3b82f6">
            <p style={{ marginBottom: '20px' }}>Our free tool allows for instant, non-authenticated rank checks. Simply provide the following data points:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
              <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '12px', fontSize: '14px' }}>
                <strong style={{ display: 'block', color: '#0f172a' }}>Target URL</strong>
                The full domain of your digital property.
              </div>
              <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '12px', fontSize: '14px' }}>
                <strong style={{ display: 'block', color: '#0f172a' }}>Core Keyword</strong>
                The search phrase you are competing for.
              </div>
              <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '12px', fontSize: '14px' }}>
                <strong style={{ display: 'block', color: '#0f172a' }}>City Node</strong>
                The geographic point for the search.
              </div>
            </div>
            <p><strong>The Intelligence:</strong> Once submitted, the system generates a 100% accurate P-score (Position) based on current SERP metadata.</p>
          </StepCard>
        </div>

        {/* SECTION 2: THE ENTERPRISE CONSOLE */}
        <div style={{ marginBottom: '100px' }}>
          <div style={{ fontSize: '12px', fontWeight: '900', color: '#64748b', letterSpacing: '3px', marginBottom: '30px', textAlign: 'center' }}>TRACK B: THE ENTERPRISE CONSOLE</div>

          <StepCard number="02" title="Project Initialization & GBP Sync" color="var(--accent)">
            <p style={{ marginBottom: '15px' }}>When you log in and create a project, you are building an <strong>SEO Node</strong>. For Google Maps tracking to work, you MUST provide your **Business Name** exactly as it appears in the Google Business Profile (GBP).</p>
            <p>Without the correct Business Name, the system will identify your P-rank (Organic) but will return **DNS** for M-rank (Maps) because it cannot verify your entity in the local pack.</p>
          </StepCard>

          <StepCard number="03" title="Multi-Location Override & UULE" color="var(--accent)">
            <p style={{ marginBottom: '15px' }}>Ranking Anywhere is built on the <strong>UULE Metadata Logic</strong>. While a project has a default location, you can override it for every single keyword.</p>
            <div style={{ background: '#0f172a', padding: '25px', borderRadius: '20px', color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
              <div style={{ color: 'var(--accent)', fontWeight: '900', marginBottom: '10px' }}>[ SETTINGS PANEL ]</div>
              <code>Location: New York, NY</code><br/>
              <code>GPS Override: 40.7128, -74.0060</code><br/>
              <code>Radius: Hyper-Local (Street Level)</code>
            </div>
            <p>This setting allows you to see if you rank #1 in the North of a city and #5 in the South - all from one dashboard.</p>
          </StepCard>

          <StepCard number="04" title="Decoding M1, L1, and DNS" color="#10b981">
            <p style={{ marginBottom: '20px' }}>The results you see are the result of our multi-API scanning process:</p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '15px', display: 'flex', gap: '15px' }}>
                <span style={{ fontWeight: '900', color: '#10b981' }}>M1-M3:</span> Your site is in the elite 'Google Maps Local 3-Pack'. This drives 80% of local traffic.
              </li>
              <li style={{ marginBottom: '15px', display: 'flex', gap: '15px' }}>
                <span style={{ fontWeight: '900', color: '#3b82f6' }}>L1-L20:</span> Your site is found in the 'Local Finder' (the 'More Places' button on the map).
              </li>
              <li style={{ marginBottom: '15px', display: 'flex', gap: '15px' }}>
                <span style={{ fontWeight: '900', color: '#ef4444' }}>DNS:</span> Did Not Show. If you see this, check if your Business Name matches your GBP or if your location is set too far from your business address.
              </li>
            </ul>
          </StepCard>

          <StepCard number="05" title="The Invisible Scraper Infrastructure" color="#6366f1">
            <p style={{ marginBottom: '15px' }}>Our system uses <strong>Offscreen Node Technology</strong>. This means when you trigger a scan, our scrapers operate in a silent, invisible background layer. You won't see popups or browser windows opening.</p>
            <p><strong>API Stream:</strong> Uses our global node cluster for 1.2s average scan time. BEST for daily overview.</p>
            <p><strong>Direct Proxy:</strong> Bypasses bot detection by using residential IPs. BEST for verifying Map Pack rankings in high-security niches.</p>
          </StepCard>

          <StepCard number="06" title="Live Verification Links" color="#2563eb">
            <p style={{ marginBottom: '15px' }}>Every rank in your dashboard is a <strong>Live Link</strong>. If you see a rank of 'P2', click on it. The system will open Google in a new tab, injecting the EXACT geographic parameters (UULE) we used during the scan.</p>
            <p>This is our 'Proof of Accuracy' - you can manually verify any result we provide within seconds.</p>
          </StepCard>
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default UserGuide;
