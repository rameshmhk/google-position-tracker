import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Professional SVG Icons for Social Accounts
  const SocialIcons = {
    Facebook: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.77,7.46H14.5v-1.9c0-.9.6-1.1,1-1.1h3V.33L14.17.3c-4.13,0-5.07,3.1-5.07,5.07v2.1H6.27v4.4h2.83V23.66h5.4V11.87h3.63Z"/></svg>
    ),
    TwitterX: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    ),
    LinkedIn: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22.23,0H1.77C.8,0,0,.77,0,1.72V22.28c0,.95,.8,1.72,1.77,1.72H22.23c.97,0,1.77-.77,1.77-1.72V1.72c0-.95-.8-1.72-1.77-1.72ZM7.12,20.45H3.56V9h3.56v11.45ZM5.34,7.43c-1.14,0-2.06-.92-2.06-2.06s.92-2.06,2.06-2.06,2.06,.92,2.06,2.06-.92,2.06-2.06,2.06ZM20.45,20.45h-3.56v-5.61c0-1.34-.03-3.06-1.86-3.06-1.86,0-2.15,1.46-2.15,2.96v5.71h-3.56V9h3.41v1.56h.05c.48-.9,1.64-1.85,3.37-1.85,3.6,0,4.27,2.37,4.27,5.45v6.29Z"/></svg>
    ),
    Instagram: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2.16c3.2,0,3.58,.01,4.85,.07,1.17,.05,1.81,.25,2.23,.41,.56,.22,.95,.48,1.37,.9,.42,.42,.68,.81,.9,1.37,.16,.42,.36,1.06,.41,2.23,.06,1.27,.07,1.65,.07,4.85s-.01,3.58-.07,4.85c-.05,1.17-.25,1.81-.41,2.23-.22,.56-.48,.95-.9,1.37-.42,.42-.81,.68-1.37,.9-.42,.16-1.06,.36-2.23,.41-1.27,.06-1.65,.07-4.85,.07s-3.58-.01-4.85-.07c-1.17-.05-1.81-.25-2.23-.41-.56-.22-.95-.48-1.37-.9-.42,.42-.68,.81-.9,1.37-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58,.07-4.85c.05-1.17,.25-1.81,.41-2.23,.22-.56,.48-.95,.9-1.37,.42-.42,.81-.68,1.37-.9,.42-.16,1.06-.36,2.23-.41,1.27-.06,1.65-.07,4.85-.07m0-2.16C8.74,0,8.33,.01,7.05,.07c-1.28,.06-2.15,.26-2.91,.56-.79,.31-1.45,.72-2.12,1.38C1.36,2.68,.95,3.34,.64,4.13,.34,4.89,.14,5.76,.08,7.04,.02,8.32,0,8.73,0,12s.02,3.68,.08,4.96c.06,1.28,.26,2.15,.56,2.91,.31,.79,.72,1.45,1.38,2.11,.66,.66,1.32,1.07,2.11,1.38,.76,.3,1.63,.5,2.91,.56,1.28,.06,1.69,.07,4.96,.07s3.68-.02,4.96-.08c1.28-.06,2.15-.26,2.91-.56,.78-.31,1.45-.72,2.11-1.38,.66-.66,1.07-1.32,1.38-2.11,.3-.76,.5-1.63,.56-2.91,.06-1.28,.07-1.69,.07-4.96s-.02-3.68-.08-4.96c-.06-1.28-.26-2.15-.56-2.91-.31-.79-.72-1.45-1.38-2.11-.66-.66-1.32-1.07-2.11-1.38-.76-.3-1.63-.5-2.91-.56-1.28-.06-1.69-.07-4.96-.07Z"/><path d="M12,5.84c-3.4,0-6.16,2.76-6.16,6.16s2.76,6.16,6.16,6.16,6.16-2.76,6.16-6.16-2.76-6.16-6.16-6.16m0,10.16c-2.21,0-4-1.79-4-4s1.79-4,4-4,4,1.79,4,4-1.79,4-4,4"/><path d="M18.41,4.15c-.79,0-1.44,.64-1.44,1.44s.64,1.44,1.44,1.44,1.44-.64,1.44-1.44-.64-1.44-1.44-1.44"/></svg>
    )
  };

  return (
    <footer className="landing-footer" style={{ 
      background: '#0F172A', 
      borderTop: '1px solid rgba(255,153,0,0.1)', 
      padding: '100px 24px 40px', 
      color: '#fff',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        .footer-link { color: #94a3b8; text-decoration: none; font-size: 14px; transition: 0.2s; font-weight: 500; }
        .footer-link:hover { color: var(--accent); padding-left: 5px; }
        .social-link { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; color: #64748b; transition: 0.3s; border: 1px solid rgba(255,255,255,0.05); cursor: pointer; text-decoration: none; }
        .social-link:hover { background: var(--accent); color: #fff; transform: translateY(-3px); box-shadow: 0 10px 20px rgba(255,153,0,0.2); border-color: var(--accent); }
        .status-pulse { position: relative; display: flex; align-items: center; gap: 10px; padding: 12px 18px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); backdrop-filter: blur(10px); }
        .pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; position: relative; }
        .pulse-dot::after { content: ''; position: absolute; width: 100%; height: 100%; background: #10b981; border-radius: 50%; animation: pulse-ring 2s infinite; }
        @keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(2.5); opacity: 0; } }
      `}</style>

      {/* Subtle Background Glow */}
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,153,0,0.03)', filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' }}></div>

      <div className="footer-container" style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '60px' }}>
        
        {/* BRANDING SECTION */}
        <div className="footer-section">
          <div style={{ color: '#fff', fontSize: '22px', fontWeight: '900', letterSpacing: '-0.8px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--accent)', fontSize: '24px' }}>▲</span> Ranking Anywhere <span style={{ fontWeight: '400', opacity: 0.4, fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', letterSpacing: '1px' }}>ELITE</span>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.7', marginBottom: '30px', maxWidth: '280px' }}>
            The definitive SEO intelligence engine for global enterprises and performance-obsessed marketing teams.
          </p>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-link" title="Facebook">{SocialIcons.Facebook}</a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-link" title="Twitter/X">{SocialIcons.TwitterX}</a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="social-link" title="LinkedIn">{SocialIcons.LinkedIn}</a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-link" title="Instagram">{SocialIcons.Instagram}</a>
          </div>
        </div>

        {/* SEARCH SOLUTIONS LINKS */}
        <div className="footer-section">
          <h4 style={{ fontSize: '11px', fontWeight: '900', color: '#fff', marginBottom: '30px', letterSpacing: '1.5px', textTransform: 'uppercase', opacity: 0.9 }}>Search Solutions</h4>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <li><Link to="/free-check" className="footer-link">Global Rank Checker</Link></li>
            <li><Link to="/register" className="footer-link">Keywords Explorer</Link></li>
            <li><Link to="/register" className="footer-link">Bulk Rank Tracker</Link></li>
            <li><Link to="/dashboard" className="footer-link">Enterprise Console</Link></li>
          </ul>
        </div>

        {/* COMPANY & SUPPORT LINKS */}
        <div className="footer-section">
          <h4 style={{ fontSize: '11px', fontWeight: '900', color: '#fff', marginBottom: '30px', letterSpacing: '1.5px', textTransform: 'uppercase', opacity: 0.9 }}>Company & Support</h4>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <li><Link to="/about" className="footer-link">About Our Node</Link></li>
            <li><Link to="/how-to-use" className="footer-link">Quick Start Guide</Link></li>
            <li><Link to="/guide" className="footer-link">The Master Guide</Link></li>
            <li><Link to="/contact" className="footer-link">Contact Support</Link></li>
            <li><Link to="/terms" className="footer-link">Privacy & Terms</Link></li>
          </ul>
        </div>

        {/* ABOUT US SECTION */}
        <div className="footer-section">
          <h4 style={{ fontSize: '11px', fontWeight: '900', color: '#fff', marginBottom: '30px', letterSpacing: '1.5px', textTransform: 'uppercase', opacity: 0.9 }}>About Us</h4>
          <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.7', marginBottom: '20px' }}>
            Ranking Anywhere Elite provides hyper-accurate, real-time SEO intelligence. Our global anycast network ensures you see the SERP exactly as your local customers do, anywhere in the world.
          </p>
        </div>

      </div>

      {/* COPYRIGHT AREA */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '80px auto 0 auto', 
        paddingTop: '30px', 
        borderTop: '1px solid rgba(255,255,255,0.05)', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <p style={{ color: '#475569', fontSize: '11px', margin: 0, textAlign: 'center' }}>
          &copy; {currentYear} Ranking Anywhere Elite Global. All ranking and audit data is fully encrypted and real-time.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
