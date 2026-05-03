import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const AdminPortal = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [activeTab, setActiveTab] = useState('comments');
  const [pendingComments, setPendingComments] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Blog Form State
  const [blogForm, setBlogForm] = useState({ title: '', content: '', author: 'Admin', category: 'SEO Tips', image: '' });

  const MASTER_ADMIN = "rameshmjk@gmail.com";

  const fetchPending = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/comments/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingComments(data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchBlogs = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/blogs');
      const data = await res.json();
      setBlogs(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (isLoggedIn) {
      if (activeTab === 'comments') fetchPending();
      if (activeTab === 'blogs') fetchBlogs();
    }
  }, [isLoggedIn, activeTab]);

  const handleLogin = (e) => {
    e.preventDefault();
    const MASTER_PASS = "admin@12345";
    if (credentials.email === MASTER_ADMIN && credentials.password === MASTER_PASS) {
      setIsLoggedIn(true);
    } else {
      alert("Unauthorized Access! Invalid Credentials.");
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
    } catch (err) { alert("Approval failed."); }
  };

  const handleBlogSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/blogs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(blogForm)
      });
      if (res.ok) {
        alert("Blog Post Published Successfully!");
        setBlogForm({ title: '', content: '', author: 'Admin', category: 'SEO Tips', image: '' });
        fetchBlogs();
      }
    } catch (err) { alert("Blog post failed."); }
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
              <input type="email" placeholder="you@gmail.com" value={credentials.email} onChange={(e) => setCredentials({...credentials, email: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '30px' }}>
              <label style={{ fontSize: '12px', fontWeight: '900', color: '#1D2B44', display: 'block', marginBottom: '8px' }}>MASTER PASSWORD</label>
              <input type="password" placeholder="••••••••" value={credentials.password} onChange={(e) => setCredentials({...credentials, password: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" style={{ width: '100%', background: '#1D2B44', color: '#fff', padding: '15px', borderRadius: '8px', border: 'none', fontWeight: '900', cursor: 'pointer' }}>Verify Identity</button>
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
          <div style={{ width: '250px' }}>
            {['comments', 'blogs', 'community', 'settings'].map(tab => (
              <div key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '15px 20px', borderRadius: '10px', marginBottom: '10px', cursor: 'pointer', background: activeTab === tab ? '#1D2B44' : 'transparent', color: activeTab === tab ? '#fff' : '#64748b', fontWeight: '700', textTransform: 'capitalize' }}>{tab}</div>
            ))}
          </div>

          <div style={{ flex: 1, background: '#fff', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            {activeTab === 'comments' && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '25px' }}>Pending Moderation</h2>
                {loading ? <p>Loading...</p> : (
                  pendingComments.length === 0 ? <p style={{ color: '#94a3b8' }}>Zero pending comments.</p> : (
                    pendingComments.map(c => (
                      <div key={c.id} style={{ border: '1px solid #f1f5f9', padding: '20px', borderRadius: '12px', marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontWeight: '800' }}>{c.name}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(c.date).toLocaleString()}</div>
                          </div>
                          <button onClick={() => handleApprove(c.id)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>Approve</button>
                        </div>
                        <p style={{ color: '#475569', fontSize: '14px' }}>{c.text}</p>
                      </div>
                    ))
                  )
                )}
              </div>
            )}

            {activeTab === 'blogs' && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '25px' }}>Blog CMS</h2>
                <form onSubmit={handleBlogSubmit} style={{ background: '#f8fafc', padding: '25px', borderRadius: '12px', marginBottom: '40px' }}>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '800', display: 'block', marginBottom: '5px' }}>TITLE</label>
                    <input type="text" value={blogForm.title} onChange={e => setBlogForm({...blogForm, title: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} placeholder="e.g. 10 Local SEO Tips for 2026" required />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '800', display: 'block', marginBottom: '5px' }}>CATEGORY</label>
                    <select value={blogForm.category} onChange={e => setBlogForm({...blogForm, category: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <option>SEO Tips</option>
                      <option>News</option>
                      <option>Product Updates</option>
                      <option>Case Studies</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '800', display: 'block', marginBottom: '5px' }}>CONTENT (HTML Supported)</label>
                    <textarea value={blogForm.content} onChange={e => setBlogForm({...blogForm, content: e.target.value})} style={{ width: '100%', height: '200px', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} placeholder="Write your blog post here..." required></textarea>
                  </div>
                  <button type="submit" style={{ background: '#1D2B44', color: '#fff', padding: '12px 30px', borderRadius: '8px', border: 'none', fontWeight: '900', cursor: 'pointer' }}>Publish Post</button>
                </form>

                <h3 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '20px' }}>Published Posts</h3>
                <div style={{ display: 'grid', gap: '15px' }}>
                  {blogs.map(b => (
                    <div key={b.id} style={{ padding: '15px', border: '1px solid #f1f5f9', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '800' }}>{b.title}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{b.category} • {new Date(b.date).toLocaleDateString()}</div>
                      </div>
                      <button style={{ color: '#ef4444', background: 'none', border: 'none', fontWeight: '700', cursor: 'pointer' }}>Remove</button>
                    </div>
                  ))}
                </div>
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
