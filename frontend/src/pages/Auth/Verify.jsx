import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import API_BASE_URL from '../../config/apiConfig';

const Verify = () => {
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Verifying your account...');
  const location = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const token = query.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }

    const verifyAccount = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/verify?token=${token}`);
        const data = await res.json();
        if (data.success) {
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Connection error. Please try again later.');
      }
    };

    verifyAccount();
  }, [location]);

  return (
    <div className="auth-page">
      <Navbar />
      <div className="auth-container" style={{justifyContent:'center', alignItems:'center', padding:'100px', textAlign:'center'}}>
        <div style={{maxWidth:'500px'}}>
          {status === 'loading' && <h2 style={{color:'var(--text-dim)'}}>Verifying... ⏳</h2>}
          {status === 'success' && (
            <>
              <h2 style={{color:'var(--accent-cyan)', marginBottom:'20px'}}>Verified! ✅</h2>
              <p style={{fontSize:'18px', lineHeight:'1.6'}}>{message}</p>
              <div style={{marginTop:'30px'}}>
                <Link to="/login" className="btn-primary-large">Go to Login</Link>
              </div>
            </>
          )}
          {status === 'error' && (
            <>
              <h2 style={{color:'#ff4444', marginBottom:'20px'}}>Verification Failed ❌</h2>
              <p style={{fontSize:'18px', lineHeight:'1.6'}}>{message}</p>
              <div style={{marginTop:'30px'}}>
                <Link to="/contact" className="btn-secondary-large">Contact Support</Link>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Verify;
