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
  
  // Blog CMS States
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [blogForm, setBlogForm] = useState({ title: '', content: '', author: 'Admin', category: 'SEO Tips', image: '' });

  const MASTER_ADMIN = "rameshmjk@gmail.com";
  const MASTER_PASS = "admin@12345";

  const fetchPending = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/comments/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingComments(data || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchBlogs = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/blogs');
      const data = await res.json();
      setBlogs(data || []);
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
        setPendingComments(prev => prev.filter(c => c.id !== id));
        alert("Comment Approved!");
      }
    } catch (err) { alert("Approval failed."); }
  };

  const handleCommentDelete = async (id) => {
    if (!window.confirm("Delete this?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/admin/comments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPendingComments(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) { alert("Delete failed."); }
  };

  const handleBlogSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = isEditing 
      ? `http://localhost:5000/api/admin/blogs/${editId}` 
      : 'http://localhost:5000/api/admin/blogs';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(blogForm)
      });
      if (res.ok) {
        alert(isEditing ? "Updated!" : "Published!");
        setBlogForm({ title: '', content: '', author: 'Admin', category: 'SEO Tips', image: '' });
        setIsEditing(false);
        setEditId(null);
        fetchBlogs();
      }
    } catch (err) { alert("Action failed."); }
  };

  // MAGIC AUTO-POST FUNCTION
  const handleAutoPost = async () => {
    const title = prompt("Enter Blog Title for Auto-Post:");
    if (!title) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/auto-post', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ title, words: 1000 })
      });
      if (res.ok) {
        alert("Magic! 1000+ Words Blog Posted Successfully.");
        fetchBlogs();
      }
    } catch (err) { alert("Auto-post failed."); }
    finally { setLoading(false); }
  };

  const startEdit = (post) => {
    setBlogForm({ title: post.title, content: post.content, author: post.author || 'Admin', category: post.category || 'SEO Tips', image: post.image || '' });
    setEditId(post.id);
    setIsEditing(true);
    window.scrollTo(0, 0);
  };

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '35px' }}>
             <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔐</div>
             <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#1e293b', letterSpacing: '-1px' }}>Admin Login</h1>
             <p style={{ color: '#64748b', fontSize: '14px' }}>Ranking Anywhere CMS Access</p>
          </div>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '11px', fontWeight: '900', color: '#1e293b', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>ADMIN EMAIL</label>
              <input type="email" placeholder="you@gmail.com" value={credentials.email} onChange={(e) => setCredentials({...credentials, email: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }} />
            </div>
            <div style={{ marginBottom: '30px' }}>
              <label style={{ fontSize: '11px', fontWeight: '900', color: '#1e293b', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>PASSWORD</label>
              <input type="password" placeholder="••••••••" value={credentials.password} onChange={(e) => setCredentials({...credentials, password: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }} />
            </div>
            <button type="submit" style={{ width: '100%', background: '#1D2B44', color: '#fff', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: '900', cursor: 'pointer', fontSize: '15px', transition: '0.3s' }}>Unlock Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: '1200px', margin: '50px auto', padding: '0 25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1D2B44', letterSpacing: '-1.5px' }}>Command Center</h1>
            <p style={{ color: '#64748b', fontWeight: '500' }}>Master Administration & Content Strategy</p>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
             <button onClick={handleAutoPost} style={{ background: 'var(--accent)', color: '#fff', padding: '12px 25px', borderRadius: '12px', border: 'none', fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(255,153,0,0.3)' }}>✨ Magic Auto-Post</button>
             <button onClick={() => setIsLoggedIn(false)} style={{ background: '#ef4444', color: '#fff', padding: '12px 25px', borderRadius: '12px', border: 'none', fontWeight: '900', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '40px', flexDirection: window.innerWidth < 900 ? 'column' : 'row' }}>
          <div style={{ width: window.innerWidth < 900 ? '100%' : '260px' }}>
            {['comments', 'blogs', 'community'].map(tab => (
              <div key={tab} onClick={() => { setActiveTab(tab); setIsEditing(false); }} style={{ padding: '18px 24px', borderRadius: '14px', marginBottom: '12px', cursor: 'pointer', background: activeTab === tab ? '#1D2B44' : '#fff', color: activeTab === tab ? '#fff' : '#64748b', fontWeight: '800', textTransform: 'capitalize', transition: '0.3s', border: activeTab === tab ? 'none' : '1px solid #e2e8f0' }}>
                 {tab === 'comments' ? '💬 ' : tab === 'blogs' ? '✍️ ' : '👥 '} {tab}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, background: '#fff', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            {activeTab === 'comments' && (
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '30px', color: '#1D2B44' }}>Pending Moderation</h2>
                {loading ? <p>Loading Feed...</p> : (
                  pendingComments.length === 0 ? <p style={{ color: '#94a3b8', textAlign: 'center', padding: '50px' }}>No pending comments found.</p> : (
                    pendingComments.map(c => (
                      <div key={c.id} style={{ border: '1px solid #f1f5f9', padding: '25px', borderRadius: '16px', marginBottom: '20px', background: '#f8fafc' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontWeight: '900', fontSize: '16px', color: '#1e293b' }}>{c.name}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{c.date ? new Date(c.date).toLocaleString() : 'Just now'}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                             <button onClick={() => handleApprove(c.id)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800' }}>Approve</button>
                             <button onClick={() => handleCommentDelete(c.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800' }}>Reject</button>
                          </div>
                        </div>
                        <p style={{ color: '#475569', fontSize: '15px', marginTop: '15px', lineHeight: '1.6' }}>{c.text}</p>
                      </div>
                    ))
                  )
                )}
              </div>
            )}

            {activeTab === 'blogs' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                   <h2 style={{ fontSize: '22px', fontWeight: '900', margin: 0, color: '#1D2B44' }}>{isEditing ? "✏️ Edit Strategy" : "✍️ Content CMS"}</h2>
                   {isEditing && <button onClick={() => {setIsEditing(false); setBlogForm({ title: '', content: '', author: 'Admin', category: 'SEO Tips', image: '' });}} style={{ background: '#f1f5f9', border: 'none', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800' }}>Back to List</button>}
                </div>

                <form onSubmit={handleBlogSubmit} style={{ background: '#f8fafc', padding: '35px', borderRadius: '20px', marginBottom: '50px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 700 ? '1fr 1fr' : '1fr', gap: '25px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '900', display: 'block', marginBottom: '8px', color: '#64748b', letterSpacing: '1px' }}>POST TITLE</label>
                      <input type="text" value={blogForm.title} onChange={e => setBlogForm({...blogForm, title: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: '600' }} placeholder="Headline..." required />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '900', display: 'block', marginBottom: '8px', color: '#64748b', letterSpacing: '1px' }}>CATEGORY</label>
                      <select value={blogForm.category} onChange={e => setBlogForm({...blogForm, category: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: '700' }}>
                        <option>SEO Tips</option>
                        <option>News</option>
                        <option>Product Updates</option>
                        <option>Case Studies</option>
                      </select>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '900', display: 'block', marginBottom: '8px', color: '#64748b', letterSpacing: '1px' }}>FEATURED IMAGE URL</label>
                    <input type="text" value={blogForm.image} onChange={e => setBlogForm({...blogForm, image: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }} placeholder="https://source.unsplash.com/random/..." />
                  </div>

                  <div style={{ marginBottom: '30px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '900', display: 'block', marginBottom: '8px', color: '#64748b', letterSpacing: '1px' }}>STORY CONTENT</label>
                    <textarea value={blogForm.content} onChange={e => setBlogForm({...blogForm, content: e.target.value})} style={{ width: '100%', height: '350px', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '16px', lineHeight: '1.7', outline: 'none' }} placeholder="Once upon a time in SERPs..." required></textarea>
                  </div>
                  
                  <button type="submit" style={{ background: isEditing ? '#f59e0b' : '#1D2B44', color: '#fff', padding: '18px 50px', borderRadius: '14px', border: 'none', fontWeight: '900', cursor: 'pointer', fontSize: '16px', transition: '0.3s' }}>
                    {isEditing ? "🚀 Update Content" : "🚀 Launch to Journal"}
                  </button>
                </form>

                <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '25px', color: '#1e293b' }}>Inventory ({blogs.length})</h3>
                <div style={{ display: 'grid', gap: '15px' }}>
                  {blogs.map(b => (
                    <div key={b.id} style={{ padding: '20px 25px', border: '1px solid #e2e8f0', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                         <div style={{ width: '45px', height: '45px', background: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📰</div>
                         <div>
                            <div style={{ fontWeight: '800', color: '#1e293b' }}>{b.title}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
                               <span style={{ color: 'var(--accent)', fontWeight: '900' }}>{b.category}</span> • {b.date ? new Date(b.date).toLocaleDateString() : 'Draft'}
                            </div>
                         </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => startEdit(b)} style={{ background: '#f1f5f9', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', color: '#1D2B44' }}>Edit</button>
                        <button onClick={() => handleBlogDelete(b.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800' }}>Trash</button>
                      </div>
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
