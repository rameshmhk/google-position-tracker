import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import { motion } from 'framer-motion';

const Home = () => {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Ranking Anywhere",
      "operatingSystem": "Web",
      "applicationCategory": "BusinessApplication",
      "description": "Ranking Anywhere provides hyper-accurate, real-time SEO intelligence and keyword tracking for global enterprises.",
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
    }
  ];

  return (
    <div className="landing-page">
      <Helmet>
        <title>Ranking Anywhere - Professional SEO Ranking & Audit Software</title>
        <meta name="description" content="Professional Google Location Changer and Rank Tracker. All-in-one SEO toolset for residential proxy searches, site audits, and local packing tracking." />
        <meta name="keywords" content="google location changer, location changer, seo proxy, residential proxy, vpn for seo, rank tracker, google rank, local seo pack" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      
      <Navbar />
      
      {/* HERO SECTION */}
      <header className="hero" style={{ background: '#1D2B44', padding: '120px 24px 80px', color: '#fff', textAlign: 'center', display: 'block', position: 'relative', overflow: 'hidden' }}>
        <div className="hero-content" style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="hero-title" style={{ color: '#fff', fontSize: 'clamp(2.5rem, 8vw, 5.5rem)', fontWeight: '900', lineHeight: '1', letterSpacing: '-0.04em', marginBottom: '2rem' }}>
               Dominate Search <span className="text-gradient">Globally.</span>
            </h1>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hero-subtitle"
            style={{ fontSize: '1.4rem', color: '#cbd5e1', marginBottom: '50px', lineHeight: '1.5', maxWidth: '750px', margin: '0 auto 50px auto' }}
          >
            All-in-one SEO toolset for rank tracking, site audits, and competitive intelligence. 
            Trusted by the world's leading SEO professionals.
          </motion.p>
          <motion.div 
            className="hero-btns"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}
          >
            <Link to="/register" className="btn-primary-large" style={{ background: 'var(--accent)', color: '#fff', borderRadius: '8px', border: 'none', padding: '20px 50px', fontSize: '1.2rem', fontWeight: '900', textDecoration: 'none', boxShadow: '0 15px 30px rgba(255,153,0,0.3)' }}>Start for Free</Link>
            <Link to="/how-to-use" className="btn-secondary-large" style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', padding: '20px 50px', fontSize: '1.2rem', fontWeight: '900', textDecoration: 'none' }}>Documentation</Link>
          </motion.div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100px', background: 'linear-gradient(to bottom, transparent, #fff)' }}></div>
      </header>

       {/* CORE INFRASTRUCTURE SECTION */}
      <section style={{ padding: '80px 24px', background: '#fff' }} className="responsive-section">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
           <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <div style={{ fontSize: '12px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '3px', marginBottom: '15px' }}>GLOBAL INFRASTRUCTURE</div>
              <h2 style={{ fontSize: '42px', fontWeight: '900', color: '#0f172a', letterSpacing: '-1.5px' }} className="section-title">Distributed Node Architecture</h2>
           </div>
 
           <div className="infrastructure-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
              {[
                { title: 'Anycast Proxy Network', desc: 'Access results via residential hardware clusters in over 190 countries with zero detection.', icon: '&#127760;' },
                { title: 'GPS Metadata Spoofing', desc: 'Rankings are verified using precise latitude and longitude coordinates for hyper-local accuracy.', icon: '&#128205;' },
                { title: 'Real-Time Sync', desc: 'Direct socket connection to our scanning nodes ensures your dashboard is never out of date.', icon: '&#9889;' }
              ].map((item, i) => (
                <div key={i} style={{ padding: '40px', border: '1px solid #f1f5f9', borderRadius: '24px', transition: 'all 0.3s ease', background: '#fff' }} className="feature-card">
                   <div style={{ fontSize: '40px', marginBottom: '25px' }} dangerouslySetInnerHTML={{ __html: item.icon }}></div>
                   <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', marginBottom: '15px' }}>{item.title}</h3>
                   <p style={{ color: '#64748b', lineHeight: '1.7', fontSize: '15px' }}>{item.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>
 
      {/* ADVANCED SEO CAPABILITIES */}
      <section style={{ padding: '80px 24px', background: '#f8fafc' }} className="responsive-section">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="split-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
            <div className="split-content">
               <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '2px', marginBottom: '20px' }}>NEXT-GEN SEO TOOLS</div>
               <h2 style={{ fontSize: '40px', fontWeight: '900', color: '#0f172a', lineHeight: '1.2', marginBottom: '25px' }} className="section-title">
                 The Ultimate <span style={{color: 'var(--accent)'}}>Location Changer</span> for Search Intelligence
               </h2>
               <p style={{ fontSize: '18px', color: '#475569', lineHeight: '1.7', marginBottom: '30px' }}>
                 Tired of using a <strong>VPN</strong> or slow <strong>proxy</strong> services that Google easily detects? Our <strong>Google location changer</strong> technology operates at the browser level.
               </p>
               <div className="inner-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ padding: '25px', background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                    <h4 style={{ fontWeight: '800', marginBottom: '10px' }}>VPN-Free Search</h4>
                    <p style={{ fontSize: '13px', color: '#64748b' }}>No more server blacklists. Get real results as seen by local users instantly.</p>
                  </div>
                  <div style={{ padding: '25px', background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                    <h4 style={{ fontWeight: '800', marginBottom: '10px' }}>Residential Proxy</h4>
                    <p style={{ fontSize: '13px', color: '#64748b' }}>Leverage our private pool of residential nodes for 100% human-like behavior.</p>
                  </div>
               </div>
            </div>
            <div className="split-visual" style={{ position: 'relative' }}>
               <div style={{ background: 'linear-gradient(135deg, #1D2B44 0%, #0f172a 100%)', padding: '50px', borderRadius: '40px', boxShadow: '0 40px 100px rgba(0,0,0,0.1)' }}>
                  <div style={{ color: '#fff', fontSize: '14px', marginBottom: '20px', fontFamily: 'monospace' }}>
                    <span style={{ color: 'var(--accent)' }}>$</span> google_search --location="Gurgaon, India"
                  </div>
                  <div style={{ height: '2px', background: 'rgba(255,255,255,0.1)', marginBottom: '20px' }}></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {[1,2,3].map(i => (
                      <div key={i} style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: `${100 - (i*15)}%` }}></div>
                    ))}
                  </div>
               </div>
               <div className="visual-badge" style={{ position: 'absolute', bottom: '-20px', right: '-20px', background: 'var(--accent)', color: '#fff', padding: '15px 25px', borderRadius: '15px', fontWeight: '900', boxShadow: '0 15px 30px rgba(245, 158, 11, 0.3)', fontSize: '14px' }}>
                 LOCALE: GGN-IN
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEO DEEP DIVE CONTENT */}
      <section style={{ padding: '80px 24px', background: '#fff' }} className="responsive-section">
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
           <h2 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', marginBottom: '40px', textAlign: 'center' }} className="section-title">
             Understanding the Power of a <span style={{color: 'var(--accent)'}}>Google Location Changer</span>
           </h2>
           
           <div style={{ color: '#475569', fontSize: '17px', lineHeight: '1.8', display: 'flex', flexDirection: 'column', gap: '30px' }} className="deep-dive-text">
              <p>
                In today's highly competitive digital landscape, showing up on the first page of Google is no longer just about having good keywords. It's about understanding how your business appears to users across geographic boundaries.
              </p>
              <div style={{ padding: '30px', background: '#f8fafc', borderRadius: '25px', borderLeft: '6px solid var(--accent)' }} className="quote-box">
                <h4 style={{ color: '#0f172a', marginBottom: '15px', fontWeight: '800' }}>Why Geo-Targeting Matters</h4>
                <p style={{ fontSize: '15px' }}>Google's algorithms prioritize local intent. If someone searches for "best SEO agency," the results in New York differ from London.</p>
              </div>
           </div>
        </div>
      </section>

      {/* DEEP DATA SECTION */}
      <section style={{ padding: '100px 24px', background: '#0f172a', color: '#fff' }} className="responsive-section">
         <div className="split-section" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '80px' }}>
            <div style={{ flex: 1 }} className="split-content">
               <div style={{ fontSize: '12px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '3px', marginBottom: '20px' }}>DATA INTELLIGENCE</div>
               <h2 style={{ fontSize: '50px', fontWeight: '900', lineHeight: '1.1', marginBottom: '30px' }} className="section-title">Verify rankings at the <span style={{ color: 'var(--accent)' }}>postal code</span> level.</h2>
               <p style={{ color: '#94a3b8', fontSize: '18px', lineHeight: '1.6', marginBottom: '40px' }}>
                  Traditional trackers use broad city data. Ranking Anywhere injects exact geographic telemetry into every request.
               </p>
               <ul style={{ listStyle: 'none', padding: 0 }}>
                  {['Multi-API Failover System', 'JavaScript Rendering Support', 'Google Maps Local Pack Tracking', 'Historical Rank Matrix'].map((li, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px', fontWeight: '700', color: '#e2e8f0' }}>
                       <span style={{ color: 'var(--accent)' }}>✓</span> {li}
                    </li>
                  ))}
               </ul>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '30px', padding: '40px', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }} className="split-visual">
               <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                  <div style={{ height: '10px', width: '60%', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', marginBottom: '15px' }}></div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                     <div style={{ height: '40px', flex: 1, background: 'rgba(16,185,129,0.1)', borderRadius: '8px' }}></div>
                     <div style={{ height: '40px', flex: 1, background: 'rgba(59,130,246,0.1)', borderRadius: '8px' }}></div>
                  </div>
               </div>
               <div style={{ height: '150px', width: '100%', background: 'linear-gradient(0deg, rgba(255,153,0,0.05), transparent)', border: '1px solid rgba(255,153,0,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '2px' }}>LIVE NODE SCANNING...</div>
               </div>
            </div>
         </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="cta-section" style={{ padding: '100px 24px', textAlign: 'center', background: '#fff' }}>
        <h2 style={{ fontSize: '48px', fontWeight: '900', marginBottom: '20px' }} className="section-title">Ready to outrank the competition?</h2>
        <p style={{ color: '#64748b', fontSize: '18px', marginBottom: '50px' }}>Join the next generation of SEO professionals using high-precision data.</p>
        <div className="hero-btns" style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
           <Link to="/register" className="btn-primary-large" style={{ padding: '22px 60px', background: 'var(--accent)', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: '900', boxShadow: '0 10px 20px rgba(255,153,0,0.2)' }}>Create Your Free Node</Link>
           <Link to="/how-to-use" style={{ padding: '22px 60px', background: '#f1f5f9', border: 'none', color: '#0f172a', fontWeight: '900', borderRadius: '8px', textDecoration: 'none' }}>Learn more</Link>
        </div>
      </section>

      <FAQSection />

      {/* CONTENT ACCESS SECTION */}
      <section style={{ padding: '60px 24px', background: '#f8fafc' }} className="responsive-section">
        <div style={{ maxWidth: '1200px', margin: '0 auto', background: '#1D2B44', borderRadius: '40px', padding: '80px 40px', color: '#fff', textAlign: 'center', position: 'relative', overflow: 'hidden' }} className="access-box">
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--accent)', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.2 }}></div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: '40px', fontWeight: '900', marginBottom: '20px' }} className="section-title">Access Global Intelligence</h2>
            <p style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '40px', maxWidth: '700px', margin: '0 auto 40px auto' }}>
              Instantly audit keywords, check IP locations, and monitor SERP movements from any city on earth.
            </p>
            <div className="access-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
               {[
                 { label: 'Rank Tracker', path: '/free-check' },
                 { label: 'IP Intelligence', path: '/check-ip' },
                 { label: 'Whois Audit', path: '/whois' }
               ].map((item, i) => (
                 <Link key={i} to={item.path} style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', textDecoration: 'none', fontWeight: '800', transition: 'all 0.3s ease' }} className="access-card">
                   {item.label}
                 </Link>
               ))}
            </div>
            <Link to="/register" style={{ display: 'inline-block', background: 'var(--accent)', color: '#fff', textDecoration: 'none', padding: '18px 45px', borderRadius: '12px', fontWeight: '900', fontSize: '18px', boxShadow: '0 10px 30px rgba(245, 158, 11, 0.3)' }}>Start Full Access Now</Link>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        @media (max-width: 768px) {
          .hero { padding: 80px 20px 60px !important; }
          .hero-title { font-size: 32px !important; letter-spacing: -1px !important; line-height: 1.2 !important; }
          .hero-subtitle { font-size: 16px !important; margin-bottom: 30px !important; }
          .hero-btns { flex-direction: column !important; gap: 15px !important; }
          .hero-btns a { width: 100% !important; padding: 18px !important; text-align: center !important; font-size: 16px !important; }
          
          .section-title { font-size: 28px !important; line-height: 1.3 !important; }
          .infrastructure-grid, .access-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
          .split-section { grid-template-columns: 1fr !important; gap: 40px !important; }
          .inner-grid { grid-template-columns: 1fr !important; }
          
          .responsive-section { padding: 40px 20px !important; }
          .access-box { padding: 40px 20px !important; border-radius: 25px !important; }
          .split-visual { order: -1 !important; }
          .visual-badge { right: 10px !important; bottom: 10px !important; }
        }
      `}</style>
    </div>
  );
};

export default Home;
