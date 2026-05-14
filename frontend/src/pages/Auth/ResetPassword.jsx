import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import API_BASE_URL from '../../config/apiConfig';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState(null); // { type: 'error' | 'success', message: '' }
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Extract token from URL query params
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus({ type: 'error', message: 'Invalid or missing password reset token.' });
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (password !== confirmPassword) {
      return setStatus({ type: 'error', message: 'Passwords do not match.' });
    }
    
    if (password.length < 8) {
      return setStatus({ type: 'error', message: 'Password must be at least 8 characters long.' });
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });
      const data = await res.json();
      
      if (data.success) {
        setStatus({ type: 'success', message: 'Password has been reset successfully. You can now login.' });
      } else {
        setStatus({ type: 'error', message: data.error || 'Failed to reset password.' });
      }
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
           <div style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '2px', color: '#94a3b8', marginBottom: '20px' }}>ACCOUNT SECURITY</div>
           <h2 style={{ fontSize: '2.5rem', fontWeight: '900', textAlign: 'center', lineHeight: '1.1', marginBottom: '30px' }}>Create New <br /><span style={{ color: 'var(--accent)' }}>Password</span></h2>
           <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>Make sure to use a strong and unique password for your RankTracker account.</p>
        </div>
        <div className="auth-form-container" style={{ background: '#fff', padding: '60px' }}>
          {status && status.type === 'success' ? (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1D2B44', marginBottom: '20px' }}>Password Updated! 🎉</h2>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '20px', borderRadius: '4px', marginBottom: '30px', fontSize: '15px', lineHeight: '1.6' }}>
                {status.message}
              </div>
              <Link to="/login" className="btn-primary-full" style={{ display: 'block', background: 'var(--accent)', color: '#fff', border: 'none', height: '56px', borderRadius: '4px', fontSize: '16px', fontWeight: '900', lineHeight: '56px', textDecoration: 'none' }}>
                Go to Login
              </Link>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit} style={{ border: 'none', padding: 0 }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1D2B44', marginBottom: '10px' }}>Set New Password</h2>
              <p style={{ color: '#64748b', marginBottom: '40px', fontSize: '15px' }}>Enter your new password below.</p>
              
              {status && status.type === 'error' && <div className="auth-error" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: '13px' }}>{status.message}</div>}
              
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#1D2B44', marginBottom: '8px', textTransform: 'uppercase' }}>New Password</label>
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="min. 8 characters"
                  disabled={!token}
                  style={{ width: '100%', height: '52px', border: '1px solid #e1e1e1', borderRadius: '2px', padding: '0 20px', background: '#f8f9fa' }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#1D2B44', marginBottom: '8px', textTransform: 'uppercase' }}>Confirm Password</label>
                <input 
                  type="password" 
                  required 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  disabled={!token}
                  style={{ width: '100%', height: '52px', border: '1px solid #e1e1e1', borderRadius: '2px', padding: '0 20px', background: '#f8f9fa' }}
                />
              </div>
              
              <button type="submit" disabled={loading || !token} className="btn-primary-full" style={{ background: 'var(--accent)', color: '#fff', border: 'none', height: '56px', borderRadius: '4px', fontSize: '16px', fontWeight: '900', cursor: (!token || loading) ? 'not-allowed' : 'pointer', width: '100%', opacity: (!token || loading) ? 0.7 : 1 }}>
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;
