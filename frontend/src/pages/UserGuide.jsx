import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Helmet } from 'react-helmet-async';

const UserGuide = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#1e293b', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Helmet>
        <title>Master Documentation | Ranking Anywhere</title>
        <meta name="description" content="The definitive guide to mastering Ranking Anywhere. Detailed walkthrough of projects, locations, dashboard, and reporting." />
      </Helmet>

      <Navbar />

      {/* Header Section */}
      <header style={{ borderBottom: '1px solid #f1f5f9', padding: '100px 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent)', letterSpacing: '2px', marginBottom: '15px' }}>DOCUMENTATION PORTAL</div>
          <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#0f172a', letterSpacing: '-2px', marginBottom: '20px' }}>Platform Mastery Guide</h1>
          <p style={{ fontSize: '18px', color: '#64748b', lineHeight: '1.6', maxWidth: '700px' }}>
            A comprehensive walkthrough of the Ranking Anywhere ecosystem. From initial node configuration to advanced competitive intelligence.
          </p>
        </div>
      </header>

      <main style={{ maxWidth: '900px', margin: '60px auto 120px auto', padding: '0 24px' }}>
        
        {/* Phase 1: Onboarding */}
        <section id="onboarding" style={{ marginBottom: '80px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ background: '#f1f5f9', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>01</span>
            Initial Onboarding
          </h2>
          <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#475569' }}>
            <p style={{ marginBottom: '15px' }}>To begin tracking, you must first initialize your account. Once registered, the system prepares a dedicated database environment for your projects. All data is isolated and encrypted to ensure your competitive intelligence remains private.</p>
            <div style={{ background: '#eff6ff', borderLeft: '4px solid #3b82f6', padding: '20px', borderRadius: '0 8px 8px 0', marginBottom: '20px' }}>
              <strong>Pro Tip:</strong> Always use a professional email for account recovery and to receive automated weekly rank reports directly to your inbox.
            </div>
          </div>
        </section>

        {/* Phase 2: Project Architecture */}
        <section id="architecture" style={{ marginBottom: '80px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ background: '#f1f5f9', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>02</span>
            Project Architecture
          </h2>
          <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#475569' }}>
            <p style={{ marginBottom: '15px' }}>Adding a project is the foundation of your tracking strategy. The system requires three critical inputs to function accurately:</p>
            <ul style={{ paddingLeft: '20px', marginBottom: '20px', listStyleType: 'none' }}>
              <li style={{ marginBottom: '15px' }}>
                <span style={{ color: 'var(--accent)', fontWeight: '900', marginRight: '10px' }}>●</span>
                <strong>Target Domain:</strong> The exact website URL (e.g., myshop.com) you wish to monitor.
              </li>
              <li style={{ marginBottom: '15px' }}>
                <span style={{ color: 'var(--accent)', fontWeight: '900', marginRight: '10px' }}>●</span>
                <strong>Business Name:</strong> This is vital for Google Maps tracking. It must exactly match your name on the Google Business Profile (GBP).
              </li>
              <li style={{ marginBottom: '15px' }}>
                <span style={{ color: 'var(--accent)', fontWeight: '900', marginRight: '10px' }}>●</span>
                <strong>Primary Location:</strong> Set the default country and city for your broad ranking overview.
              </li>
            </ul>
          </div>
        </section>

        {/* Phase 3: Geographic Precision (UULE) */}
        <section id="geo" style={{ marginBottom: '80px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ background: '#f1f5f9', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>03</span>
            Geographic Precision (UULE)
          </h2>
          <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#475569' }}>
            <p style={{ marginBottom: '15px' }}>Ranking Anywhere uses advanced <strong>UULE Injection</strong> technology. This encodes specific geographic metadata into every search request, tricking the search engine into believing the searcher is physically located at a specific coordinate.</p>
            <p style={{ marginBottom: '15px' }}>In your project settings, you can override the general city location with a specific <strong>Postal Code</strong> or exact <strong>Latitude and Longitude</strong>. This is critical for Local SEO, as the 'Map Pack' can change significantly even within a few hundred meters.</p>
            <div style={{ background: '#fff7ed', borderLeft: '4px solid #f97316', padding: '20px', borderRadius: '0 8px 8px 0' }}>
              <strong>Important:</strong> Use coordinates if you want to track a specific shop's ranking from a nearby landmark or a high-traffic intersection.
            </div>
          </div>
        </section>

        {/* Phase 4: Dashboard Mastery */}
        <section id="dashboard" style={{ marginBottom: '80px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ background: '#f1f5f9', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>04</span>
            Dashboard Mastery
          </h2>
          <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#475569' }}>
            <p style={{ marginBottom: '15px' }}>The Dashboard is designed for high-speed analysis. Understanding the terminology is key:</p>
            <ul style={{ paddingLeft: '20px', marginBottom: '20px', listStyleType: 'none' }}>
              <li style={{ marginBottom: '15px' }}>
                <span style={{ color: 'var(--accent)', fontWeight: '900', marginRight: '10px' }}>●</span>
                <strong>P1, P2... Codes:</strong> These represent your Organic position on Google Search. P1 means you are on Page 1.
              </li>
              <li style={{ marginBottom: '15px' }}>
                <span style={{ color: 'var(--accent)', fontWeight: '900', marginRight: '10px' }}>●</span>
                <strong>M1, M2... Codes:</strong> These indicate your position within the Google Maps 'Local 3-Pack'. M1 is the #1 spot on the map.
              </li>
              <li style={{ marginBottom: '15px' }}>
                <span style={{ color: 'var(--accent)', fontWeight: '900', marginRight: '10px' }}>●</span>
                <strong>Comparison Matrix:</strong> A real-time comparison of your current rank vs. your last scan. Green indicators represent ranking growth, while Red highlights potential issues.
              </li>
              <li style={{ marginBottom: '15px' }}>
                <span style={{ color: 'var(--accent)', fontWeight: '900', marginRight: '10px' }}>●</span>
                <strong>Pause/Resume:</strong> Toggle individual keywords to manage your scanning credits and prioritize high-value terms.
              </li>
            </ul>
          </div>
        </section>

        {/* Phase 5: Scanning Strategies */}
        <section id="scrapers" style={{ marginBottom: '80px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ background: '#f1f5f9', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>05</span>
            API Stream vs Direct Proxy
          </h2>
          <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#475569' }}>
            <p style={{ marginBottom: '15px' }}>Depending on your goals, you can choose between two scanning engines:</p>
            <p style={{ marginBottom: '15px' }}><strong>API Stream:</strong> Best for tracking thousands of keywords at once. It is extremely fast and connects via our global cloud node cluster. Use this for your general daily keyword tracking.</p>
            <p style={{ marginBottom: '15px' }}><strong>Direct Proxy:</strong> This uses physical residential nodes to simulate a 100% human-like search interaction. It is slower but ensures that you bypass any bot protection and get the most 'honest' local results possible.</p>
          </div>
        </section>

        {/* Phase 6: Professional Reporting */}
        <section id="reporting" style={{ marginBottom: '80px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ background: '#f1f5f9', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>06</span>
            Professional Reporting
          </h2>
          <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#475569' }}>
            <p style={{ marginBottom: '15px' }}>To share your success with clients, use the <strong>Export Module</strong>. You can generate CSV or PDF style reports for any project. These reports contain historical ranking data and visibility trends, perfect for monthly SEO audits or performance reviews.</p>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default UserGuide;
