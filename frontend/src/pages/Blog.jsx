import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/apiConfig';

const Blog = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/blogs`);
        if (res.ok) {
          const data = await res.json();
          setBlogs(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      <Helmet>
        <title>SEO Journal & News | Ranking Anywhere</title>
        <meta name="description" content="Get the latest SEO insights, product updates and ranking strategies." />
      </Helmet>
      <Navbar />
      
      <header style={{ background: '#1D2B44', padding: '100px 25px', textAlign: 'center', color: '#fff' }}>
         <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'inline-block', background: 'var(--accent)', color: '#fff', padding: '5px 15px', borderRadius: '4px', fontSize: '10px', fontWeight: '900', letterSpacing: '2px', marginBottom: '20px' }}>OFFICIAL JOURNAL</div>
            <h1 style={{ fontSize: '3.5rem', fontWeight: '900', letterSpacing: '-2px', marginBottom: '15px' }}>Stay Ahead of <span style={{ color: 'var(--accent)' }}>Google</span></h1>
            <p style={{ fontSize: '1.2rem', opacity: 0.8, fontWeight: '400' }}>Deep-dive into the technical world of SEO, ranking precision, and search intelligence.</p>
         </div>
      </header>

      <div style={{ maxWidth: '1100px', margin: '-50px auto 100px', padding: '0 25px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', background: '#fff', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
             <p style={{ fontWeight: '800', color: '#64748b' }}>📡 INITIALIZING JOURNAL...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 800 ? 'repeat(3, 1fr)' : '1fr', gap: '30px' }}>
            {blogs.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px', background: '#fff', borderRadius: '24px' }}>
                <p style={{ fontSize: '1.2rem', color: '#94a3b8', fontWeight: '700' }}>The journal is currently being drafted. Check back soon!</p>
              </div>
            ) : (
              blogs.map((post, idx) => (
                <article key={post.id} style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: '0.3s' }}>
                   <Link to={`/blog/${post.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ height: '180px', background: idx % 2 === 0 ? '#1e293b' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px', position: 'relative', overflow: 'hidden' }}>
                        {post.image ? <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} /> : '📚'}
                        <div style={{ position: 'absolute', bottom: '15px', left: '15px', background: 'var(--accent)', color: '#fff', padding: '4px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: '900' }}>{post.category || 'SEO'}</div>
                    </div>
                   </Link>
                   <div style={{ padding: '30px' }}>
                      <Link to={`/blog/${post.id}`} style={{ textDecoration: 'none' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1D2B44', marginBottom: '15px', lineHeight: '1.4' }}>{post.title}</h2>
                      </Link>
                      <div 
                        style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.7', marginBottom: '25px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                        dangerouslySetInnerHTML={{ __html: post.content }}
                      ></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                         <span style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b' }}>👤 {post.author || 'Admin'}</span>
                         <span style={{ fontSize: '11px', color: '#94a3b8' }}>{post.date ? new Date(post.date).toLocaleDateString() : 'Recent'}</span>
                      </div>
                   </div>
                </article>
              ))
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Blog;
