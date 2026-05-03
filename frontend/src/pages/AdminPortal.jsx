import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const AdminPortal = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [activeTab, setActiveTab] = useState('comments');
  const [pendingComments, setPendingComments] = useState([]);
  const [loading, setLoading] = useState(false);

  const MASTER_ADMIN = "rameshmjk@gmail.com";

  // Fetch Pending Comments
  const fetchPending = async () => {
    setLoading(true);
    try {
      // For this demo/setup, we assume the admin is already logged in to the main system 
      // or we use the credentials provided in the portal.
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/comments/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingComments(data);
      }
    } catch (err) {
      console.error("Failed to fetch pending comments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && activeTab === 'comments') {
      fetchPending();
    }
  }, [isLoggedIn, activeTab]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (credentials.email === MASTER_ADMIN && credentials.password.length >= 8) {
      setIsLoggedIn(true);
    } else {
      alert("Unauthorized Access! Only rameshmjk@gmail.com is permitted.");
    }
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/admin/comments/approve/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPendingComments(pendingComments.filter(c => c.id !== id));
        alert("Comment Approved & Published!");
      }
    } catch (err) {
      alert("Approval failed.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/admin/comments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPendingComments(pendingComments.filter(c => c.id !== id));
      }
    } catch (err) {
      alert("Delete failed.");
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#1D2B44' }}>Admin Security</h1>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Authorized Access Only</p>
          </div>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '900', color: '#1D2B44', display: 'block', marginBottom: '8px' }}>ADMIN GMAIL</label>
              <input 
                type="email" 
                placeholder="you@gmail.com"
                value={credentials.email}
                onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '30px' }}>
              <label style={{ fontSize: '12px', fontWeight: '900', color: '#1D2B44', display: 'block', marginBottom: '8px' }}>MASTER PASSWORD</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <button type="submit" style={{ width: '100%', background: '#1D2B44', color: '#fff', padding: '15px', borderRadius: '8px', border: 'none', fontWeight: '900', cursor: 'pointer' }}>
              Verify Identity
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar />
      <div style={{ maxWidth: '1200px', margin: '50px auto', padding: '0 25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1D2B44' }}>Command Center</h1>
            <p style={{ color: '#64748b' }}>Manage your Ranking Anywhere ecosystem</p>
          </div>
          <button onClick={() => setIsLoggedIn(false)} style={{ background: '#ef4444', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer' }}>Logout</button>
        </div>

        <div style={{ display: 'flex', gap: '30px' }}>
          {/* Sidebar */}
          <div style={{ width: '250px' }}>
            {['comments', 'blogs', 'community', 'settings'].map(tab => (
              <div 
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{ 
                  padding: '15px 20px', 
                  borderRadius: '10px', 
                  marginBottom: '10px', 
                  cursor: 'pointer',
                  background: activeTab === tab ? '#1D2B44' : 'transparent',
                  color: activeTab === tab ? '#fff' : '#64748b',
                  fontWeight: '700',
                  textTransform: 'capitalize',
                  transition: '0.3s'
                }}
              >
                {tab}
              </div>
            ))}
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, background: '#fff', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            {activeTab === 'comments' && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '25px' }}>Pending Moderation</h2>
                {loading ? <p>Loading feedback...</p> : (
                  pendingComments.length === 0 ? (
                    <p style={{ color: '#94a3b8' }}>Zero pending comments. You're all caught up!</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {pendingComments.map(c => (
                        <div key={c.id} style={{ border: '1px solid #f1f5f9', padding: '20px', borderRadius: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <div>
                              <div style={{ fontWeight: '800' }}>{c.name} <span style={{ fontWeight: '400', color: '#64748b', fontSize: '13px' }}>({c.email})</span></div>
                              <div style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(c.date).toLocaleString()}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button onClick={() => handleApprove(c.id)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>Approve</button>
                              <button onClick={() => handleDelete(c.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>Delete</button>
                            </div>
                          </div>
                          <p style={{ margin: 0, color: '#475569', fontSize: '14px' }}>{c.text}</p>
                          <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                             {c.fb && <span style={{ fontSize: '10px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>FB</span>}
                             {c.ig && <span style={{ fontSize: '10px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>IG</span>}
                             {c.li && <span style={{ fontSize: '10px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>LI</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}

            {activeTab === 'blogs' && (
              <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '10px' }}>Blog CMS</h2>
                <p style={{ color: '#64748b', marginBottom: '30px' }}>Post news, updates, and SEO tips to your website.</p>
                <button style={{ background: '#1D2B44', color: '#fff', padding: '12px 30px', borderRadius: '8px', border: 'none', fontWeight: '900', cursor: 'pointer' }}>+ Create New Post</button>
              </div>
            )}

            {activeTab === 'community' && (
              <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '10px' }}>Forum Management</h2>
                <p style={{ color: '#64748b' }}>Reply to user questions and moderate discussions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminPortal;
