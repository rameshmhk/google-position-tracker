const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_BASE_URL = isLocal
  ? import.meta.env.VITE_API_URL   // from .env for dev
  : 'https://rankinganywhere.com/api';

export const TRACKER_SCRIPT_URL = isLocal
  ? import.meta.env.VITE_TRACKER_URL // from .env for dev
  : '/tracker.js'; // live CDN location
