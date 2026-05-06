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
    <nav className="navbar" style={{ background: '#1D2B44', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
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
      `}</style>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" style={{ color: '#fff', fontWeight: '900', letterSpacing: '-0.8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--accent)', fontSize: '24px' }}>▲</span> Ranking Anywhere <span style={{ fontWeight: '400', opacity: 0.7, fontStyle: 'normal', fontSize: '14px', marginLeft: '4px' }}>PRO</span>
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className={`nav-menu-wrapper ${isMenuOpen ? 'active' : ''}`}>
            <ul className="nav-menu">
              <li><Link to="/guide" style={{ color: '#cbd5e1' }} onClick={() => setIsMenuOpen(false)}>Master Guide</Link></li>
              <li><Link to="/check-ip" style={{ color: '#cbd5e1' }} onClick={() => setIsMenuOpen(false)}>IP Checker</Link></li>
              <li><Link to="/whois" style={{ color: '#cbd5e1' }} onClick={() => setIsMenuOpen(false)}>Whois Lookup</Link></li>
              <li><Link to="/keywords" style={{ color: '#cbd5e1' }} onClick={() => setIsMenuOpen(false)}>Keywords</Link></li>
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
                  onClick={() => setIsMenuOpen(false)}
                >
                  Live Rank Tracker
                </Link>
              </li>
              {user ? (
                <>
                  <li><Link to="/dashboard" style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: '4px' }} onClick={() => setIsMenuOpen(false)}>Dashboard</Link></li>
                  <li><button onClick={() => { logout(); setIsMenuOpen(false); }} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Logout</button></li>
                </>
              ) : (
                <>
                  <li><Link to="/login" style={{ color: '#fff' }} onClick={() => setIsMenuOpen(false)}>Sign in</Link></li>
                  <li><Link to="/register" className="nav-btn" style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '800' }} onClick={() => setIsMenuOpen(false)}>Start for Free</Link></li>
                </>
              )}
            </ul>
          </div>

          <button className="navbar-burger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
