const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (process.env.NODE_ENV === 'production' ? 'http://rankinganywhere.com' : 'http://localhost:5000');

export default API_BASE_URL;
