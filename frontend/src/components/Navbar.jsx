import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isLiveRankPage = location.pathname === '/free-check';

  return (
    <>
      <nav className="navbar" style={{ background: '#1D2B44', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 1000 }}>
        <style>{`
          @keyframes menuBlink {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.05); color: #fff; }
            100% { opacity: 1; transform: scale(1); }
          }
          .blinking-menu {
            animation: menuBlink 1.5s infinite ease-in-out;
            display: inline-block;
          }
          .navbar-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 15px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .nav-menu {
            display: flex;
            list-style: none;
            gap: 30px;
            align-items: center;
            margin: 0;
            padding: 0;
          }
          .nav-menu li a {
            text-decoration: none;
            font-size: 14px;
            font-weight: 600;
            transition: color 0.2s;
          }
          .navbar-burger { display: none; }
          .dropdown-content {
            display: none;
            position: absolute;
            top: 100%;
            right: 0;
            background: #fff;
            min-width: 160px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            border-radius: 8px;
            padding: 10px 0;
            z-index: 1000;
            list-style: none;
            opacity: 0;
            visibility: hidden;
            transform: translateY(10px);
            transition: all 0.3s ease;
          }
          .nav-dropdown-item:hover .dropdown-content {
            display: block;
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
          }
          .dropdown-content li a {
            color: #1e293b !important;
            padding: 10px 20px;
            display: block;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
          }
          .dropdown-content li a:hover {
            background: #f1f5f9;
            color: var(--accent) !important;
          }

          /* Mobile Bottom Nav Styles */
          .mobile-bottom-nav {
            display: none;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #111827;
            border-top: 1px solid rgba(255,255,255,0.1);
            padding: 10px 0;
            z-index: 2000;
            justify-content: space-around;
            align-items: center;
          }
          .mobile-nav-link {
            display: flex;
            flex-direction: column;
            align-items: center;
            color: #94a3b8;
            text-decoration: none;
            font-size: 10px;
            font-weight: bold;
            gap: 4px;
          }
          .mobile-nav-link.active {
            color: var(--accent);
          }
          .mobile-nav-icon {
            font-size: 20px;
          }

          @media (max-width: 768px) {
            .nav-menu-wrapper { display: none; }
            .navbar-burger { display: block !important; color: #fff; background: none; border: none; font-size: 24px; cursor: pointer; }
            .mobile-bottom-nav { display: flex; }
            .navbar-container { justify-content: space-between; }
          }
        `}</style>
        <div className="navbar-container">
          <Link to="/" className="navbar-logo" style={{ color: '#fff', fontWeight: '900', letterSpacing: '-0.8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--accent)"><path d="M12 2L2 22h20L12 2z"/></svg> Ranking Anywhere <span style={{ fontWeight: '400', opacity: 0.7, fontStyle: 'normal', fontSize: '14px', marginLeft: '4px' }}>PRO</span>
          </Link>
          
          <div className="nav-menu-wrapper">
            <ul className="nav-menu">
              <li>
                <Link 
                  to="/free-check" 
                  className={!isLiveRankPage ? 'blinking-menu' : ''} 
                  style={{ 
                    color: 'var(--accent)', 
                    fontWeight: '800', 
                    textDecoration: 'none',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    background: isLiveRankPage ? 'rgba(245, 158, 11, 0.1)' : 'transparent'
                  }} 
                >
                  Live Rank Tracker
                </Link>
              </li>
              <li><Link to="/whois" style={{ color: '#cbd5e1' }}>Whois Lookup</Link></li>
              <li><Link to="/check-ip" style={{ color: '#cbd5e1' }}>IP Checker</Link></li>
              {user ? (
                <>
                  <li><Link to="/dashboard" style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: '4px' }}>Dashboard</Link></li>
                  <li><button onClick={() => logout()} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Logout</button></li>
                </>
              ) : (
                <li className="nav-dropdown-item" style={{ position: 'relative' }}>
                  <button className="nav-btn" style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '800', cursor: 'pointer', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Get Started <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                  <ul className="dropdown-content">
                    <li><Link to="/login">Sign In</Link></li>
                    <li><Link to="/register">Register Free</Link></li>
                  </ul>
                </li>
              )}
            </ul>
          </div>

          <button className="navbar-burger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div style={{ position: 'fixed', top: '70px', left: 0, right: 0, background: '#1D2B44', padding: '20px', zIndex: 1001, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
               <li><Link to="/whois" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }} onClick={() => setIsMenuOpen(false)}>Whois Lookup</Link></li>
               <li><Link to="/terms" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }} onClick={() => setIsMenuOpen(false)}>Terms & Privacy</Link></li>
               {user ? (
                 <li><Link to="/dashboard" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 'bold' }} onClick={() => setIsMenuOpen(false)}>My Dashboard</Link></li>
               ) : (
                 <li><Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 'bold' }} onClick={() => setIsMenuOpen(false)}>Login / Sign Up</Link></li>
               )}
            </ul>
          </div>
        )}
      </nav>

      {/* Mobile App Style Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <Link to="/" className={`mobile-nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          <span className="mobile-nav-icon">&#8962;</span>
          <span>Home</span>
        </Link>
        <Link to="/free-check" className={`mobile-nav-link ${location.pathname === '/free-check' ? 'active' : ''}`}>
          <span className="mobile-nav-icon">&#128200;</span>
          <span>Rank</span>
        </Link>
        <Link to="/keywords" className={`mobile-nav-link ${location.pathname === '/keywords' ? 'active' : ''}`}>
          <span className="mobile-nav-icon">&#128269;</span>
          <span>Keywords</span>
        </Link>
        <Link to="/check-ip" className={`mobile-nav-link ${location.pathname === '/check-ip' ? 'active' : ''}`}>
          <span className="mobile-nav-icon">&#128241;</span>
          <span>IP Check</span>
        </Link>
      </div>
    </>
  );
};

export default Navbar;
