import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const About = () => {
  return (
    <div className="info-page">
      <Navbar />
      <div className="info-content" style={{ maxWidth: '1000px', margin: '0 auto', padding: '100px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', color: '#1D2B44', letterSpacing: '-2px' }}>Site Auditor <span style={{ color: 'var(--accent)' }}>Intelligence</span></h1>
          <p style={{ fontSize: '1.2rem', color: '#64748b', marginTop: '20px' }}>Professional-grade data for hyper-precision SEO audits.</p>
        </div>

        <div style={{ display: 'grid', gap: '30px' }}>
          <section style={{ background: '#fff', border: '1px solid #e1e1e1', padding: '40px', borderRadius: '4px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1D2B44', marginBottom: '20px' }}>Global Scan Infrastructure</h2>
            <p style={{ color: '#64748b', lineHeight: '1.8' }}>RankTracker Pro is built on the philosophy of data transparency. We utilize high-precision GPS metadata to deliver the most accurate keyword positions available in the enterprise SEO space.</p>
          </section>

          <section style={{ background: '#fff', border: '1px solid #e1e1e1', padding: '40px', borderRadius: '4px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1D2B44', marginBottom: '20px' }}>Engineering Logic</h2>
            <p style={{ color: '#64748b', lineHeight: '1.8' }}>Founded in 2024, our engine combines raw SERP intelligence with hybrid scraping modules, ensuring that high-stakes SEO decisions are backed by platinum-grade data streams.</p>
          </section>

          <section style={{ background: '#fff', border: '1px solid #e1e1e1', padding: '40px', borderRadius: '4px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1D2B44', marginBottom: '20px' }}>Audit Precision Matrix</h2>
            <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <li style={{ background: '#f8f9fa', padding: '20px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ color: 'var(--accent)', fontWeight: '900', fontSize: '1.2rem', marginBottom: '8px' }}>100%</div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#1D2B44' }}>DATA TRANSPARENCY</div>
              </li>
              <li style={{ background: '#f8f9fa', padding: '20px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ color: 'var(--primary)', fontWeight: '900', fontSize: '1.2rem', marginBottom: '8px' }}>0.2s</div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#1D2B44' }}>SCAN LATENCY</div>
              </li>
              <li style={{ background: '#f8f9fa', padding: '20px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ color: 'var(--accent)', fontWeight: '900', fontSize: '1.2rem', marginBottom: '8px' }}>24/7</div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#1D2B44' }}>UPTIME MONITORING</div>
              </li>
            </ul>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;
