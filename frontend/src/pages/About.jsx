import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const About = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About Ranking Anywhere",
    "description": "Learn about our enterprise-grade SEO tracking software and our data transparency philosophy.",
    "publisher": {
      "@type": "Organization",
      "name": "Ranking Anywhere"
    }
  };

  return (
    <div className="info-page">
      <Helmet>
        <title>About Us | Ranking Anywhere SEO Engine</title>
        <meta name="description" content="Discover the technology behind Ranking Anywhere. Professional-grade data, global scanning, and 100% precision for SEO professionals." />
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      </Helmet>
      <Navbar />
      <div className="info-content" style={{ maxWidth: '1000px', margin: '0 auto', padding: '100px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', color: '#1D2B44', letterSpacing: '-2px' }}>Site Auditor <span style={{ color: 'var(--accent)' }}>Intelligence</span></h1>
          <p style={{ fontSize: '1.2rem', color: '#64748b', marginTop: '20px' }}>Professional-grade data for hyper-precision SEO audits.</p>
        </div>

        <div style={{ display: 'grid', gap: '30px' }}>
          <section style={{ background: '#fff', border: '1px solid #e1e1e1', padding: '40px', borderRadius: '4px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1D2B44', marginBottom: '20px' }}>Global Scan Infrastructure</h2>
            <p style={{ color: '#64748b', lineHeight: '1.8' }}>Ranking Anywhere is built on the philosophy of data transparency. We utilize high-precision GPS metadata to deliver the most accurate keyword positions available in the enterprise SEO space.</p>
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
