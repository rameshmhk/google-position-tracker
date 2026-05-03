import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  return (
    <nav className="navbar" style={{ background: '#1D2B44', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" style={{ color: '#fff', fontWeight: '900', letterSpacing: '-0.8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--accent)', fontSize: '24px' }}>▲</span> Ranking Anywhere <span style={{ fontWeight: '400', opacity: 0.7, fontStyle: 'normal', fontSize: '14px', marginLeft: '4px' }}>PRO</span>
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className={`nav-menu-wrapper ${isMenuOpen ? 'active' : ''}`}>
            <ul className="nav-menu">
              <li><Link to="/" style={{ color: '#cbd5e1' }} onClick={() => setIsMenuOpen(false)}>Site Explorer</Link></li>
              <li><Link to="/about" style={{ color: '#cbd5e1' }} onClick={() => setIsMenuOpen(false)}>Keywords Explorer</Link></li>
              <li><Link to="/free-check" style={{ color: 'var(--accent)', fontWeight: '700' }} onClick={() => setIsMenuOpen(false)}>Live Rank Tracker</Link></li>
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
