import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/apiConfig';

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
  const [blogForm, setBlogForm] = useState({
    title: '',
    content: '',
    author: 'Admin',
    category: 'SEO Tips',
    image: '',
    tags: ''
  });

  useEffect(() => {
    const adminAuth = localStorage.getItem('isAdminLoggedIn');
    if (adminAuth === 'true') {
      setIsLoggedIn(true);
      fetchBlogs();
      fetchPendingComments();
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchBlogs();
      fetchPendingComments();
    }
  }, [isLoggedIn]);

  const fetchBlogs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs`);
      if (res.ok) {
        const data = await res.json();
        setBlogs(data);
      }
    } catch (err) { console.error(err); }
  };

  const fetchPendingComments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/admin/comments/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingComments(data);
      }
    } catch (err) { console.error(err); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('isAdminLoggedIn', 'true');
        setIsLoggedIn(true);
      } else {
        alert("Invalid Admin Credentials!");
      }
    } catch (err) { alert("Login Failed. Backend down?"); }
  };

  const approveComment = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/admin/comments/approve/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPendingComments(prev => prev.filter(c => c.id !== id));
        alert("✅ Comment Approved!");
      }
    } catch (err) { console.error(err); }
  };

  const deleteComment = async (id) => {
    if (!window.confirm("Delete this comment permanently?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/admin/comments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPendingComments(prev => prev.filter(c => c.id !== id));
        alert("🗑️ Comment Deleted.");
      }
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdminLoggedIn');
    setIsLoggedIn(false);
  };

  const handleMagicPost = async (e) => {
    e.preventDefault();
    if (!magicTitle) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/admin/generate-post`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: magicTitle })
      });
      if (res.ok) {
        alert("✨ Magic Post Generated!");
        setMagicTitle('');
        setShowMagicBox(false);
        fetchBlogs();
      }
    } catch (err) { alert("Magic failed."); }
    finally { setLoading(false); }
  };

  const handleBlogSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = isEditing ? `${API_BASE_URL}/api/admin/blogs/${editId}` : `${API_BASE_URL}/api/admin/blogs`;
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
      const res = await fetch(`${API_BASE_URL}/api/admin/blogs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setBlogs(prev => prev.filter(b => b.id !== id));
        alert("🗑️ Removed.");
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
            <button onClick={handleLogout} style={{ background: '#ef4444', color: '#fff', padding: '12px 25px', borderRadius: '12px', border: 'none', fontWeight: '900', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>

        {showMagicBox && (
          <div style={{ background: 'linear-gradient(135deg, #1D2B44 0%, #334155 100%)', padding: '40px', borderRadius: '24px', marginBottom: '40px', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
             <h3 style={{ margin: '0 0 10px', fontWeight: '900' }}>✨ Magic AI Post Generator</h3>
             <form onSubmit={handleMagicPost} style={{ display: 'flex', gap: '15px' }}>
                <input type="text" value={magicTitle} onChange={e => setMagicTitle(e.target.value)} placeholder="Enter Blog Title..." style={{ flex: 1, padding: '15px 20px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: '600' }} />
                <button type="submit" disabled={loading} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '0 40px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' }}>
                   {loading ? 'WRITING...' : 'GENERATE'}
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

          <div style={{ flex: 1, background: '#fff', padding: '35px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
             {activeTab === 'blogs' && (
               <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                     <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1D2B44' }}>Blog Management</h2>
                     <button onClick={() => { setShowForm(!showForm); setIsEditing(false); }} style={{ background: '#1D2B44', color: '#fff', padding: '10px 25px', borderRadius: '10px', border: 'none', fontWeight: '900', cursor: 'pointer' }}>
                        {showForm ? 'Close Editor' : '+ Add New Post'}
                     </button>
                  </div>

                  {showForm && (
                    <form onSubmit={handleBlogSubmit} style={{ background: '#f8fafc', padding: '30px', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '40px' }}>
                       <input type="text" value={blogForm.title} onChange={e => setBlogForm({...blogForm, title: e.target.value})} placeholder="Title" style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px' }} required />
                       <textarea value={blogForm.content} onChange={e => setBlogForm({...blogForm, content: e.target.value})} placeholder="Content" style={{ width: '100%', height: '200px', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', marginBottom: '15px' }} required />
                       <button type="submit" style={{ background: '#1D2B44', color: '#fff', padding: '15px 40px', borderRadius: '12px', border: 'none', fontWeight: '900', cursor: 'pointer' }}>{isEditing ? 'Update' : 'Publish'}</button>
                    </form>
                  )}

                  <div style={{ display: 'grid', gap: '15px' }}>
                     {blogs.map(b => (
                       <div key={b.id} style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                             <div style={{ fontWeight: '800', color: '#1D2B44' }}>{b.title}</div>
                             <div style={{ fontSize: '12px', color: '#94a3b8' }}>{b.category} • {new Date(b.date).toLocaleDateString()}</div>
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
                   <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1D2B44', marginBottom: '30px' }}>Pending Approvals ({pendingComments.length})</h2>
                   <div style={{ display: 'grid', gap: '20px' }}>
                      {pendingComments.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', background: '#f8fafc', borderRadius: '20px' }}>No pending comments at the moment.</div>
                      ) : (
                        pendingComments.map(c => (
                          <div key={c.id} style={{ padding: '25px', border: '1px solid #e2e8f0', borderRadius: '20px', background: '#fff' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div>
                                   <div style={{ fontWeight: '900', color: '#1D2B44', fontSize: '18px' }}>{c.name}</div>
                                   <div style={{ fontSize: '12px', color: '#94a3b8' }}>{c.email} • {new Date(c.date).toLocaleString()}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                   <button onClick={() => approveComment(c.id)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '800' }}>Approve</button>
                                   <button onClick={() => deleteComment(c.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '800' }}>Reject</button>
                                </div>
                             </div>
                             <p style={{ color: '#475569', lineHeight: '1.6', margin: 0, padding: '15px', background: '#f8fafc', borderRadius: '12px', fontStyle: 'italic' }}>"{c.comment}"</p>
                          </div>
                        ))
                      )}
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
