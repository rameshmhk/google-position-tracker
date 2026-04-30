import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import API_BASE_URL from '../../config/apiConfig';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resending, setResending] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    let timer;
    if (success && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [success, resendCountdown]);

  const handleResend = async () => {
    setError('');
    setResending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        setResendCountdown(30);
      } else {
        setError(data.error || 'Failed to resend email');
      }
    } catch (err) {
      setError('Connection error while resending');
    } finally {
      setResending(false);
    }
  };
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setResendCountdown(30);
      } else {
        setError(data.error || 'Registration failed');
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

  if (success) {
    return (
      <div className="auth-page">
        <Navbar />
        <div className="auth-container" style={{justifyContent:'center', alignItems:'center', padding:'100px', textAlign:'center'}}>
          <div style={{maxWidth:'500px'}}>
            <h2 style={{color:'var(--accent-cyan)', marginBottom:'20px'}}>Check Your Inbox! 📧</h2>
            <p style={{fontSize:'18px', lineHeight:'1.6'}}>We have sent an activation link to <strong>{email}</strong>. Please click the link in the email to verify your account.</p>
            {error && <div className="auth-error" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '4px', marginTop: '20px', fontSize: '13px' }}>{error}</div>}
            <div style={{marginTop:'30px', display: 'flex', gap: '15px', justifyContent: 'center'}}>
              <Link to="/login" className="btn-primary-large" style={{flex: 1}}>Go to Login</Link>
              <button 
                onClick={handleResend} 
                disabled={resendCountdown > 0 || resending}
                style={{
                  flex: 1,
                  background: (resendCountdown > 0 || resending) ? '#e2e8f0' : 'transparent',
                  color: (resendCountdown > 0 || resending) ? '#94a3b8' : 'var(--accent-cyan)',
                  border: (resendCountdown > 0 || resending) ? '1px solid #cbd5e1' : '1px solid var(--accent-cyan)',
                  borderRadius: '4px',
                  fontWeight: '700',
                  cursor: (resendCountdown > 0 || resending) ? 'not-allowed' : 'pointer',
                  padding: '0 20px',
                  fontSize: '16px'
                }}
              >
                {resending ? 'Sending...' : resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Email'}
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="auth-page">
      <Navbar />
      <div className="auth-container" style={{ borderRadius: '4px', border: '1px solid #e1e1e1', boxShadow: 'none' }}>
        <div className="auth-visual" style={{ background: '#1D2B44', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px', color: '#fff' }}>
           <div style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '2px', color: '#94a3b8', marginBottom: '20px' }}>ENTERPRISE AUDIT SUITE</div>
           <h2 style={{ fontSize: '2.5rem', fontWeight: '900', textAlign: 'center', lineHeight: '1.1', marginBottom: '30px' }}>Start your <br /><span style={{ color: 'var(--accent)' }}>Free Audit</span></h2>
           <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>Join the community of elite SEO professionals. No credit card required for initial node access.</p>
        </div>
        <div className="auth-form-container" style={{ background: '#fff', padding: '60px' }}>
          <form className="auth-form" onSubmit={handleSubmit} style={{ border: 'none', padding: 0 }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1D2B44', marginBottom: '10px' }}>Create Account</h2>
            <p style={{ color: '#64748b', marginBottom: '40px', fontSize: '15px' }}>Register your professional profile to start tracking.</p>
            
            {error && (
              <div className="auth-error" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: '13px' }}>
                {error}
                {error.toLowerCase().includes('already exists') && (
                  <span style={{ display: 'block', marginTop: '8px' }}>
                    <Link to="/forgot-password" style={{ color: '#b91c1c', fontWeight: 'bold', textDecoration: 'underline' }}>Forgot your password?</Link>
                  </span>
                )}
              </div>
            )}
            
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#1D2B44', marginBottom: '8px', textTransform: 'uppercase' }}>Full Name</label>
              <input 
                type="text" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                style={{ width: '100%', height: '52px', border: '1px solid #e1e1e1', borderRadius: '2px', padding: '0 20px', background: '#f8f9fa' }}
              />
            </div>
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#1D2B44', marginBottom: '8px', textTransform: 'uppercase' }}>Password</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="min. 8 characters"
                style={{ width: '100%', height: '52px', border: '1px solid #e1e1e1', borderRadius: '2px', padding: '0 20px', background: '#f8f9fa' }}
              />
            </div>
            
            <button type="submit" disabled={loading} className="btn-primary-full" style={{ background: 'var(--accent)', color: '#fff', border: 'none', height: '56px', borderRadius: '4px', fontSize: '16px', fontWeight: '900', cursor: 'pointer', width: '100%' }}>
              {loading ? 'Initializing...' : 'Create Account'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '10px', color: 'var(--text-dim)' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
              <span>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
            </div>

            <div style={{display:'flex', justifyContent:'center'}}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Login Failed')}
                theme="filled_black"
                shape="pill"
              />
            </div>
            
            <div className="auth-footer" style={{ marginTop: '40px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
              Already have an account?{' '}<Link to="/login" style={{ color: 'var(--primary)', fontWeight: '700' }}>Sign in</Link>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Register;
