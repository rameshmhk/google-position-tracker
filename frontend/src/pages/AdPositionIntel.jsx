import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const AdPositionIntel = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching ad position data
    setTimeout(() => {
      setData([
        { id: 1, keyword: 'plumber mumbai', position: '1t1', device: 'Desktop', conversions: 12, roi: '450%' },
        { id: 2, keyword: 'emergency repair', position: '1t2', device: 'Mobile', conversions: 8, roi: '320%' },
        { id: 3, keyword: 'home services', position: '1o1', device: 'Desktop', conversions: 5, roi: '180%' },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />
      
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Back Button */}
        <button 
          onClick={() => navigate('/ad-tracker')}
          style={{ 
            background: 'rgba(15, 23, 42, 0.05)', 
            border: '1px solid rgba(15, 23, 42, 0.1)', 
            color: '#64748b', 
            padding: '10px 20px', 
            borderRadius: '12px', 
            fontSize: '14px', 
            fontWeight: 'bold', 
            cursor: 'pointer', 
            marginBottom: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: '0.3s all'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(15, 23, 42, 0.1)';
            e.currentTarget.style.color = '#0f172a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(15, 23, 42, 0.05)';
            e.currentTarget.style.color = '#64748b';
          }}
        >
          ← Back to Ad Tracker
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: 0 }}>📍 Ad Position Intelligence</h1>
        </div>

        <div style={{ background: '#1e293b', padding: '30px', borderRadius: '24px', color: '#fff', marginBottom: '40px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '14px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '10px' }}>Targeting Efficiency</p>
              <h2 style={{ fontSize: '48px', fontWeight: '900', margin: 0 }}>Avg Position: <span style={{ color: '#fbbf24' }}>1.2</span></h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px 25px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>TOTAL CONVERSIONS FROM TOP SPOT</p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#10b981' }}>84.2%</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '24px', padding: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '20px', color: '#1e293b' }}>Rank Performance Audit</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                <th style={{ padding: '15px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Target Keyword</th>
                <th style={{ padding: '15px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Ad Position</th>
                <th style={{ padding: '15px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Device Type</th>
                <th style={{ padding: '15px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Conversions</th>
                <th style={{ padding: '15px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Estimated ROI</th>
              </tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#1e293b' }}>{row.keyword}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '6px', fontWeight: '900', fontSize: '12px' }}>
                      {row.position}
                    </span>
                  </td>
                  <td style={{ padding: '15px', color: '#64748b' }}>{row.device}</td>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#10b981' }}>{row.conversions}</td>
                  <td style={{ padding: '15px', fontWeight: '900', color: '#6366f1' }}>{row.roi}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div style={{ 
            marginTop: '30px', 
            padding: '20px', 
            background: '#fff7ed', 
            borderRadius: '15px', 
            border: '2px solid #f59e0b', 
            textAlign: 'center',
            animation: 'pulseTip 2s infinite'
          }}>
            <p style={{ color: '#9a3412', fontSize: '15px', margin: 0, fontWeight: 'bold' }}>
              💡 <span style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>Important Tip:</span> Use ValueTrack parameters like <code>adpos={"{"}adposition{"}"}</code> in your Google Ads tracking template to populate real-time rank data.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulseTip {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); border-color: #f59e0b; }
          50% { box-shadow: 0 0 20px 10px rgba(245, 158, 11, 0.1); border-color: #fbbf24; }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); border-color: #f59e0b; }
        }
      `}</style>
      <Footer />
    </div>
  );
};

export default AdPositionIntel;
