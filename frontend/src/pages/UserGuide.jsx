import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Helmet } from 'react-helmet-async';

const UserGuide = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#1e293b', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Helmet>
        <title>User Manual & Documentation | Ranking Anywhere</title>
        <meta name="description" content="Step-by-step guide for using the free rank tracker and the enterprise dashboard. Learn about M1, L1, UULE, and proxy settings." />
      </Helmet>

      <Navbar />

      {/* Hero Section */}
      <header style={{ borderBottom: '1px solid #f1f5f9', padding: '120px 24px', background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '3px', marginBottom: '15px' }}>DOCUMENTATION V3.0</div>
          <h1 style={{ fontSize: '52px', fontWeight: '900', color: '#0f172a', letterSpacing: '-2.5px', marginBottom: '20px' }}>Mastering the Engine</h1>
          <p style={{ fontSize: '20px', color: '#64748b', lineHeight: '1.6', maxWidth: '800px', margin: '0 auto' }}>
            Choose your track below to learn how to leverage Ranking Anywhere for hyper-local SEO dominance.
          </p>
        </div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '100px 24px' }}>
        
        {/* TRACK 1: PUBLIC TOOLS (WITHOUT LOGIN) */}
        <section style={{ marginBottom: '120px' }}>
          <div style={{ display: 'inline-block', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', padding: '8px 20px', borderRadius: '100px', fontSize: '13px', fontWeight: '900', marginBottom: '30px' }}>TRACK A: PUBLIC ACCESS (NO LOGIN)</div>
          <h2 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', marginBottom: '40px', letterSpacing: '-1.5px' }}>Using the Free Live Tracker</h2>
          
          <div style={{ background: '#f8fafc', padding: '40px', borderRadius: '30px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '20px' }}>1. Initializing a Quick Scan</h3>
            <p style={{ color: '#475569', lineHeight: '1.8', marginBottom: '20px' }}>You don't need an account to verify a single position. Follow these steps:</p>
            <ul style={{ paddingLeft: '20px', color: '#475569', lineHeight: '1.8' }}>
              <li style={{ marginBottom: '15px' }}><strong>URL / Domain:</strong> Enter your full website address (e.g., myshop.com). The system will analyze this specific domain against competitors.</li>
              <li style={{ marginBottom: '15px' }}><strong>Keyword:</strong> Enter the phrase you want to check (e.g., 'plumber near me').</li>
              <li style={{ marginBottom: '15px' }}><strong>Location:</strong> Choose your target city or country. Our system will immediately generate a UULE string for this location to fetch local results.</li>
            </ul>
            
            <h3 style={{ fontSize: '22px', fontWeight: '800', margin: '40px 0 20px 0' }}>2. Reading Public Results</h3>
            <p style={{ color: '#475569', lineHeight: '1.8' }}>Once you click 'Check Rank', the system contacts our cloud nodes. You will receive an immediate Organic Rank (P1-P100). This is a 'Point-in-Time' snapshot of how you appear right now.</p>
          </div>
        </section>

        <div style={{ height: '1px', background: '#f1f5f9', margin: '100px 0' }}></div>

        {/* TRACK 2: ENTERPRISE PLATFORM (AFTER LOGIN) */}
        <section>
          <div style={{ display: 'inline-block', background: 'rgba(255, 153, 0, 0.1)', color: '#f97316', padding: '8px 20px', borderRadius: '100px', fontSize: '13px', fontWeight: '900', marginBottom: '30px' }}>TRACK B: ENTERPRISE PLATFORM (POST-LOGIN)</div>
          <h2 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', marginBottom: '40px', letterSpacing: '-1.5px' }}>Dashboard Mastery & Project Logic</h2>

          {/* 1. Project Management */}
          <div style={{ marginBottom: '60px' }}>
            <h3 style={{ fontSize: '26px', fontWeight: '900', marginBottom: '20px', color: '#0f172a' }}>1. Creating Your Command Center</h3>
            <p style={{ color: '#475569', lineHeight: '1.8', marginBottom: '20px' }}>Inside the dashboard, you manage <strong>Projects</strong>, not just single URLs.</p>
            <ul style={{ paddingLeft: '20px', color: '#475569', lineHeight: '1.8' }}>
              <li style={{ marginBottom: '15px' }}><strong>Adding a Project:</strong> Click 'New Project' and enter your Domain. <strong>Crucial:</strong> Enter your exact Google Business Profile name to enable Map tracking.</li>
              <li style={{ marginBottom: '15px' }}><strong>Adding Keywords:</strong> You can add keywords one-by-one or use the <strong>Bulk Upload</strong> feature for large inventories.</li>
              <li style={{ marginBottom: '15px' }}><strong>Different Locations:</strong> You can set a general location for the project, but you can also override it for specific keywords. This allows you to track how you rank in New York and London simultaneously within the same project.</li>
            </ul>
          </div>

          {/* 2. Understanding Symbols */}
          <div style={{ marginBottom: '60px', background: '#0f172a', padding: '50px', borderRadius: '40px', color: '#fff' }}>
            <h3 style={{ fontSize: '26px', fontWeight: '900', marginBottom: '30px' }}>2. Decoding the Result Codes</h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.8', marginBottom: '30px' }}>The dashboard uses high-speed symbols to represent complex search features:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--accent)', marginBottom: '10px' }}>M1, M2, M3</div>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}><strong>Google Maps (Local Pack):</strong> Your rank within the map results. M1 means you are the first business people see on the map.</p>
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--accent)', marginBottom: '10px' }}>P1, P2...</div>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}><strong>Organic Web:</strong> Your position in the standard blue-link search results. P1 is the top organic spot.</p>
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#ef4444', marginBottom: '10px' }}>DNS</div>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}><strong>Did Not Show:</strong> This means your site was not found in the first 100 results. This usually indicates a need for technical SEO or a better proxy setting.</p>
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#10b981', marginBottom: '10px' }}>L1, L2...</div>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}><strong>Local Finder:</strong> Your position in the extended 'More Places' view on Google Maps.</p>
              </div>
            </div>
          </div>

          {/* 3. API vs Proxy Settings */}
          <div style={{ marginBottom: '60px' }}>
            <h3 style={{ fontSize: '26px', fontWeight: '900', marginBottom: '20px', color: '#0f172a' }}>3. Advanced Scraper Strategies</h3>
            <p style={{ color: '#475569', lineHeight: '1.8', marginBottom: '20px' }}>How your data is fetched matters for accuracy:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px' }}>
              <div style={{ padding: '30px', border: '1px solid #f1f5f9', borderRadius: '20px' }}>
                <h4 style={{ fontWeight: '900', marginBottom: '10px' }}>API Stream (Cloud)</h4>
                <p style={{ fontSize: '14px', color: '#64748b' }}>Our default high-speed engine. It uses our 'Free API' cluster to get you fast results for bulk keywords. Best for daily tracking.</p>
              </div>
              <div style={{ padding: '30px', border: '1px solid #f1f5f9', borderRadius: '20px' }}>
                <h4 style={{ fontWeight: '900', marginBottom: '10px' }}>Direct Proxy (Hardware)</h4>
                <p style={{ fontSize: '14px', color: '#64748b' }}>Simulates a real browser. It uses residential IP addresses to get 100% verified results for highly competitive local terms.</p>
              </div>
            </div>
          </div>

          {/* 4. Inside the Node (Project Insights) */}
          <div style={{ marginBottom: '60px', borderLeft: '4px solid var(--accent)', paddingLeft: '30px' }}>
            <h3 style={{ fontSize: '26px', fontWeight: '900', marginBottom: '20px', color: '#0f172a' }}>4. Inside the Node (Project Insights)</h3>
            <p style={{ color: '#475569', lineHeight: '1.8', marginBottom: '20px' }}>When you click into a project, you enter 'The Node'. Here you can see:</p>
            <ul style={{ paddingLeft: '20px', color: '#475569', lineHeight: '1.8' }}>
              <li><strong>Historical Matrix:</strong> Compare rank changes by Day, Week, or Month.</li>
              <li><strong>Manual Refresh:</strong> Force a re-scan of any keyword if you suspect a SERP change.</li>
              <li><strong>Technical Metadata:</strong> View the exact UULE and coordinates used by our scanner nodes for that specific result.</li>
            </ul>
          </div>

        </section>

      </main>

      <Footer />
    </div>
  );
};

export default UserGuide;
