const isProd = import.meta.env.MODE === 'production' || import.meta.env.PROD;
const API_BASE_URL = isProd ? 'https://rankinganywhere.com' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');

export default API_BASE_URL;
