import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FAQSection from '../components/FAQSection';
import { motion } from 'framer-motion';

const Home = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Ranking Anywhere",
    "operatingSystem": "Web",
    "applicationCategory": "BusinessApplication",
    "description": "Ranking Anywhere provides hyper-accurate, real-time SEO intelligence and keyword tracking for global enterprises.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <div className="landing-page">
      <Helmet>
        <title>Ranking Anywhere - Professional SEO Ranking & Audit Software</title>
        <meta name="description" content="All-in-one SEO toolset for rank tracking, site audits, and competitive intelligence. Trusted by leading SEO professionals." />
        <meta name="keywords" content="seo tracker, rank tracker, google rank, keyword rank, local seo" />
        <script type="application/ld+json">
          {JSON.stringify([
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
              ]
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
                }
              ]
            }
          ])}
        </script>
      </Helmet>
      
      <Navbar />
      
      {/* HERO SECTION - REVERTED TO ORIGINAL */}
      <header className="hero" style={{ background: '#1D2B44', padding: '120px 24px', color: '#fff', textAlign: 'center', display: 'block' }}>
        <div className="hero-content" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ fontSize: '4.5rem', fontWeight: '900', letterSpacing: '-3px', marginBottom: '30px', lineHeight: '1.1' }}
          >
            Everything you need to <br /><span style={{ color: 'var(--accent)' }}>rank higher</span> & get more traffic
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
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
            <Link to="/register" className="btn-primary-large" style={{ background: 'var(--accent)', color: '#fff', borderRadius: '4px', border: 'none', padding: '20px 50px', fontSize: '1.2rem', fontWeight: '900', textDecoration: 'none' }}>Start for Free</Link>
            <Link to="/how-to-use" className="btn-secondary" style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '4px', padding: '20px 50px', fontSize: '1.2rem', fontWeight: '900', textDecoration: 'none' }}>Documentation</Link>
          </motion.div>
        </div>
      </header>

      {/* CORE INFRASTRUCTURE SECTION */}
      <section style={{ padding: '100px 24px', background: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
           <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <div style={{ fontSize: '12px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '3px', marginBottom: '15px' }}>GLOBAL INFRASTRUCTURE</div>
              <h2 style={{ fontSize: '42px', fontWeight: '900', color: '#0f172a', letterSpacing: '-1.5px' }}>Distributed Node Architecture</h2>
           </div>

           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
              {[
                { title: 'Anycast Proxy Network', desc: 'Access results via residential hardware clusters in over 190 countries with zero detection.', icon: '🌐' },
                { title: 'GPS Metadata Spoofing', desc: 'Rankings are verified using precise latitude and longitude coordinates for hyper-local accuracy.', icon: '📍' },
                { title: 'Real-Time Sync', desc: 'Direct socket connection to our scanning nodes ensures your dashboard is never out of date.', icon: '⚡' }
              ].map((item, i) => (
                <div key={i} style={{ padding: '40px', border: '1px solid #f1f5f9', borderRadius: '24px', transition: 'all 0.3s ease' }}>
                   <div style={{ fontSize: '40px', marginBottom: '25px' }}>{item.icon}</div>
                   <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', marginBottom: '15px' }}>{item.title}</h3>
                   <p style={{ color: '#64748b', lineHeight: '1.7', fontSize: '15px' }}>{item.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* DEEP DATA SECTION */}
      <section style={{ padding: '120px 24px', background: '#0f172a', color: '#fff' }}>
         <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '80px' }}>
            <div style={{ flex: 1 }}>
               <div style={{ fontSize: '12px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '3px', marginBottom: '20px' }}>DATA INTELLIGENCE</div>
               <h2 style={{ fontSize: '50px', fontWeight: '900', lineHeight: '1.1', marginBottom: '30px' }}>Verify rankings at the <span style={{ color: 'var(--accent)' }}>postal code</span> level.</h2>
               <p style={{ color: '#94a3b8', fontSize: '18px', lineHeight: '1.6', marginBottom: '40px' }}>
                  Traditional trackers use broad city data. Ranking Anywhere injects exact geographic telemetry into every request, giving you the true local pack visibility your competitors can't see.
               </p>
               <ul style={{ listStyle: 'none', padding: 0 }}>
                  {['Multi-API Failover System', 'JavaScript Rendering Support', 'Google Maps Local Pack Tracking', 'Historical Rank Matrix'].map((li, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px', fontWeight: '700', color: '#e2e8f0' }}>
                       <span style={{ color: 'var(--accent)' }}>✓</span> {li}
                    </li>
                  ))}
               </ul>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '30px', padding: '40px', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
               <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                  <div style={{ height: '10px', width: '60%', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', marginBottom: '15px' }}></div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                     <div style={{ height: '40px', flex: 1, background: 'rgba(16,185,129,0.1)', borderRadius: '8px' }}></div>
                     <div style={{ height: '40px', flex: 1, background: 'rgba(59,130,246,0.1)', borderRadius: '8px' }}></div>
                  </div>
               </div>
               <div style={{ height: '200px', width: '100%', background: 'linear-gradient(0deg, rgba(255,153,0,0.05), transparent)', border: '1px solid rgba(255,153,0,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '2px' }}>LIVE NODE SCANNING...</div>
               </div>
            </div>
         </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="cta-section" style={{ padding: '120px 24px', textAlign: 'center', background: '#fff' }}>
        <h2 style={{ fontSize: '48px', fontWeight: '900', marginBottom: '20px' }}>Ready to outrank the competition?</h2>
        <p style={{ color: '#64748b', fontSize: '18px', marginBottom: '50px' }}>Join the next generation of SEO professionals using high-precision data.</p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
           <Link to="/register" className="btn-primary-large" style={{ padding: '22px 60px', background: 'var(--accent)', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontWeight: '900' }}>Create Your Free Node</Link>
           <Link to="/how-to-use" style={{ padding: '22px 60px', background: '#f1f5f9', border: 'none', color: '#0f172a', fontWeight: '900', borderRadius: '4px', textDecoration: 'none' }}>Learn the Workflow</Link>
        </div>
      </section>

      <FAQSection />

      <Footer />
    </div>
  );
};

export default Home;
