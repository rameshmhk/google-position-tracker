import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Helmet } from 'react-helmet-async';

const HowToUse = () => {
  const steps = [
    {
      number: '01',
      title: 'Initialize Your Project',
      desc: 'Start by adding your target domain and business name. Our system will automatically calibrate for global or local tracking.',
      icon: '📁'
    },
    {
      number: '02',
      title: 'Configure Geographic Nodes',
      desc: 'Select your target country and city. For hyper-local tracking, inject specific postal codes or coordinates.',
      icon: '📍'
    },
    {
      number: '03',
      title: 'Add Target Keywords',
      desc: 'Input your keyword inventory. You can choose between "API Stream" for speed or "Direct Proxy" for real-browser accuracy.',
      icon: '⌨️'
    },
    {
      number: '04',
      title: 'Analyze & Scale',
      desc: 'Use the Keyword Comparison Matrix to track daily and weekly movements. Scale your tracking as your business grows.',
      icon: '📈'
    }
  ];

  const faqs = [
    { q: "What is UULE injection?", a: "UULE is a Google parameter that encodes location data. We use it to trick Google into showing results for a specific street or city, no matter where you actually are." },
    { q: "Can I track Google Maps rankings?", a: "Yes. Our system specifically looks for the 'Local Pack' and 'Maps' results using specialized scraping signatures." },
    { q: "What is the difference between API Stream and Direct Proxy?", a: "API Stream uses our high-speed cloud infrastructure for fast results. Direct Proxy uses physical hardware nodes for 100% real-world verification." }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Helmet>
        <title>How to Use | Ranking Anywhere Guide</title>
        <meta name="description" content="Step-by-step guide on how to use Ranking Anywhere for SEO rank tracking and site audits." />
      </Helmet>

      <Navbar />

      <header style={{ background: '#1D2B44', padding: '100px 24px', color: '#fff', textAlign: 'center' }}>
         <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '3px', marginBottom: '20px' }}>OPERATIONAL GUIDE</div>
            <h1 style={{ fontSize: '48px', fontWeight: '900', marginBottom: '20px', letterSpacing: '-2px' }}>Mastering Ranking Anywhere</h1>
            <p style={{ fontSize: '18px', color: '#94a3b8', lineHeight: '1.6' }}>Learn how to leverage our high-precision infrastructure to gain a competitive SEO edge.</p>
         </div>
      </header>

      <main style={{ maxWidth: '1100px', margin: '-50px auto 100px auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>
         
         {/* Steps Grid */}
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px', marginBottom: '100px' }}>
            {steps.map((s, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                style={{ background: '#fff', padding: '50px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.03)' }}
              >
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                    <div style={{ fontSize: '40px' }}>{s.icon}</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#f1f5f9' }}>{s.number}</div>
                 </div>
                 <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', marginBottom: '15px' }}>{s.title}</h3>
                 <p style={{ color: '#64748b', lineHeight: '1.7', fontSize: '15px' }}>{s.desc}</p>
              </motion.div>
            ))}
         </div>

         {/* Visual Section */}
         <section style={{ background: '#0f172a', borderRadius: '40px', padding: '80px', color: '#fff', marginBottom: '100px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '40px' }}>High-Precision Data Visualized</h2>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '3px', marginBottom: '20px' }}>[ INTERACTIVE MAP PREVIEW ]</div>
                  <p style={{ color: '#64748b', maxWidth: '400px' }}>Our interface shows you exactly where your brand appears in the Local 3-Pack across different street levels.</p>
               </div>
            </div>
         </section>

         {/* FAQ SECTION */}
         <section style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
               <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a' }}>Frequently Asked Questions</h2>
            </div>
            <div style={{ display: 'grid', gap: '20px' }}>
               {faqs.map((f, i) => (
                 <div key={i} style={{ background: '#fff', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ fontSize: '17px', fontWeight: '900', color: '#0f172a', marginBottom: '12px' }}>Q: {f.q}</h4>
                    <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '15px' }}>{f.a}</p>
                 </div>
               ))}
            </div>
         </section>

      </main>

      <Footer />
    </div>
  );
};

export default HowToUse;
