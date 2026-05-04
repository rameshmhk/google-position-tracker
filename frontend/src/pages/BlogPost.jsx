import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/apiConfig';

const BlogPost = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/blogs`);
        const data = await res.json();
        const found = data.find(p => String(p.id) === String(id));
        setPost(found);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: '100px', fontWeight: '900' }}>📡 LOADING STORY...</div>;
  if (!post) return <div style={{ textAlign: 'center', padding: '100px' }}><h1>Post Not Found</h1><Link to="/blog">Back to Journal</Link></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <Helmet>
        <title>{post.title} | Ranking Anywhere Journal</title>
        <meta name="description" content={post.title} />
      </Helmet>
      <Navbar />
      
      <div style={{ maxWidth: '850px', margin: '60px auto', padding: '0 25px' }}>
        <Link to="/blog" style={{ color: 'var(--accent)', fontWeight: '800', textDecoration: 'none', marginBottom: '30px', display: 'inline-block' }}>← Back to All Posts</Link>
        
        <div style={{ marginBottom: '40px' }}>
           <span style={{ background: '#f1f5f9', color: '#1D2B44', padding: '6px 15px', borderRadius: '6px', fontSize: '12px', fontWeight: '900' }}>{post.category || 'SEO'}</span>
           <h1 style={{ fontSize: '3.5rem', fontWeight: '900', color: '#1D2B44', letterSpacing: '-2.5px', marginTop: '20px', lineHeight: '1.1' }}>{post.title}</h1>
           
           <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '30px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
              <div style={{ width: '45px', height: '45px', background: '#1D2B44', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>{post.author?.[0] || 'A'}</div>
              <div>
                 <div style={{ fontWeight: '800', color: '#1D2B44' }}>{post.author || 'Ranking Admin'}</div>
                 <div style={{ fontSize: '12px', color: '#94a3b8' }}>Published on {new Date(post.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</div>
              </div>
           </div>
        </div>

        {post.image && (
          <img src={post.image} alt={post.title} style={{ width: '100%', borderRadius: '24px', marginBottom: '50px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
        )}

        <div 
          style={{ fontSize: '18px', lineHeight: '1.8', color: '#334155', fontWeight: '400' }}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div style={{ marginTop: '80px', padding: '40px', background: '#f8fafc', borderRadius: '24px', textAlign: 'center' }}>
           <h3 style={{ fontWeight: '900', color: '#1D2B44', marginBottom: '15px' }}>Was this helpful?</h3>
           <p style={{ color: '#64748b', marginBottom: '25px' }}>Share this ranking strategy with your team and start dominating the SERPs.</p>
           <button style={{ background: '#1D2B44', color: '#fff', padding: '12px 30px', borderRadius: '12px', border: 'none', fontWeight: '900', cursor: 'pointer' }}>Share Strategy</button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BlogPost;
