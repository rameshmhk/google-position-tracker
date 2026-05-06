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
        <meta name="description" content="Professional Google Location Changer and Rank Tracker. All-in-one SEO toolset for residential proxy searches, site audits, and local packing tracking." />
        <meta name="keywords" content="google location changer, location changer, seo proxy, residential proxy, vpn for seo, rank tracker, google rank, local seo pack" />
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
      <header className="hero" style={{ background: '#1D2B44', padding: '60px 24px', color: '#fff', textAlign: 'center', display: 'block' }}>
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
      <section style={{ padding: '40px 24px', background: '#fff' }}>
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
 
      {/* NEW SECTION: ADVANCED SEO CAPABILITIES (Keywords: Location Changer, VPN, Proxy) */}
      <section style={{ padding: '40px 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
            <div>
               <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '2px', marginBottom: '20px' }}>NEXT-GEN SEO TOOLS</div>
               <h2 style={{ fontSize: '40px', fontWeight: '900', color: '#0f172a', lineHeight: '1.2', marginBottom: '25px' }}>
                 The Ultimate <span style={{color: 'var(--accent)'}}>Location Changer</span> for Search Intelligence
               </h2>
               <p style={{ fontSize: '18px', color: '#475569', lineHeight: '1.7', marginBottom: '30px' }}>
                 Tired of using a <strong>VPN</strong> or slow <strong>proxy</strong> services that Google easily detects? Our <strong>Google location changer</strong> technology operates at the browser level, allowing you to simulate any geographic point on Earth without triggering CAPTCHAs or being blocked.
               </p>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ padding: '20px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ fontWeight: '800', marginBottom: '10px' }}>VPN-Free Search</h4>
                    <p style={{ fontSize: '13px', color: '#64748b' }}>No more server blacklists. Get real results as seen by local users instantly.</p>
                  </div>
                  <div style={{ padding: '20px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ fontWeight: '800', marginBottom: '10px' }}>Residential Proxy</h4>
                    <p style={{ fontSize: '13px', color: '#64748b' }}>Leverage our private pool of residential nodes for 100% human-like behavior.</p>
                  </div>
               </div>
            </div>
            <div style={{ position: 'relative' }}>
               <div style={{ background: 'linear-gradient(135deg, #1D2B44 0%, #0f172a 100%)', padding: '50px', borderRadius: '40px', boxShadow: '0 40px 100px rgba(0,0,0,0.1)' }}>
                  <div style={{ color: '#fff', fontSize: '14px', marginBottom: '20px' }}>
                    <span style={{ color: 'var(--accent)' }}>$</span> google_search --location="Gurgaon, India"
                  </div>
                  <div style={{ height: '2px', background: 'rgba(255,255,255,0.1)', marginBottom: '20px' }}></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {[1,2,3].map(i => (
                      <div key={i} style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: `${100 - (i*15)}%` }}></div>
                    ))}
                  </div>
               </div>
               <div style={{ position: 'absolute', bottom: '-30px', right: '-30px', background: 'var(--accent)', color: '#fff', padding: '20px 30px', borderRadius: '20px', fontWeight: '900', boxShadow: '0 20px 40px rgba(245, 158, 11, 0.3)' }}>
                 LOCALE: GGN-IN
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION: SEO DEEP DIVE (600+ Words Content) */}
      <section style={{ padding: '40px 24px', background: '#fff' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
           <h2 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', marginBottom: '40px', textAlign: 'center' }}>
             Understanding the Power of a <span style={{color: 'var(--accent)'}}>Google Location Changer</span> in Modern SEO
           </h2>
           
           <div style={{ color: '#475569', fontSize: '17px', lineHeight: '1.8', display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <p>
                In today's highly competitive digital landscape, showing up on the first page of Google is no longer just about having good keywords. It's about understanding how your business appears to users across different geographic boundaries. This is where a professional <strong>location changer</strong> becomes an essential tool in your SEO arsenal. Unlike a standard <strong>VPN</strong>, which simply masks your IP address, a dedicated SERP investigator like Ranking Anywhere allows you to inject precise UULE parameters and geographic telemetry into your queries.
              </p>

              <h3 style={{ color: '#0f172a', fontSize: '24px', fontWeight: '800' }}>The Limitation of Standard VPNs and Proxies</h3>
              <p>
                Many SEO beginners rely on a <strong>proxy</strong> or a commercial <strong>VPN</strong> to check their rankings in other cities. However, Google's sophisticated anti-bot algorithms are highly trained to recognize the IP ranges used by these services. When you use a data-center-based <strong>proxy</strong>, Google often serves you "sanitized" or generic results, which do not reflect the actual local pack or organic rankings seen by a real resident of that area. Our platform solves this by utilizing a distributed residential node network that mimics authentic human behavior, ensuring your <strong>google location changer</strong> strategy remains invisible and accurate.
              </p>

              <div style={{ padding: '40px', background: '#f8fafc', borderRadius: '32px', borderLeft: '6px solid var(--accent)' }}>
                <h4 style={{ color: '#0f172a', marginBottom: '15px', fontWeight: '800' }}>Why Geo-Targeting Matters More Than Ever</h4>
                <p>
                  Google's "Venice" update changed the search game forever by prioritizing local intent for broad queries. If someone searches for "best SEO agency," the results in New York will be vastly different from those in London. To compete globally, you need to see exactly what those local users see. A <strong>location changer</strong> allows you to audit these variations in real-time, helping you adjust your on-page SEO and GMB (Google My Business) strategy for every specific market you target.
                </p>
              </div>

              <h3 style={{ color: '#0f172a', fontSize: '24px', fontWeight: '800' }}>Mastering Local Search with Advanced Proxy Intelligence</h3>
              <p>
                When you deploy our <strong>residential proxy network</strong>, you aren't just changing your IP; you are adopting a digital identity native to your target city. This enables you to track the "Local 3-Pack" on Google Maps with surgical precision. Whether you are managing SEO for a multi-location franchise or a local service business, having access to an untainted <strong>location changer</strong> ensures that your client reports are backed by verified, real-world data. No more guessing why your rankings look different on your phone versus your client's office - with Ranking Anywhere, everyone sees the same truth.
              </p>

              <p>
                Finally, integrating a <strong>Google location changer</strong> into your daily workflow saves hours of manual labor. Instead of manually switching <strong>VPN</strong> servers and clearing cookies for every search, our automated system handles the heavy lifting. You can queue hundreds of keywords across dozens of locations and receive a unified historical rank matrix. This is the difference between an amateur "manual check" and a professional SEO intelligence operation.
              </p>
           </div>
        </div>
      </section>

      {/* DEEP DATA SECTION */}
      <section style={{ padding: '40px 24px', background: '#0f172a', color: '#fff' }}>
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
      <section className="cta-section" style={{ padding: '40px 24px', textAlign: 'center', background: '#fff' }}>
        <h2 style={{ fontSize: '48px', fontWeight: '900', marginBottom: '20px' }}>Ready to outrank the competition?</h2>
        <p style={{ color: '#64748b', fontSize: '18px', marginBottom: '50px' }}>Join the next generation of SEO professionals using high-precision data.</p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
           <Link to="/register" className="btn-primary-large" style={{ padding: '22px 60px', background: 'var(--accent)', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontWeight: '900' }}>Create Your Free Node</Link>
           <Link to="/how-to-use" style={{ padding: '22px 60px', background: '#f1f5f9', border: 'none', color: '#0f172a', fontWeight: '900', borderRadius: '4px', textDecoration: 'none' }}>Learn the Workflow</Link>
        </div>
      </section>

      <FAQSection />

      {/* CONTENT ACCESS SECTION */}
      <section style={{ padding: '20px 24px', background: '#f1f5f9' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', background: '#1D2B44', borderRadius: '40px', padding: '60px', color: '#fff', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--accent)', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.2 }}></div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: '40px', fontWeight: '900', marginBottom: '20px' }}>Access Global Ranking Intelligence</h2>
            <p style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '40px', maxWidth: '700px', margin: '0 auto 40px auto' }}>
              Instantly audit keywords, check IP locations, and monitor SERP movements from any city on earth. No VPN or extra proxies required.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
               {[
                 { label: 'Rank Tracker', path: '/free-check' },
                 { label: 'IP Intelligence', path: '/check-ip' },
                 { label: 'Whois Audit', path: '/whois' }
               ].map((item, i) => (
                 <Link key={i} to={item.path} style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', textDecoration: 'none', fontWeight: '800', transition: 'all 0.3s ease' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                   {item.label}
                 </Link>
               ))}
            </div>
            <Link to="/register" style={{ display: 'inline-block', background: 'var(--accent)', color: '#fff', textDecoration: 'none', padding: '18px 45px', borderRadius: '12px', fontWeight: '900', fontSize: '18px', boxShadow: '0 10px 30px rgba(245, 158, 11, 0.3)' }}>Start Full Access Now</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
