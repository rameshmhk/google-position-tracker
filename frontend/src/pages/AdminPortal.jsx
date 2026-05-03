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

  const handleCommentDelete = async (id) => {
    if (!window.confirm("Delete this comment permanently?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/admin/comments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPendingComments(pendingComments.filter(c => c.id !== id));
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
        alert(isEditing ? "Post Updated!" : "Post Published!");
        setBlogForm({ title: '', content: '', author: 'Admin', category: 'SEO Tips', image: '' });
        setIsEditing(false);
        setEditId(null);
        fetchBlogs();
      }
    } catch (err) { alert("Action failed."); }
  };

  const handleBlogDelete = async (id) => {
    if (!window.confirm("Are you sure? This will remove the blog post forever.")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/admin/blogs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchBlogs();
      }
    } catch (err) { alert("Delete failed."); }
  };

  const startEdit = (post) => {
    setBlogForm({ title: post.title, content: post.content, author: post.author, category: post.category, image: post.image || '' });
    setEditId(post.id);
    setIsEditing(true);
    window.scrollTo(0, 0);
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
              <div key={tab} onClick={() => { setActiveTab(tab); setIsEditing(false); }} style={{ padding: '15px 20px', borderRadius: '10px', marginBottom: '10px', cursor: 'pointer', background: activeTab === tab ? '#1D2B44' : 'transparent', color: activeTab === tab ? '#fff' : '#64748b', fontWeight: '700', textTransform: 'capitalize' }}>{tab}</div>
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
                          <div style={{ display: 'flex', gap: '10px' }}>
                             <button onClick={() => handleApprove(c.id)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>Approve</button>
                             <button onClick={() => handleCommentDelete(c.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>Reject</button>
                          </div>
                        </div>
                        <p style={{ color: '#475569', fontSize: '14px', marginTop: '10px' }}>{c.text}</p>
                      </div>
                    ))
                  )
                )}
              </div>
            )}

            {activeTab === 'blogs' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                   <h2 style={{ fontSize: '20px', fontWeight: '900', margin: 0 }}>{isEditing ? "✏️ Edit Blog Post" : "✍️ WordPress-Style CMS"}</h2>
                   {isEditing && <button onClick={() => {setIsEditing(false); setBlogForm({ title: '', content: '', author: 'Admin', category: 'SEO Tips', image: '' });}} style={{ background: '#f1f5f9', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>Cancel Edit</button>}
                </div>

                <form onSubmit={handleBlogSubmit} style={{ background: '#f8fafc', padding: '25px', borderRadius: '16px', marginBottom: '40px', border: '2px solid #e2e8f0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '900', display: 'block', marginBottom: '5px', color: '#64748b' }}>POST TITLE</label>
                      <input type="text" value={blogForm.title} onChange={e => setBlogForm({...blogForm, title: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: '600' }} placeholder="Enter title..." required />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '900', display: 'block', marginBottom: '5px', color: '#64748b' }}>CATEGORY</label>
                      <select value={blogForm.category} onChange={e => setBlogForm({...blogForm, category: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: '600' }}>
                        <option>SEO Tips</option>
                        <option>News</option>
                        <option>Product Updates</option>
                        <option>Case Studies</option>
                      </select>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '900', display: 'block', marginBottom: '5px', color: '#64748b' }}>FEATURED IMAGE URL (OPTIONAL)</label>
                    <input type="text" value={blogForm.image} onChange={e => setBlogForm({...blogForm, image: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} placeholder="https://..." />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '900', display: 'block', marginBottom: '5px', color: '#64748b' }}>POST CONTENT (RICH HTML SUPPORTED)</label>
                    <textarea value={blogForm.content} onChange={e => setBlogForm({...blogForm, content: e.target.value})} style={{ width: '100%', height: '300px', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', lineHeight: '1.6' }} placeholder="Write your masterpiece here..." required></textarea>
                  </div>
                  
                  <button type="submit" style={{ background: isEditing ? '#f59e0b' : '#1D2B44', color: '#fff', padding: '15px 40px', borderRadius: '10px', border: 'none', fontWeight: '900', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                    {isEditing ? "Update WordPress Post" : "Publish to Journal"}
                  </button>
                </form>

                <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>All Published Posts ({blogs.length})</h3>
                <div style={{ display: 'grid', gap: '15px' }}>
                  {blogs.length === 0 ? <p style={{ color: '#94a3b8' }}>No posts found. Start writing!</p> : blogs.map(b => (
                    <div key={b.id} style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                         <div style={{ width: '50px', height: '50px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📄</div>
                         <div>
                            <div style={{ fontWeight: '800', color: '#1e293b' }}>{b.title}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                               <span style={{ color: 'var(--accent)', fontWeight: '900' }}>{b.category}</span> • Published {new Date(b.date).toLocaleDateString()}
                            </div>
                         </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => startEdit(b)} style={{ background: '#f1f5f9', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', color: '#1e293b' }}>Edit</button>
                        <button onClick={() => handleBlogDelete(b.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>Trash</button>
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
