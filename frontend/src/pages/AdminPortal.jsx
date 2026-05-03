import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const AdminPortal = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [activeTab, setActiveTab] = useState('blogs');
  const [pendingComments, setPendingComments] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Magic Generator States
  const [showMagicBox, setShowMagicBox] = useState(false);
  const [magicTitle, setMagicTitle] = useState('');

  // Blog CMS States
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [blogForm, setBlogForm] = useState({ title: '', content: '', author: 'Admin', category: 'SEO Tips', image: '', tags: '' });

  const MASTER_ADMIN = "rameshmjk@gmail.com";
  const MASTER_PASS = "admin@12345";

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/comments/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingComments(Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error(err); }
  };

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/blogs');
      const data = await res.json();
      setBlogs(Array.isArray(data) ? data : []);
    } catch (err) { 
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (isLoggedIn) {
      if (activeTab === 'blogs') fetchBlogs();
      if (activeTab === 'comments') fetchPending();
    }
  }, [isLoggedIn, activeTab]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (credentials.email === MASTER_ADMIN && credentials.password === MASTER_PASS) {
      setIsLoggedIn(true);
    } else {
      alert("Invalid Credentials!");
    }
  };

  const handleMagicPost = async (e) => {
    e.preventDefault();
    if (!magicTitle) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/auto-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: magicTitle })
      });
      if (res.ok) {
        alert("✨ Success! Magic AI Post is Live.");
        setMagicTitle('');
        setShowMagicBox(false);
        fetchBlogs();
      }
    } catch (err) { alert("Magic Post failed."); }
    finally { setLoading(false); }
  };

  const handleBlogSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = isEditing ? `http://localhost:5000/api/admin/blogs/${editId}` : 'http://localhost:5000/api/admin/blogs';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(blogForm)
      });
      if (res.ok) {
        alert(isEditing ? "Updated!" : "Published!");
        setBlogForm({ title: '', content: '', author: 'Admin', category: 'SEO Tips', image: '', tags: '' });
        setShowForm(false);
        setIsEditing(false);
        fetchBlogs();
      }
    } catch (err) { alert("Action failed."); }
  };

  const deleteBlog = async (id) => {
    if (!window.confirm("Trash this post?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/admin/blogs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchBlogs();
      }
    } catch (err) { console.error(err); }
  };

  const startEdit = (post) => {
    setBlogForm({
      title: post.title,
      content: post.content,
      author: post.author || 'Admin',
      category: post.category || 'SEO Tips',
      image: post.image || '',
      tags: post.tags || ''
    });
    setEditId(post.id);
    setIsEditing(true);
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleCommentApprove = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/admin/comments/approve/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPending();
      }
    } catch (err) { alert("Failed."); }
  };

  const handleCommentDelete = async (id) => {
    if (!window.confirm("Delete?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/admin/comments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPending();
      }
    } catch (err) { alert("Failed."); }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
          <h1 style={{ textAlign: 'center', fontWeight: '900', color: '#1D2B44', marginBottom: '30px' }}>Admin Portal</h1>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Email" value={credentials.email} onChange={(e) => setCredentials({...credentials, email: e.target.value})} style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px', boxSizing: 'border-box' }} />
            <input type="password" placeholder="Password" value={credentials.password} onChange={(e) => setCredentials({...credentials, password: e.target.value})} style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', boxSizing: 'border-box' }} />
            <button type="submit" style={{ width: '100%', background: '#1D2B44', color: '#fff', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: '900', cursor: 'pointer' }}>Unlock Dashboard</button>
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
             <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1D2B44' }}>Admin Command Center</h1>
             <p style={{ color: '#64748b' }}>Manage your SEO content and community feedback.</p>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={() => setShowMagicBox(!showMagicBox)} style={{ background: 'var(--accent)', color: '#fff', padding: '12px 25px', borderRadius: '12px', border: 'none', fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 15px rgba(255,153,0,0.3)' }}>✨ Magic Generator</button>
            <button onClick={() => setIsLoggedIn(false)} style={{ background: '#ef4444', color: '#fff', padding: '12px 25px', borderRadius: '12px', border: 'none', fontWeight: '900', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>

        {showMagicBox && (
          <div style={{ background: 'linear-gradient(135deg, #1D2B44 0%, #334155 100%)', padding: '40px', borderRadius: '24px', marginBottom: '40px', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
             <h3 style={{ margin: '0 0 10px', fontWeight: '900' }}>✨ Magic AI Post Generator</h3>
             <p style={{ margin: '0 0 25px', opacity: 0.8 }}>Just enter a title, and our AI will write a 1000+ words SEO-optimized article.</p>
             <form onSubmit={handleMagicPost} style={{ display: 'flex', gap: '15px' }}>
                <input type="text" value={magicTitle} onChange={e => setMagicTitle(e.target.value)} placeholder="Enter Blog Title (e.g. Best SEO Tools 2026)" style={{ flex: 1, padding: '15px 20px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: '600' }} />
                <button type="submit" disabled={loading} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '0 40px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' }}>
                   {loading ? 'WRITING STORY...' : 'GENERATE NOW'}
                </button>
             </form>
          </div>
        )}

        <div style={{ display: 'flex', gap: '30px', flexDirection: window.innerWidth < 900 ? 'column' : 'row' }}>
          {/* Sidebar */}
          <div style={{ width: window.innerWidth < 900 ? '100%' : '240px' }}>
             {['blogs', 'comments'].map(tab => (
               <div key={tab} onClick={() => { setActiveTab(tab); setShowMagicBox(false); }} style={{ padding: '18px 24px', borderRadius: '15px', marginBottom: '10px', cursor: 'pointer', background: activeTab === tab ? '#1D2B44' : '#fff', color: activeTab === tab ? '#fff' : '#64748b', fontWeight: '800', border: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px' }}>
                  {tab === 'blogs' ? '📝 Posts' : '💬 Comments'}
               </div>
             ))}
          </div>

          {/* Main Area */}
          <div style={{ flex: 1, background: '#fff', padding: '35px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
             {activeTab === 'blogs' && (
               <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                     <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1D2B44' }}>Blog Management</h2>
                     <button onClick={() => { setShowForm(!showForm); setIsEditing(false); setBlogForm({ title: '', content: '', author: 'Admin', category: 'SEO Tips', image: '', tags: '' }); }} style={{ background: '#1D2B44', color: '#fff', padding: '10px 25px', borderRadius: '10px', border: 'none', fontWeight: '900', cursor: 'pointer' }}>
                        {showForm ? 'Close Editor' : '+ Add New Post'}
                     </button>
                  </div>

                  {showForm && (
                    <form onSubmit={handleBlogSubmit} style={{ background: '#f8fafc', padding: '30px', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '40px' }}>
                       <h3 style={{ marginBottom: '20px', fontWeight: '900' }}>{isEditing ? "Edit Post" : "Create New Post"}</h3>
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                          <div>
                             <label style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '8px' }}>POST TITLE</label>
                             <input type="text" value={blogForm.title} onChange={e => setBlogForm({...blogForm, title: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: '600', boxSizing: 'border-box' }} required />
                          </div>
                          <div>
                             <label style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '8px' }}>CATEGORY</label>
                             <select value={blogForm.category} onChange={e => setBlogForm({...blogForm, category: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: '600', boxSizing: 'border-box' }}>
                                <option>SEO Tips</option>
                                <option>Product Updates</option>
                                <option>Local Search</option>
                                <option>News</option>
                             </select>
                          </div>
                       </div>
                       
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                          <div>
                             <label style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '8px' }}>FEATURED IMAGE URL</label>
                             <input type="text" value={blogForm.image} onChange={e => setBlogForm({...blogForm, image: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} placeholder="https://..." />
                          </div>
                          <div>
                             <label style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '8px' }}>TAGS</label>
                             <input type="text" value={blogForm.tags} onChange={e => setBlogForm({...blogForm, tags: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} placeholder="seo, google, local" />
                          </div>
                       </div>

                       <div style={{ marginBottom: '25px' }}>
                          <label style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '8px' }}>POST CONTENT</label>
                          <textarea value={blogForm.content} onChange={e => setBlogForm({...blogForm, content: e.target.value})} style={{ width: '100%', height: '300px', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', fontSize: '15px', lineHeight: '1.6', boxSizing: 'border-box' }} required />
                       </div>

                       <button type="submit" style={{ background: '#1D2B44', color: '#fff', padding: '15px 40px', borderRadius: '12px', border: 'none', fontWeight: '900', cursor: 'pointer' }}>
                          {isEditing ? '🚀 Update Post' : '🚀 Publish Post'}
                       </button>
                    </form>
                  )}

                  <div style={{ display: 'grid', gap: '15px' }}>
                     {blogs.map(b => (
                       <div key={b.id} style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                             <div style={{ width: '45px', height: '45px', background: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📄</div>
                             <div>
                                <div style={{ fontWeight: '800', color: '#1D2B44' }}>{b.title}</div>
                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{b.category} • {new Date(b.date).toLocaleDateString()}</div>
                             </div>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                             <button onClick={() => startEdit(b)} style={{ background: '#f1f5f9', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: '800' }}>Edit</button>
                             <button onClick={() => deleteBlog(b.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: '800' }}>Trash</button>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
             )}

             {activeTab === 'comments' && (
               <div>
                  <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1D2B44', marginBottom: '30px' }}>Pending Moderation</h2>
                  {pendingComments.length === 0 ? <p style={{ textAlign: 'center', color: '#94a3b8', padding: '50px' }}>All clear! No pending comments found.</p> : (
                    pendingComments.map(c => (
                      <div key={c.id} style={{ padding: '25px', border: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '20px', marginBottom: '20px' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <div>
                               <div style={{ fontWeight: '900', fontSize: '16px' }}>{c.name}</div>
                               <div style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(c.date).toLocaleString()}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                               <button onClick={() => handleCommentApprove(c.id)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>Approve</button>
                               <button onClick={() => handleCommentDelete(c.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 18px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>Reject</button>
                            </div>
                         </div>
                         <p style={{ color: '#475569', lineHeight: '1.6' }}>{c.text}</p>
                      </div>
                    ))
                  )}
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
