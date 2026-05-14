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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2.16c3.2,0,3.58,.01,4.85,.07,1.17,.05,1.81,.25,2.23,.41,.56,.22,.95,.48,1.37,.9,.42,.42,.68,.81,.9,1.37,.16,.42,.36,1.06,.41,2.23,.06,1.27,.07,1.65,.07,4.85s-.01,3.58-.07,4.85c-.05,1.17-.25,1.81-.41,2.23-.22,.56-.48,.95-.9,1.37-.42,.42-.81,.68-1.37,.9-.42,.16-1.06,.36-2.23,.41-1.27,.06-1.65,.07-4.85,.07s-3.58-.01-4.85-.07c-1.17-.05-1.81-.25-2.23-.41-.56-.22-.95-.48-1.37-.9-.42,.42-.68,.81-.9,1.37-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58,.07-4.85c.05-1.17,.25-1.81,.41-2.23,.22-.56,.48,.95,.9-1.37,.42-.42,.81-.68,1.37-.9,.42-.16,1.06-.36,2.23-.41,1.27-.06,1.65-.07,4.85-.07m0-2.16C8.74,0,8.33,.01,7.05,.07c-1.28,.06-2.15,.26-2.91,.56-.79,.31-1.45,.72-2.12,1.38C1.36,2.68,.95,3.34,.64,4.13,.34,4.89,.14,5.76,.08,7.04,.02,8.32,0,8.73,0,12s.02,3.68,.08,4.96c.06,1.28,.26,2.15,.56,2.91,.31,.79,.72,1.45,1.38,2.11,.66,.66,1.32,1.07,2.11,1.38,.76,.3,1.63,.5,2.91,.56,1.28,.06,1.69,.07,4.96,.07s3.68-.02,4.96-.08c1.28-.06,2.15-.26,2.91-.56,.78-.31,1.45-.72,2.11-1.38,.66-.66,1.07-1.32,1.38-2.11,.3-.76,.5-1.63,.56-2.91,.06-1.28,.07-1.69,.07-4.96s-.02-3.68-.08-4.96c-.06-1.28-.26-2.15-.56-2.91-.31-.79-.72-1.45-1.38-2.11-.66-.66,1.32-1.07-2.11-1.38-.76-.3-1.63-.5-2.91-.56-1.28-.06-1.69-.07-4.96-.07Z"/><path d="M12,5.84c-3.4,0-6.16,2.76-6.16,6.16s2.76,6.16,6.16,6.16,6.16-2.76,6.16-6.16-2.76-6.16-6.16-6.16m0,10.16c-2.21,0-4-1.79-4-4s1.79-4,4-4,4,1.79,4,4-1.79,4-4,4"/><path d="M18.41,4.15c-.79,0-1.44,.64-1.44,1.44s.64,1.44,1.44,1.44,1.44-.64,1.44-1.44-.64-1.44-1.44-1.44"/></svg>
    )
  };

  return (
    <footer className="landing-footer" style={{ 
      background: '#0F172A', 
      borderTop: '1px solid rgba(255,153,0,0.1)', 
      padding: '0', 
      color: '#fff',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        .footer-link { color: #94a3b8; text-decoration: none; font-size: 14px; transition: 0.2s; font-weight: 500; display: block; width: fit-content; }
        .footer-link:hover { color: var(--accent); transform: translateX(5px); }
        .social-link { width: 44px; height: 44px; border-radius: 12px; background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; color: #64748b; transition: 0.3s; border: 1px solid rgba(255,255,255,0.05); cursor: pointer; text-decoration: none; }
        .social-link:hover { background: var(--accent); color: #fff; transform: translateY(-3px); box-shadow: 0 10px 25px rgba(255,153,0,0.25); border-color: var(--accent); }
        .footer-newsletter input { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 12px 20px; border-radius: 8px; color: #fff; width: 100%; font-size: 14px; outline: none; transition: 0.3s; }
        .footer-newsletter input:focus { border-color: var(--accent); background: rgba(255,255,255,0.05); }

        @media (max-width: 768px) {
          .footer-container { 
            grid-template-columns: 1fr !important; 
            gap: 40px !important; 
            text-align: center !important;
          }
          .footer-section {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .footer-section ul {
            align-items: center;
          }
          .footer-newsletter {
            flex-direction: column !important;
            width: 100% !important;
          }
          .footer-newsletter button {
            width: 100% !important;
          }
          .footer-section h4 {
            margin-bottom: 15px !important;
          }
        }
      `}</style>

      <div className="footer-main" style={{ padding: '60px 24px', position: 'relative' }}>
         <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', height: '100%', background: 'radial-gradient(circle at 10% 90%, rgba(255,153,0,0.02), transparent 40%)', pointerEvents: 'none' }}></div>
         
         <div className="footer-container" style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr', gap: '60px' }}>
            
            {/* BRANDING */}
            <div className="footer-section">
               <div style={{ color: '#fff', fontSize: '24px', fontWeight: '900', letterSpacing: '-0.8px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: 'var(--accent)', fontSize: '28px' }}>&#9650;</span> Ranking Anywhere
               </div>
               <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.8', marginBottom: '30px', maxWidth: '400px' }}>
                  Empowering SEO professionals with untainted, high-precision rank tracking data and location intelligence infrastructure.
               </p>
               <div style={{ display: 'flex', gap: '10px' }}>
                  <a href="#" className="social-link">{SocialIcons.Facebook}</a>
                  <a href="#" className="social-link">{SocialIcons.TwitterX}</a>
                  <a href="#" className="social-link">{SocialIcons.LinkedIn}</a>
                  <a href="#" className="social-link">{SocialIcons.Instagram}</a>
               </div>
            </div>

            {/* SOLUTIONS */}
            <div className="footer-section">
               <h4 style={{ fontSize: '12px', fontWeight: '900', color: '#fff', marginBottom: '30px', letterSpacing: '1px', textTransform: 'uppercase' }}>Intelligence</h4>
               <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <li><Link to="/keywords" className="footer-link">Keywords</Link></li>
                  <li><Link to="/ad-tracker" className="footer-link">Ad Tracker</Link></li>
                  <li><Link to="/free-check" className="footer-link">Live Rank Checker</Link></li>
                  <li><Link to="/check-ip" className="footer-link">IP Intelligence</Link></li>
                  <li><Link to="/whois" className="footer-link">Whois Audit</Link></li>
               </ul>
            </div>

            {/* COMPANY */}
            <div className="footer-section">
               <h4 style={{ fontSize: '12px', fontWeight: '900', color: '#fff', marginBottom: '30px', letterSpacing: '1px', textTransform: 'uppercase' }}>Resources</h4>
               <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <li><Link to="/guide" className="footer-link">Master Guide</Link></li>
                  <li><Link to="/how-to-use" className="footer-link">Workflow Guide</Link></li>
                  <li><Link to="/contact" className="footer-link">Priority Support</Link></li>
                  <li><Link to="/terms" className="footer-link">Privacy Policy</Link></li>
               </ul>
            </div>

            {/* NEWSLETTER */}
            <div className="footer-section">
               <h4 style={{ fontSize: '12px', fontWeight: '900', color: '#fff', marginBottom: '30px', letterSpacing: '1px', textTransform: 'uppercase' }}>Stay Informed</h4>
               <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px', lineHeight: '1.6' }}>
                  Join our technical newsletter for the latest SERP updates and SEO strategies.
               </p>
               <div className="footer-newsletter" style={{ display: 'flex', gap: '10px' }}>
                  <input type="email" placeholder="Enter your work email" />
                  <button style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', transition: '0.3s' }}>Join</button>
               </div>
               <div style={{ marginTop: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <img src="https://img.icons8.com/color/24/000000/google-logo.png" style={{ filter: 'grayscale(1)', opacity: 0.4 }} alt="Trust" />
                  <span style={{ fontSize: '11px', color: '#475569', fontWeight: '600' }}>TRUSTED BY 2,000+ SEO AGENCIES</span>
               </div>
            </div>

         </div>
      </div>

      {/* COPYRIGHT AREA */}
      <div style={{ background: '#0a0f1e', padding: '40px 24px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
         <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <p style={{ color: '#475569', fontSize: '12px', margin: 0, textAlign: 'center', lineHeight: '1.6' }}>
               &copy; {currentYear} Ranking Anywhere Elite. All tracking data is verified via distributed residential hardware.
            </p>
            <div style={{ display: 'flex', gap: '30px', justifyContent: 'center' }}>
               <Link to="/terms" style={{ color: '#475569', textDecoration: 'none', fontSize: '12px', fontWeight: '600' }}>Service Terms</Link>
               <Link to="/terms" style={{ color: '#475569', textDecoration: 'none', fontSize: '12px', fontWeight: '600' }}>Security Audit</Link>
            </div>
         </div>
      </div>
    </footer>
  );
};

export default Footer;
