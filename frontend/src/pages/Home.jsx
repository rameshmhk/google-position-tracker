import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';

const Home = () => {
  return (
    <div className="landing-page">
      <Navbar />
      
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
            <Link to="/register" className="btn-primary-large" style={{ background: 'var(--accent)', color: '#fff', borderRadius: '4px', border: 'none', padding: '20px 50px', fontSize: '1.2rem', fontWeight: '900' }}>Start for Free</Link>
            <Link to="/about" className="btn-secondary-large" style={{ background: 'transparent', border: '2px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', padding: '18px 48px', fontSize: '1.2rem' }}>Learn More</Link>
          </motion.div>
        </div>
      </header>

      <section className="features" style={{ maxWidth: '1200px', margin: '80px auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', padding: '40px 24px' }}>
        <motion.div 
          className="feature-card"
          whileHover={{ translateY: -5 }}
          style={{ background: '#fff', border: '1px solid #e1e1e1', padding: '50px 40px', borderRadius: '4px', textAlign: 'left', boxShadow: 'none' }}
        >
          <div className="feature-icon" style={{ fontSize: '32px', marginBottom: '24px', opacity: 0.8 }}>⚡</div>
          <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '16px', color: '#1D2B44' }}>Site Explorer Stack</h3>
          <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '15px' }}>Get organic search data in seconds with our high-precision technical engine built for enterprise scale.</p>
        </motion.div>
        <motion.div 
          className="feature-card"
          whileHover={{ translateY: -5 }}
          style={{ background: '#fff', border: '1px solid #e1e1e1', padding: '50px 40px', borderRadius: '4px', textAlign: 'left', boxShadow: 'none' }}
        >
          <div className="feature-icon" style={{ fontSize: '32px', marginBottom: '24px', opacity: 0.8 }}>📍</div>
          <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '16px', color: '#1D2B44' }}>Keywords Explorer</h3>
          <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '15px' }}>Track positions at the city level or via exact GPS metadata for hyper-local dominance in any market.</p>
        </motion.div>
        <motion.div 
          className="feature-card"
          whileHover={{ translateY: -5 }}
          style={{ background: '#fff', border: '1px solid #e1e1e1', padding: '50px 40px', borderRadius: '4px', textAlign: 'left', boxShadow: 'none' }}
        >
          <div className="feature-icon" style={{ fontSize: '32px', marginBottom: '24px', opacity: 0.8 }}>📈</div>
          <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '16px', color: '#1D2B44' }}>Rank Tracker Pro</h3>
          <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '15px' }}>Generate professional audit reports with one click. Real-time data sync for high-stakes SEO management.</p>
        </motion.div>
      </section>

      <section className="cta-section">
        <h2>Ready to boost your SEO?</h2>
        <p>Join hundreds of SEO pros who trust RankTracker Pro for their daily audits.</p>
        <Link to="/register" className="btn-primary-large">Create Your Account</Link>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
