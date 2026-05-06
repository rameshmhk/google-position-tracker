import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import API_BASE_URL from '../../config/apiConfig';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        login(data.user, data.token);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: credentialResponse.credential })
      });
      const data = await res.json();
      if (data.success) {
        login(data.user, data.token);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Google Login failed');
      }
    } catch (err) {
      setError('Google Login failed (Connection error)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Navbar />
      <div className="auth-container" style={{ borderRadius: '4px', border: '1px solid #e1e1e1', boxShadow: 'none' }}>
        <div className="auth-visual" style={{ background: '#1D2B44', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px', color: '#fff' }}>
           <div style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '2px', color: '#94a3b8', marginBottom: '20px' }}>ENTERPRISE AUDIT SUITE</div>
           <h2 style={{ fontSize: '2.5rem', fontWeight: '900', textAlign: 'center', lineHeight: '1.1', marginBottom: '30px' }}>Access your <br /><span style={{ color: 'var(--accent)' }}>SEO Intelligence</span></h2>
           <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>Join 1M+ SEO professionals who rely on our high-precision data every day.</p>
        </div>
        <div className="auth-form-container" style={{ background: '#fff', padding: '60px' }}>
          <form className="auth-form" onSubmit={handleSubmit} style={{ border: 'none', padding: 0 }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1D2B44', marginBottom: '10px' }}>Sign in</h2>
            <p style={{ color: '#64748b', marginBottom: '40px', fontSize: '15px' }}>Enter your work credentials to access the data explorer.</p>
            
            {error && <div className="auth-error" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: '13px' }}>{error}</div>}
            
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#1D2B44', marginBottom: '8px', textTransform: 'uppercase' }}>Work Email</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={{ width: '100%', height: '52px', border: '1px solid #e1e1e1', borderRadius: '2px', padding: '0 20px', background: '#f8f9fa' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '900', color: '#1D2B44', textTransform: 'uppercase', margin: 0 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>Forgot password?</Link>
              </div>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', height: '52px', border: '1px solid #e1e1e1', borderRadius: '2px', padding: '0 20px', background: '#f8f9fa' }}
              />
            </div>
            
            <button type="submit" disabled={loading} className="btn-primary-full" style={{ background: 'var(--accent)', color: '#fff', border: 'none', height: '56px', borderRadius: '4px', fontSize: '16px', fontWeight: '900', cursor: 'pointer', width: '100%' }}>
              {loading ? 'Processing...' : 'Access Dashboard'}
            </button>


            {/* Google Login removed for local development */}
            
            <div className="auth-footer" style={{ marginTop: '40px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
              New to Ranking Anywhere?{' '}<Link to="/register" style={{ color: 'var(--primary)', fontWeight: '700' }}>Create an account</Link>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
