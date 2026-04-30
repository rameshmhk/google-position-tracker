import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import API_BASE_URL from '../../config/apiConfig';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null); // { type: 'error' | 'success', message: '' }
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      // We show success even if the email doesn't exist for security reasons
      setStatus({ type: 'success', message: data.message || 'If this email exists, a reset link has been sent.' });
      
    } catch (err) {
      setStatus({ type: 'error', message: 'Connection error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Navbar />
      <div className="auth-container" style={{ borderRadius: '4px', border: '1px solid #e1e1e1', boxShadow: 'none' }}>
        <div className="auth-visual" style={{ background: '#1D2B44', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px', color: '#fff' }}>
           <div style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '2px', color: '#94a3b8', marginBottom: '20px' }}>ACCOUNT RECOVERY</div>
           <h2 style={{ fontSize: '2.5rem', fontWeight: '900', textAlign: 'center', lineHeight: '1.1', marginBottom: '30px' }}>Forgot your <br /><span style={{ color: 'var(--accent)' }}>Password?</span></h2>
           <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>Don't worry, we'll send you a link to reset it and get you back into the dashboard.</p>
        </div>
        <div className="auth-form-container" style={{ background: '#fff', padding: '60px' }}>
          {status && status.type === 'success' ? (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1D2B44', marginBottom: '20px' }}>Check Your Email</h2>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '20px', borderRadius: '4px', marginBottom: '30px', fontSize: '15px', lineHeight: '1.6' }}>
                {status.message}
              </div>
              <Link to="/login" className="btn-primary-full" style={{ display: 'block', background: 'var(--accent)', color: '#fff', border: 'none', height: '56px', borderRadius: '4px', fontSize: '16px', fontWeight: '900', lineHeight: '56px', textDecoration: 'none' }}>
                Return to Login
              </Link>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit} style={{ border: 'none', padding: 0 }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1D2B44', marginBottom: '10px' }}>Reset Password</h2>
              <p style={{ color: '#64748b', marginBottom: '40px', fontSize: '15px' }}>Enter your email address to receive a reset link.</p>
              
              {status && status.type === 'error' && <div className="auth-error" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: '13px' }}>{status.message}</div>}
              
              <div className="form-group" style={{ marginBottom: '30px' }}>
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
              
              <button type="submit" disabled={loading} className="btn-primary-full" style={{ background: 'var(--accent)', color: '#fff', border: 'none', height: '56px', borderRadius: '4px', fontSize: '16px', fontWeight: '900', cursor: 'pointer', width: '100%' }}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              
              <div className="auth-footer" style={{ marginTop: '40px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
                Remembered your password?{' '}<Link to="/login" style={{ color: 'var(--primary)', fontWeight: '700' }}>Sign in</Link>
              </div>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
