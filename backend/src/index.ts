import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import { formatFullRank, formatOrganicRank } from './utils/rankUtils.js';
import { scrapeGoogleRank, scrapeSerperBatch, hybridScrape, wait } from './services/scraperService.js';
import { updateExcelMatrix } from './services/excelService.js';

dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-prod';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// PREVENT CRASHES FROM ASYNC BACKGROUND TASKS (like Puppeteer)
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err);
});

console.log('=========================================');
console.log('🚀 RANK TRACKER BACKEND IS STARTING... v9');
console.log('=========================================');
const PORT = process.env.PORT || 5000;
const DB_FILE = process.env.DB_PATH || path.join(process.cwd(), 'local_db.json');

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Global Request Logger
app.use((req, res, next) => {
  console.log(`\n🚨 [REQ] ${new Date().toLocaleTimeString()} -> ${req.method} ${req.url}`);
  next();
});

app.get('/api/ping', (req, res) => res.json({ status: 'ok', version: 'v10', time: new Date().toISOString() }));

// Authentication Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Unauthorized: Missing token" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Forbidden: Invalid token" });
    req.user = user;
    next();
  });
};

// Authentication Endpoints
app.post('/api/auth/register', async (req: any, res: any) => {
  const { name, email, password } = req.body;
  const db = getDB();
  
  if (db.users.find((u: any) => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password: hashedPassword,
    isVerified: false,
    verificationToken,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  persistDB();

  // Send Verification Email
  const verificationLink = `${process.env.APP_URL}/verify?token=${verificationToken}`;
  console.log('-----------------------------------------');
  console.log('📧 [SIMULATION] Activation Email sent to:', email);
  console.log('🔗 Link:', verificationLink);
  console.log('-----------------------------------------');

  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail({
        from: `"RankTracker Pro" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Activate Your SEO Tracker Account",
        html: `
          <h1>Welcome to RankTracker Pro!</h1>
          <p>Hi ${name},</p>
          <p>Please click the link below to verify your email address and activate your account:</p>
          <a href="${verificationLink}" style="padding: 10px 20px; background: #00f2fe; color: #000; text-decoration: none; border-radius: 5px;">Verify My Account</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${verificationLink}</p>
        `
      });
    }
  } catch (err) {
    console.error('❌ Email sending failed (Check your .env settings):', err);
  }

  res.json({ success: true, message: 'Registration successful! Please check your email to verify your account.' });
});

app.get('/api/auth/verify', (req: any, res: any) => {
  const { token } = req.query;
  const db = getDB();
  const user = db.users.find((u: any) => u.verificationToken === token);

  if (!user) return res.status(400).json({ error: 'Invalid or expired verification token' });

  user.isVerified = true;
  user.verificationToken = null;
  persistDB();

  res.json({ success: true, message: 'Account verified successfully! You can now log in.' });
});

app.post('/api/auth/google', async (req: any, res: any) => {
  const { idToken } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    if (!payload) throw new Error('Invalid token');

    const { sub, email, name, picture } = payload;
    const db = getDB();
    let user = db.users.find((u: any) => u.email === email);

    if (!user) {
      user = {
        id: sub,
        name,
        email,
        password: '', // No password for Google users
        isVerified: true, // Google users are pre-verified
        verificationToken: null,
        picture,
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
    } else {
      user.isVerified = true; // Mark as verified if they login with Google
    }
    persistDB();

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, picture: user.picture } });
  } catch (err) {
    console.error('❌ Google Login Error:', err);
    res.status(400).json({ error: 'Google authentication failed' });
  }
});

app.post('/api/auth/login', async (req: any, res: any) => {
  const { email, password } = req.body;
  const db = getDB();
  
  const user = db.users.find((u: any) => u.email === email);
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  if (!user.isVerified) {
    return res.status(403).json({ error: 'Please verify your email address before logging in.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email } });
});

// Helper to Load/Save Local JSON DB
const loadDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = { 
      projects: [], 
      keywords: [],
      users: [],
      settings: { 
        globalSerpapiKey: '',
        globalProxyUrl: '',
        globalProxies: [],
        isRandomProxy: false,
        activeProxyIdx: null,
        serperQuotaActive: true
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  
  // Migration: Ensure all users have status fields
  db.users = (db.users || []).map((u: any) => ({
    ...u,
    isVerified: u.isVerified === undefined ? true : u.isVerified, // Existing users verified by default
    verificationToken: u.verificationToken || null
  }));

  // Migration: Ensure all keywords have status fields
  db.keywords = (db.keywords || []).map((k: any) => ({
    ...k,
    organicStatus: k.organicStatus || 'active',
    mapsStatus: k.mapsStatus || 'active'
  }));

  // Migration: Ensure settings has all fields
  db.settings = {
    globalSerperApiKey: '',
    globalScrapingdogApiKey: '',
    globalSerpapiKey: '',
    globalProxyUrl: '',
    globalProxies: [],
    isRandomProxy: false,
    activeProxyIdx: null,
    serperQuotaActive: true,
    ...db.settings
  };

  // CLEANUP: Remove old global strategy fields if they exist
  delete (db.settings as any).scrapingMode;
  delete (db.settings as any).defaultDevice;
  delete (db.settings as any).residentialProxy;

  // Migration: Ensure all projects have strategy fields
  db.projects = (db.projects || []).map((p: any) => {
    let strategy = p.scrapingStrategy || 'api_only';
    
    // Allow strategies as they are

    return {
      ...p,
      scrapingStrategy: strategy, // Now only: api_only, direct_proxy
      device: p.device || 'desktop',
      proxyUrl: p.proxyUrl || '',
      scheduleDay: p.scheduleDay || 'Friday',
      userId: p.userId || (db.users[0]?.id || 'admin') // Migration: Assign to first user or admin
    };
  });

  return db;
};

const saveDB = (db: any) => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

// Memory-First Single Source of Truth
let cachedDB = loadDB();
const getDB = () => cachedDB;

const persistDB = () => {
  saveDB(cachedDB);
};

// Ensure migration is saved to disk immediately
persistDB();
console.log('✅ Database synchronized with disk.');

app.get('/api/projects', authenticateToken, (req: any, res: any) => {
  const db = getDB();
  const userProjects = db.projects.filter((p: any) => String(p.userId) === String(req.user.id));
  res.json(userProjects);
});

app.post('/api/projects', authenticateToken, (req: any, res: any) => {
  const { name, url, businessName, serperApiKey, targetRegion, schedule, defaultLocation, defaultLat, defaultLng, pincode, usePincode } = req.body;
  const db = getDB();
  
  const newProject = {
    id: Date.now().toString(),
    userId: req.user.id, // Assign ownership
    name,
    url,
    businessName,
    targetRegion: targetRegion || 'au',
    schedule: schedule || 'instant',
    defaultLocation: defaultLocation || '',
    defaultLat: Number(defaultLat) || 0,
    defaultLng: Number(defaultLng) || 0,
    pincode: pincode || '',
    usePincode: !!usePincode,
    scrapingStrategy: req.body.scrapingStrategy || 'api_only',
    device: req.body.device || 'desktop',
    proxyUrl: req.body.proxyUrl || '',
    lastChecked: null
  };
  db.projects.push(newProject);
  persistDB();
  res.json(newProject);
});

app.get('/api/projects/:id/keywords', authenticateToken, (req: any, res: any) => {
  const { id } = req.params;
  const db = getDB();
  
  // Verify project ownership
  const project = db.projects.find((p: any) => String(p.id) === String(id) && String(p.userId) === String(req.user.id));
  if (!project) return res.status(403).json({ error: "Access denied" });

  const keywords = (db?.keywords || []).filter((k: any) => String(k.projectId) === String(id));
  
  const formatted = (keywords || []).map((k: any) => ({
    ...k,
    rank: k.organic || 0,
    mapsRank: k.maps || 0,
    displayRank: formatFullRank(k?.organic || 0, k?.maps || 0)
  }));
  
  res.json(formatted);
});

app.post('/api/projects/:id/keywords', authenticateToken, (req: any, res: any) => {
  const { id } = req.params;
  const { keywords } = req.body;
  const db = getDB();
  
  // Verify project ownership
  const project = db.projects.find((p: any) => String(p.id) === String(id) && String(p.userId) === String(req.user.id));
  if (!project) return res.status(403).json({ error: 'Access denied or project not found' });
  
  console.log(`[KeywordAdd] Adding to Project: ${project.name} (ID: ${id})`);
  
  if (!keywords || !Array.isArray(keywords)) {
    return res.status(400).json({ error: 'Keywords missing or not an array' });
  }
  
  const newKeywords = keywords.map((item: any) => {
    let text = typeof item === 'string' ? item : '';
    let location = '';
    let lat = 0;
    let lng = 0;
    
    // Support "Keyword | Location | Lat | Lng" format
    if (typeof item === 'string' && item.includes('|')) {
      const parts = item.split('|');
      text = (parts[0] || '').trim();
      location = (parts[1] || '').trim();
      lat = parseFloat(parts[2] || '0') || 0;
      lng = parseFloat(parts[3] || '0') || 0;
    }

    // Default Fallback Inheritance
    if (!location) location = project.defaultLocation || '';
    if (!lat) lat = project.defaultLat || 0;
    if (!lng) lng = project.defaultLng || 0;
    
    return {
      id: Math.random().toString(36).substring(7),
      projectId: id,
      text,
      organic: 0,
      maps: 0,
      status: 'active',
      mapsStatus: 'active',
      organicStatus: 'active', // NEW
      location,
      lat,
      lng,
      pincode: project.pincode || '',
      usePincode: !!project.usePincode
    };
  });
  
  console.log(`[KeywordAdd] Mapped to ${newKeywords.length} items. First:`, newKeywords[0]);
  db.keywords.push(...newKeywords);
  persistDB();
  res.json({ success: true, count: newKeywords.length });
});

app.delete('/api/projects/:id', authenticateToken, (req: any, res: any) => {
  const { id } = req.params;
  const db = getDB();
  
  // Verify ownership
  const projectIdx = db.projects.findIndex((p: any) => String(p.id) === String(id) && String(p.userId) === String(req.user.id));
  if (projectIdx === -1) return res.status(403).json({ error: "Access denied" });

  db.projects.splice(projectIdx, 1);
  db.keywords = db.keywords.filter((k: any) => String(k.projectId) !== String(id));
  persistDB();
  res.json({ success: true });
});

app.post('/api/projects/:id/keywords/bulk-defaults', authenticateToken, (req: any, res: any) => {
  const { id } = req.params;
  const { keywordIds } = req.body;
  const db = getDB();

  // Verify ownership
  const project = db.projects.find((p: any) => String(p.id) === String(id) && String(p.userId) === String(req.user.id));
  if (!project) return res.status(403).json({ error: 'Access denied' });

  if (!keywordIds || !Array.isArray(keywordIds)) {
    return res.status(400).json({ error: 'Keyword IDs missing or not an array' });
  }

  let count = 0;
  keywordIds.forEach(kid => {
    const kw = db.keywords.find((k: any) => String(k.id) === String(kid));
    if (kw) {
      kw.location = project.defaultLocation || '';
      kw.lat = project.defaultLat || 0;
      kw.lng = project.defaultLng || 0;
      count++;
    }
  });

  persistDB();
  res.json({ success: true, updated: count });
});

app.put('/api/projects/:id', authenticateToken, (req: any, res: any) => {
  const { id } = req.params;
  const updates = req.body;
  const db = getDB();
  const index = db.projects.findIndex((p: any) => String(p.id) === String(id) && String(p.userId) === String(req.user.id));
  
  if (index !== -1) {
    db.projects[index] = { ...db.projects[index], ...updates };
    persistDB();
    res.json(db.projects[index]);
  } else {
    res.status(404).json({ error: 'Project not found' });
  }
});

app.delete('/api/keywords/:id', authenticateToken, (req: any, res: any) => {
  const { id } = req.params;
  const db = getDB();
  
  // Find keyword and verify project ownership
  const k = db.keywords.find((kw: any) => String(kw.id) === String(id));
  if (!k) return res.status(404).json({ error: "Keyword not found" });

  const project = db.projects.find((p: any) => String(p.id) === String(k.projectId) && String(p.userId) === String(req.user.id));
  if (!project) return res.status(403).json({ error: "Access denied" });

  const initialCount = db.keywords.length;
  db.keywords = db.keywords.filter((k: any) => String(k.id) !== String(id));
  
  if (db.keywords.length === initialCount) {
     console.warn(`[Delete] Keyword with ID ${id} not found for deletion.`);
  } else {
     console.log(`[Delete] Removed keyword ${id}. Remaining: ${db.keywords.length}`);
  }
  
  persistDB();
  res.json({ success: true });
});

app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const initialProjCount = db.projects.length;
  
  // 1. Remove associated keywords
  db.keywords = db.keywords.filter((k: any) => String(k.projectId) !== String(id));
  
  // 2. Remove the project
  db.projects = db.projects.filter((p: any) => String(p.id) !== String(id));
  
  if (db.projects.length === initialProjCount) {
    return res.status(404).json({ error: 'Project not found' });
  }

  persistDB();
  res.json({ success: true });
});

app.get('/api/download-excel', (req, res) => {
  const EXCEL_FILE = path.join(process.cwd(), 'rankings.xlsx');
  if (fs.existsSync(EXCEL_FILE)) {
    res.download(EXCEL_FILE);
  } else {
    res.status(404).json({ error: 'Excel file not found. Run a check first!' });
  }
});

app.post('/api/settings/test-serper', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'API key required' });

  try {
    const testRes = await axios.post('https://google.serper.dev/search', { q: 'test', num: 1 }, {
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' }
    });
    
    // If successful, reset quota active status in DB
    const db = getDB();
    db.settings.serperQuotaActive = true;
    persistDB();
    
    res.json({ success: true, credits: testRes.data.credits || 'Active' });
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ 
      success: false, 
      error: err.response?.data?.message || err.message 
    });
  }
});

// Settings Management
app.get('/api/settings', (req, res) => {
  const db = getDB();
  res.json(db.settings || { globalSerperApiKey: '' });
});

app.post('/api/settings', (req, res) => {
  const { 
    globalSerperApiKey, 
    globalScrapingdogApiKey, 
    globalSerpapiKey, 
    globalProxyUrl,
    globalProxies,
    isRandomProxy,
    activeProxyIdx
  } = req.body;
  
  const db = getDB();
  db.settings = { 
    ...db.settings, 
    globalSerperApiKey: globalSerperApiKey || '',
    globalScrapingdogApiKey: globalScrapingdogApiKey || '',
    globalSerpapiKey: globalSerpapiKey || '',
    globalProxyUrl: globalProxyUrl || '',
    globalProxies: globalProxies || [],
    isRandomProxy: !!isRandomProxy,
    activeProxyIdx: activeProxyIdx !== undefined ? activeProxyIdx : null
  };
  persistDB();
  res.json(db.settings);
});

app.post('/api/keywords/:id/toggle-organic', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const kw = db.keywords.find((k: any) => String(k.id).trim() === String(id).trim());
  if (kw) {
    const old = kw.organicStatus;
    kw.organicStatus = (kw.organicStatus === 'active') ? 'paused' : 'active';
    console.log(`[Toggle] Keyword ${id} Organic: ${old} -> ${kw.organicStatus}`);
    persistDB();
    res.json(kw);
  } else {
    console.error(`[Toggle] Keyword ${id} not found for organic toggle`);
    res.status(404).json({ error: 'Keyword not found' });
  }
});

app.post('/api/keywords/:id/toggle-maps', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const kw = db.keywords.find((k: any) => String(k.id).trim() === String(id).trim());
  if (kw) {
    const old = kw.mapsStatus;
    kw.mapsStatus = (kw.mapsStatus === 'active') ? 'paused' : 'active';
    console.log(`[Toggle] Keyword ${id} Maps: ${old} -> ${kw.mapsStatus}`);
    persistDB();
    res.json(kw);
  } else {
    console.error(`[Toggle] Keyword ${id} not found for maps toggle`);
    res.status(404).json({ error: 'Keyword not found' });
  }
});

app.post('/api/keywords/:id/toggle-pause', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const kw = db.keywords.find((k: any) => String(k.id).trim() === String(id).trim());
  if (kw) {
    const old = kw.status;
    kw.status = (kw.status === 'active') ? 'paused' : 'active';
    console.log(`[Toggle] Keyword ${id} Status: ${old} -> ${kw.status}`);
    persistDB();
    res.json(kw);
  } else {
    console.error(`[Toggle] Keyword ${id} not found for status toggle`);
    res.status(404).json({ error: 'Keyword not found' });
  }
});

app.post('/api/keywords/bulk-status', (req, res) => {
  const { ids, status } = req.body;
  const db = getDB();
  db.keywords.forEach((k: any) => {
    if (ids.includes(k.id)) k.status = status;
  });
  persistDB();
  res.json({ success: true });
});

app.post('/api/keywords/bulk-maps-status', (req, res) => {
  const { ids, status } = req.body;
  const db = getDB();
  db.keywords.forEach((k: any) => {
    if (ids.includes(k.id)) k.mapsStatus = status;
  });
  persistDB();
  res.json({ success: true });
});

app.post('/api/keywords/bulk-organic-status', (req, res) => {
  const { ids, status } = req.body;
  const db = getDB();
  db.keywords.forEach((k: any) => {
    if (ids.includes(k.id)) k.organicStatus = status;
  });
  persistDB();
  res.json({ success: true });
});

app.post('/api/keywords/sync', (req, res) => {
  const { projectId, keywords } = req.body;
  if (!projectId || !Array.isArray(keywords)) {
    return res.status(400).json({ error: 'Missing projectId or keywords array' });
  }
  
  const db = getDB();
  const project = db.projects.find((p: any) => String(p.id) === String(projectId));
  
  db.keywords = db.keywords.filter((k: any) => String(k.projectId) !== String(projectId));
  
  const toSave = keywords.map((k: any) => {
    let location = k.location || '';
    let lat = Number(k.lat) || 0;
    let lng = Number(k.lng) || 0;

    // Apply defaults if mission
    if (project) {
      if (!location) {
        location = project.defaultLocation || '';
        console.log(`[Sync-Inherit] Applied "${location}" to keyword "${k.text}"`);
      }
      if (!lat) lat = project.defaultLat || 0;
      if (!lng) lng = project.defaultLng || 0;
    } else {
      console.warn(`[Sync-Inherit] Project NOT FOUND for ID: ${projectId}`);
    }

    return {
      ...k,
      location,
      lat,
      lng,
      projectId: String(projectId),
      id: k.id || Math.random().toString(36).substring(7),
      pincode: k.pincode === undefined ? (project?.pincode || '') : k.pincode,
      usePincode: k.usePincode === undefined ? (!!project?.usePincode) : !!k.usePincode
    };
  });
  
  db.keywords.push(...toSave);
  persistDB();
  console.log(`[Sync] Synced ${toSave.length} keywords for project ${projectId} (Inherited Defaults applied)`);
  res.json({ success: true, count: toSave.length });
});

app.put('/api/keywords/:id', authenticateToken, (req: any, res: any) => {
  const { id } = req.params;
  const updates = req.body;
  const db = getDB();
  const keyword = db.keywords.find((k: any) => String(k.id) === String(id));
  
  if (keyword) {
    if (updates.text) keyword.text = updates.text;
    if (updates.location !== undefined) keyword.location = updates.location;
    if (updates.lat !== undefined) keyword.lat = updates.lat;
    if (updates.lng !== undefined) keyword.lng = updates.lng;
    if (updates.pincode !== undefined) keyword.pincode = updates.pincode;
    if (updates.usePincode !== undefined) keyword.usePincode = !!updates.usePincode;
    if (updates.status) keyword.status = updates.status;
    persistDB();
    res.json(keyword);
  } else {
    res.status(404).json({ error: 'Keyword not found' });
  }
});

app.delete('/api/keywords/:id', authenticateToken, (req: any, res: any) => {
  const { id } = req.params;
  const db = getDB();
  
  const keyword = db.keywords.find((k: any) => String(k.id) === String(id));
  if (!keyword) return res.status(404).json({ error: 'Keyword not found' });

  // Verify ownership
  const project = db.projects.find((p: any) => String(p.id) === String(keyword.projectId) && String(p.userId) === String(req.user.id));
  if (!project) return res.status(403).json({ error: 'Access denied' });

  db.keywords = db.keywords.filter((k: any) => String(k.id) !== String(id));
  persistDB();
  res.json({ success: true });
});

app.delete('/api/projects/:id', authenticateToken, (req: any, res: any) => {
  const { id } = req.params;
  const db = getDB();
  
  const project = db.projects.find((p: any) => String(p.id) === String(id) && String(p.userId) === String(req.user.id));
  if (!project) return res.status(404).json({ error: 'Project not found or access denied' });

  // Delete project and all its keywords
  db.projects = db.projects.filter((p: any) => String(p.id) !== String(id));
  db.keywords = db.keywords.filter((k: any) => String(k.projectId) !== String(id));
  
  persistDB();
  res.json({ success: true });
});

app.post('/api/keywords/:id/toggle-pause', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const keyword = db.keywords.find((k: any) => String(k.id) === String(id));
  if (keyword) {
    keyword.status = keyword.status === 'active' ? 'paused' : 'active';
    persistDB();
    res.json({ success: true, status: keyword.status });
  } else {
    res.status(404).json({ error: 'Keyword not found' });
  }
});

app.post('/api/free-audit/check', async (req, res) => {
  const { keywords, targetUrl, region, location, lat, lng } = req.body;
  if (!keywords || !Array.isArray(keywords)) {
    return res.status(400).json({ error: 'Missing keywords array' });
  }

  console.log(`[FreeAudit] Starting automated browser audit for ${keywords.length} keywords...`);
  
  const results = [];
  for (const kw of keywords) {
    const options = {
      keyword: kw,
      targetUrl: targetUrl || '',
      region: region || 'au',
      location: location || '',
      lat: (lat && lat !== '') ? Number(lat) : 0,
      lng: (lng && lng !== '') ? Number(lng) : 0,
      device: 'desktop' 
    };
    
    try {
      const result = await scrapeGoogleRank(options as any);
      results.push({ keyword: kw, ...result });
    } catch (err) {
      console.error(`[FreeAudit] Error checking "${kw}":`, err);
      results.push({ keyword: kw, organicRank: 0, mapsRank: 0, error: true });
    }
  }

  res.json({ success: true, results });
});

app.post('/api/keywords/:id/toggle-maps', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const keyword = db.keywords.find((k: any) => String(k.id) === String(id));
  if (keyword) {
    keyword.mapsStatus = keyword.mapsStatus === 'active' ? 'paused' : 'active';
    persistDB();
    res.json({ success: true, mapsStatus: keyword.mapsStatus });
  } else {
    res.status(404).json({ error: 'Keyword not found' });
  }
});

/**
 * CORE LOGIC: Unified Rank Checking for Single, Selection, or Project
 */
async function performCheckForKeywords(keywordIds: string[], projectId: string) {
  const db = getDB();
  const project = db.projects.find((p: any) => String(p.id) === String(projectId));
  if (!project) throw new Error("Project not found");

  if (project.status === 'paused') {
    return { success: false, error: 'Project is paused. Resume to check rankings.' };
  }

  const keywordsToCheck = db.keywords.filter((k: any) => 
    keywordIds.includes(String(k.id)) && k.status === 'active'
  );

  const resolveProxy = (settings: any) => {
    const { globalProxyUrl, globalProxies, isRandomProxy, activeProxyIdx } = settings || {};
    if (isRandomProxy && globalProxies && globalProxies.length > 0) {
      const idx = Math.floor(Math.random() * globalProxies.length);
      return globalProxies[idx];
    }
    if (activeProxyIdx !== null && globalProxies && globalProxies[activeProxyIdx]) {
      return globalProxies[activeProxyIdx];
    }
    return globalProxyUrl || '';
  };

  const today = new Date().toISOString().split('T')[0];
  const addHistory = (k: any, organic: number, maps: number) => {
    if (!k.history) k.history = [];
    const existing = k.history.findIndex((h: any) => h.date === today);
    const snap = { date: today, organic, maps };
    if (existing !== -1) k.history[existing] = snap;
    else k.history.push(snap);
    if (k.history.length > 30) k.history = k.history.slice(-30);
  };
  
  console.log(`[CheckEngine] Triggering check for ${keywordsToCheck.length} keywords in project "${project.name}"`);
  if (keywordsToCheck.length === 0) return { success: true, count: 0 };

  const results: any[] = [];
  const excelUpdates: any[] = [];

  const BATCH_SIZE = 10;
  for (let i = 0; i < keywordsToCheck.length; i += BATCH_SIZE) {
    const batch = keywordsToCheck.slice(i, i + BATCH_SIZE);
    try {
      const batchOptions = batch.map((k: any) => ({
        keyword: k.text,
        targetUrl: project.url,
        region: (project as any).targetRegion,
        businessName: (project as any).businessName,
        location: (() => {
          const kwUsePincode = k.usePincode !== undefined ? k.usePincode : project.usePincode;
          const kwPincode = k.pincode || project.pincode || '';
          const baseLoc = k.location || project.defaultLocation || '';
          
          if (kwUsePincode && kwPincode && !baseLoc.includes(kwPincode)) {
            return `${baseLoc}, ${kwPincode}`.trim();
          }
          return baseLoc;
        })(),
        lat: Number(k.lat) || project.defaultLat || 0,
        lng: Number(k.lng) || project.defaultLng || 0,
        apiKey: db.settings?.globalSerperApiKey || '',
        skipMaps: (k as any).mapsStatus === 'paused',
        organicStatus: k.organicStatus || 'active',
        device: project.device || 'desktop',
        proxyUrl: project.proxyUrl || resolveProxy(db.settings)
      }));

      const strategy = project.scrapingStrategy || 'hybrid';

      if (strategy === 'browser_only') {
        for (let idx = 0; idx < batch.length; idx++) {
          const k = batch[idx];
          const res = await hybridScrape({
            ...batchOptions[idx],
            strategy: 'browser_only'
          } as any);
          
          k.organic = res.organicRank; 
          k.maps = res.mapsRank; 
          addHistory(k, res.organicRank, res.mapsRank);
          
          if (res.error === 'QUOTA_EXCEEDED') {
            k.displayRank = 'Quota Exceeded';
          } else {
            k.displayRank = formatFullRank(res.organicRank, res.mapsRank);
          }

          k.source = (res.organicRank > 0 || res.mapsRank > 0) ? (res.source || 'Browser') : '';
          k.lastChecked = today;
          results.push({ keywordId: k.id, ...res });
          excelUpdates.push({ projectName: project.name, keyword: k.text, rank: k.displayRank, date: today });

          if (res.error === 'QUOTA_EXCEEDED') {
            db.settings.serperQuotaActive = false;
          } else {
            db.settings.serperQuotaActive = true;
          }
        }
      } else {
        const batchResults = await scrapeSerperBatch(batchOptions);
        
        // Check for batch-level quota error
        if (batchResults.some(r => r.error === 'QUOTA_EXCEEDED')) {
          db.settings.serperQuotaActive = false;
        } else {
          db.settings.serperQuotaActive = true;
        }

        for (let idx = 0; idx < batchResults.length; idx++) {
          let res = batchResults[idx];
          const k = batch[idx];
          if (!k || !res) continue;
          
          // Hybrid Skip Logic: If not found in batch, try hybrid scan for depth
          if (res.organicRank === 0 && k.organicStatus !== 'paused') {
            const hybridRes = await hybridScrape({
              ...batchOptions[idx],
              scrapingdogApiKey: db.settings?.globalScrapingdogApiKey || '',
              serpapiKey: db.settings?.globalSerpapiKey || '',
              strategy: strategy,
              device: project.device || 'desktop',
              proxyUrl: project.proxyUrl || resolveProxy(db.settings)
            } as any);
            res = { ...res, ...hybridRes };
          }
          
          k.organic = res.organicRank; 
          k.maps = res.mapsRank; 
          addHistory(k, res.organicRank, res.mapsRank);
          
          if (res.error === 'QUOTA_EXCEEDED') {
            k.displayRank = 'Quota Exceeded';
          } else {
            k.displayRank = formatFullRank(res.organicRank, res.mapsRank);
          }

          k.source = (res.organicRank > 0 || res.mapsRank > 0) ? (res.source || 'Serper') : '';
          k.lastChecked = today;
          results.push({ keywordId: k.id, ...res });
          excelUpdates.push({ projectName: project.name, keyword: k.text, rank: k.displayRank, date: today });
        }
      }
      persistDB();
    } catch (err) {
      console.error(`[CheckEngine] Batch Error:`, err);
    }
  }

  project.lastChecked = today;
  project.lastCheck = Date.now();
  persistDB();
  
  if (excelUpdates.length > 0) {
    try {
      await updateExcelMatrix(excelUpdates);
    } catch (excelErr) {
      console.error('[CheckEngine] Excel update failed:', excelErr);
    }
  }
  
  return { success: true, count: results.length };
}

app.post('/api/check-project/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const db = getDB();
    // Verify ownership
    const project = db.projects.find((p: any) => String(p.id) === String(id) && String(p.userId) === String(req.user.id));
    
    if (!project) return res.status(403).json({ error: "Access denied" });
    if (project.status === 'paused') {
      return res.status(403).json({ error: "This project is currently on hold. Activate it to run scans." });
    }

    const projectKeywords = db.keywords.filter((k: any) => String(k.projectId) === String(id));
    const ids = projectKeywords.map((k: any) => String(k.id));
    
    const result = await performCheckForKeywords(ids, id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/keywords/check-selection', authenticateToken, async (req: any, res: any) => {
  try {
    const { projectId, keywordIds } = req.body;
    if (!projectId || !keywordIds || !Array.isArray(keywordIds)) {
      return res.status(400).json({ error: "Missing projectId or keywordIds array" });
    }

    const db = getDB();
    // Verify ownership
    const project = db.projects.find((p: any) => String(p.id) === String(projectId) && String(p.userId) === String(req.user.id));
    if (!project) return res.status(403).json({ error: "Access denied" });
    
    if (project?.status === 'paused') {
      return res.status(403).json({ error: "Project is on hold." });
    }

    const result = await performCheckForKeywords(keywordIds.map(String), String(projectId));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/check-keyword/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const k = db.keywords.find((kw: any) => String(kw.id) === String(id));
    if (!k) return res.status(404).json({ error: "Keyword not found" });
    
    const project = db.projects.find((p: any) => String(p.id) === String(k.projectId) && String(p.userId) === String(req.user.id));
    if (!project) return res.status(403).json({ error: "Access denied" });
    
    if (project?.status === 'paused') {
      return res.status(403).json({ error: "Project is on hold." });
    }

    const result = await performCheckForKeywords([String(id)], String(k.projectId));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Automation Scheduler (Checks every minute)
setInterval(async () => {
  const db = getDB();
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  for (const p of db.projects) {
    if (p.status !== 'active' || p.schedule === 'instant') continue;

    const last = p.lastCheck || 0;
    const dueDaily = p.schedule === 'daily' && (now - last) >= ONE_DAY;
    
    const todayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);
    const targetDay = p.scheduleDay || 'Friday';
    const isTargetDay = todayName.toLowerCase() === targetDay.toLowerCase();
    const dueWeekly = p.schedule === 'weekly' && isTargetDay && (now - last) >= ONE_DAY;

    if (dueDaily || dueWeekly) {
      console.log(`[Scheduler] Auto-triggering scan for ${p.name}...`);
      const pKeywords = db.keywords.filter((k: any) => String(k.projectId) === String(p.id));
      const ids = pKeywords.map((k: any) => String(k.id));
      await performCheckForKeywords(ids, String(p.id));
    }
  }
}, 60000);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

// Final fallback for 404s (must be last)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', method: req.method, url: req.url });
});
