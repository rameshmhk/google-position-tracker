import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Helmet } from 'react-helmet-async';

const UserGuide = () => {
  const sections = [
    {
      id: 'dashboard',
      title: '1. Dashboard & Navigation',
      image: '/assets/guide/dashboard.png',
      content: `The Ranking Anywhere dashboard is your command center. Here you can see your global health at a glance.
      - **Project List**: All your tracked domains.
      - **Quick Stats**: Total keywords, average rank, and visibility score.
      - **The Matrix**: The main table shows current positions versus previous scans.`
    },
    {
      id: 'ranks',
      title: '2. Understanding Rank Symbols',
      content: `We use specific codes to help you identify where you stand:
      - **P1, P2...**: This is your Organic Web result (e.g., P1 = Page 1, Position 1).
      - **M1, M2...**: This is your Google Maps / Local Pack result.
      - **L1, L2...**: This refers to Local Place listings or Local Finder positions.
      - **DNS**: Did Not Show (Your site was not found in the top results).`
    },
    {
      id: 'location',
      title: '3. Adding Locations & UULE',
      image: '/assets/guide/maps.png',
      content: `Local SEO is about precision. When adding a project:
      - **Country/City**: Choose your target market.
      - **GPS Precision**: You can inject a specific Latitude/Longitude for street-level tracking.
      - **UULE Logic**: Our system automatically encodes your location into a UULE string, tricking Google into showing results exactly as a local resident would see them.`
    },
    {
      id: 'scanners',
      title: '4. Scanners: API vs Proxy',
      content: `Choose the right engine for the job:
      - **API Stream**: High-speed cloud tracking for thousands of keywords. Best for broad tracking.
      - **Direct Proxy**: The "Real Browser" method. It simulates a human typing. Best for hyper-accurate local map verification or when results are highly volatile.`
    },
    {
      id: 'reports',
      title: '5. Comparison & Reports',
      content: `Use the 'Comparison Matrix' to see your SEO growth:
      - **Daily vs Weekly**: See how your rank changed from yesterday or last week.
      - **Green/Red Indicators**: Instantly spot gains or drops.
      - **Exporting**: Use the 'Export CSV' button to get client-ready reports in seconds.`
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <Helmet>
        <title>User Guide | Ranking Anywhere Documentation</title>
        <meta name="description" content="Complete user guide for Ranking Anywhere. Learn how to track rankings, manage proxies, and understand SEO metrics." />
      </Helmet>

      <Navbar />

      {/* Header */}
      <header style={{ background: 'radial-gradient(circle at 70% 30%, #1e293b, #0f172a)', padding: '120px 24px', color: '#fff' }}>
         <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'inline-block', background: 'rgba(255,153,0,0.1)', border: '1px solid rgba(255,153,0,0.3)', padding: '6px 15px', borderRadius: '100px', color: 'var(--accent)', fontSize: '11px', fontWeight: '900', letterSpacing: '2px', marginBottom: '30px' }}
            >
              KNOWLEDGE BASE v2.1
            </motion.div>
            <h1 style={{ fontSize: '56px', fontWeight: '900', marginBottom: '20px', letterSpacing: '-3px' }}>The Master Guide</h1>
            <p style={{ fontSize: '20px', color: '#94a3b8', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>
              Everything you need to know about tracking, precision data, and dominating your local search market.
            </p>
         </div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '80px auto', padding: '0 24px' }}>
         <div style={{ display: 'flex', gap: '60px' }}>
            
            {/* Sidebar Nav */}
            <aside style={{ width: '250px', position: 'sticky', top: '100px', height: 'fit-content', display: 'none', md: 'block' }}>
               <h4 style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '2px', color: '#0f172a', marginBottom: '25px' }}>CHAPTERS</h4>
               <ul style={{ listStyle: 'none', padding: 0 }}>
                  {sections.map(s => (
                    <li key={s.id} style={{ marginBottom: '15px' }}>
                       <a href={`#${s.id}`} style={{ textDecoration: 'none', color: '#64748b', fontSize: '15px', fontWeight: '600', transition: 'color 0.2s' }}>{s.title}</a>
                    </li>
                  ))}
               </ul>
            </aside>

            {/* Content */}
            <div style={{ flex: 1 }}>
               {sections.map((s, i) => (
                 <section id={s.id} key={s.id} style={{ marginBottom: '100px' }}>
                    <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', marginBottom: '30px', letterSpacing: '-1px' }}>{s.title}</h2>
                    
                    {s.image && (
                      <div style={{ background: '#f8fafc', borderRadius: '30px', padding: '40px', marginBottom: '40px', border: '1px solid #f1f5f9' }}>
                         <img src={s.image} alt={s.title} style={{ width: '100%', borderRadius: '15px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
                      </div>
                    )}

                    <div style={{ fontSize: '17px', color: '#475569', lineHeight: '1.8', fontWeight: '500' }}>
                       {s.content.split('\n').map((line, li) => (
                         <p key={li} style={{ marginBottom: '20px' }}>
                            {line.startsWith('- ') ? (
                              <div style={{ display: 'flex', gap: '12px' }}>
                                 <span style={{ color: 'var(--accent)', fontWeight: '900' }}>•</span>
                                 <span>{line.substring(2)}</span>
                              </div>
                            ) : line}
                         </p>
                       ))}
                    </div>
                 </section>
               ))}
            </div>
         </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserGuide;
