import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Contact = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact RankTracker Pro Support",
    "description": "Technical assistance and enterprise sales for world-class SEO operations.",
    "mainEntity": {
      "@type": "LocalBusiness",
      "name": "RankTracker Pro",
      "email": "support@ranktrackerpro.com"
    }
  };

  return (
    <div className="info-page">
      <Helmet>
        <title>Contact Support | RankTracker Pro</title>
        <meta name="description" content="Get in touch with the RankTracker Pro engineering and support team for technical assistance, enterprise sales, and API access." />
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      </Helmet>
      <Navbar />
      <div className="info-content" style={{ maxWidth: '1000px', margin: '0 auto', padding: '100px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', color: '#1D2B44', letterSpacing: '-2px' }}>Site <span style={{ color: 'var(--accent)' }}>Support</span> & Sales</h1>
          <p style={{ fontSize: '1.2rem', color: '#64748b', marginTop: '20px' }}>Technical assistance for world-class SEO operations.</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '60px' }}>
          <div className="contact-info" style={{ background: '#1D2B44', padding: '40px', borderRadius: '4px', color: '#fff' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '900', marginBottom: '15px' }}>Technical Support</h3>
            <p style={{ color: '#94a3b8', marginBottom: '10px' }}>✉️ support@ranktrackerpro.com</p>
            <p style={{ color: '#94a3b8' }}>💬 Live Node (9 AM - 5 PM AEST)</p>
          </div>
          <div className="contact-info" style={{ background: '#f8f9fa', border: '1px solid #e1e1e1', padding: '40px', borderRadius: '4px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1D2B44', marginBottom: '15px' }}>Enterprise Queries</h3>
            <p style={{ color: '#64748b' }}>✉️ engineering@ranktrackerpro.com</p>
          </div>
        </div>

        <form className="contact-form" onSubmit={(e) => e.preventDefault()} style={{ background: '#fff', border: '1px solid #e1e1e1', padding: '50px', borderRadius: '4px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#1D2B44', marginBottom: '10px', textTransform: 'uppercase' }}>Full Name</label>
              <input type="text" placeholder="e.g. John Doe" style={{ width: '100%', height: '52px', border: '1px solid #e1e1e1', borderRadius: '2px', padding: '0 20px', background: '#f8f9fa' }} />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#1D2B44', marginBottom: '10px', textTransform: 'uppercase' }}>Work Email</label>
              <input type="email" placeholder="e.g. john@company.com" style={{ width: '100%', height: '52px', border: '1px solid #e1e1e1', borderRadius: '2px', padding: '0 20px', background: '#f8f9fa' }} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '40px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#1D2B44', marginBottom: '10px', textTransform: 'uppercase' }}>Audit Requirements</label>
            <textarea rows="5" placeholder="Describe your technical requirements..." style={{ width: '100%', border: '1px solid #e1e1e1', borderRadius: '2px', padding: '20px', background: '#f8f9fa', resize: 'none' }}></textarea>
          </div>
          <button className="btn-primary-large" style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '20px 60px', borderRadius: '4px', fontWeight: '900', fontSize: '1.2rem', cursor: 'pointer', width: '100%' }}>Initialize Contact</button>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
