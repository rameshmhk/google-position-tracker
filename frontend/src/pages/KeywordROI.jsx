import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/apiConfig';

const KeywordROI = () => {
  const [kwData, setKwData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'revenue', direction: 'desc' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/track-data`);
      const data = await res.json();
      if (data.success) {
        const map = {};
        data.data.forEach(c => {
          if (c.keyword) {
            if (!map[c.keyword]) map[c.keyword] = { clicks: 0, orders: 0, revenue: 0, leads: [] };
            map[c.keyword].clicks++;
            if (c.orderId) {
              map[c.keyword].orders++;
              map[c.keyword].revenue += (c.revenue || 0);
            }
          }
        });
        const processed = Object.entries(map).map(([kw, stats]) => ({ kw, ...stats }));
        setKwData(processed);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...kwData].sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];

    if (sortConfig.key === 'rate') {
      valA = (a.orders / a.clicks) || 0;
      valB = (b.orders / b.clicks) || 0;
    }

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: '1200px', margin: '60px auto', padding: '0 20px' }}>
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: 0 }}>💰 Keyword ROI Attribution</h1>
            <p style={{ color: '#64748b', margin: '5px 0 0' }}>Mapping every dollar of revenue back to the original search term.</p>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#0f172a', color: '#fff' }}>
              <tr>
                <th 
                  onClick={() => requestSort('kw')}
                  style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
                >
                  KEYWORD {sortConfig.key === 'kw' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th 
                  onClick={() => requestSort('clicks')}
                  style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
                >
                  CLICKS {sortConfig.key === 'clicks' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th 
                  onClick={() => requestSort('orders')}
                  style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
                >
                  CONVERSIONS {sortConfig.key === 'orders' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th 
                  onClick={() => requestSort('rate')}
                  style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
                >
                  CONV. RATE {sortConfig.key === 'rate' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th 
                  onClick={() => requestSort('revenue')}
                  style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
                >
                  TOTAL REVENUE {sortConfig.key === 'revenue' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((d, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={tdStyle}><strong>{d.kw}</strong></td>
                  <td style={tdStyle}>{d.clicks}</td>
                  <td style={tdStyle}>
                    <div style={{ color: '#10b981', fontWeight: 'bold' }}>{d.orders} Success</div>
                  </td>
                  <td style={tdStyle}>
                    {((d.orders / d.clicks) * 100).toFixed(1)}%
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#10b981' }}>${d.revenue.toLocaleString()}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const thStyle = { padding: '20px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' };
const tdStyle = { padding: '20px', fontSize: '14px', color: '#1e293b' };

export default KeywordROI;
