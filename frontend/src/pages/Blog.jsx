import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Blog = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/blogs');
        const data = await res.json();
        setBlogs(data);
      } catch (err) {
        console.error("Failed to fetch blogs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Helmet>
        <title>SEO News & Updates | Ranking Anywhere Blog</title>
        <meta name="description" content="Stay updated with the latest SEO tips, product updates, and search engine ranking strategies from Ranking Anywhere." />
      </Helmet>
      <Navbar />
      
      <div style={{ maxWidth: '1000px', margin: '80px auto', padding: '0 25px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ color: 'var(--accent)', fontWeight: '900', fontSize: '12px', letterSpacing: '2px', marginBottom: '10px' }}>RANKING ANYWHERE JOURNAL</div>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', color: '#1D2B44', letterSpacing: '-2px' }}>Latest <span style={{ color: 'var(--accent)' }}>SEO Insights</span></h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Strategies, updates, and news to help you dominate the SERPs.</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
             <div className="ping-animate" style={{ width: '40px', height: '40px', background: 'var(--accent)', borderRadius: '50%', margin: '0 auto' }}></div>
             <p style={{ marginTop: '20px', fontWeight: '700', color: '#64748b' }}>Fetching latest news...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 750 ? 'repeat(2, 1fr)' : '1fr', gap: '30px' }}>
            {blogs.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                <p style={{ color: '#64748b', fontWeight: '700' }}>No posts yet. Stay tuned!</p>
              </div>
            ) : (
              blogs.map((post, idx) => (
                <div key={post.id} style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0', transition: '0.3s', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                   <div style={{ height: '200px', background: idx % 2 === 0 ? '#1D2B44' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '40px' }}>
                      {post.category === 'SEO Tips' ? '📈' : post.category === 'News' ? '📰' : '🚀'}
                   </div>
                   <div style={{ padding: '30px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '12px', fontWeight: '900', color: 'var(--accent)', marginBottom: '10px', textTransform: 'uppercase' }}>{post.category}</div>
                      <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#1D2B44', marginBottom: '15px', lineHeight: '1.3' }}>{post.title}</h2>
                      <p 
                        style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', marginBottom: '25px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                        dangerouslySetInnerHTML={{ __html: post.content }}
                      ></p>
                      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                         <div style={{ fontSize: '13px', fontWeight: '700', color: '#1D2B44' }}>By {post.author}</div>
                         <div style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(post.date).toLocaleDateString()}</div>
                      </div>
                   </div>
                </div>
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
