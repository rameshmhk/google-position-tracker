// @ts-nocheck
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import axios from 'axios';
import https from 'https';
import * as cheerio from 'cheerio';
import multer from 'multer';
import dns from 'dns';
import tls from 'tls';

import { formatFullRank, formatOrganicRank } from './utils/rankUtils.js';
import { scrapeGoogleRank, scrapeSerperBatch, hybridScrape, wait } from './services/scraperService.js';
import { updateExcelMatrix } from './services/excelService.js';

dotenv.config();
console.log('>>> [SYSTEM] BACKEND INDEX.TS RELOADED - VERSION 12 <<<');

const processRdapData = (data: any, domain: string) => {
  const getContact = (role: string) => {
    const registrarEntity = data.entities?.find((e: any) => e.roles?.includes('registrar'));
    const registrarName = registrarEntity?.vcardArray?.[1]?.find((v: any) => v[0] === 'fn')?.[3] || '';
    const entity = data.entities?.find((e: any) => e.roles?.includes(role));
    
    const vcard = entity?.vcardArray?.[1] || [];
    const getField = (field: string) => vcard.find((v: any) => v[0] === field)?.[3];
    const adr = vcard.find((v: any) => v[0] === 'adr')?.[3] || [];
    
    let contact: any = {
      name: getField('fn') || entity?.handle,
      organization: getField('org'),
      email: getField('email'),
      phone: getField('tel'),
      street: adr[2],
      city: adr[3],
      state: adr[4],
      zip: adr[5],
      country: adr[6]
    };

    const isPrivate = !contact.name || contact.name.toLowerCase().includes('redacted') || contact.name.toLowerCase().includes('privacy');

    // --- SMART PRIVACY FILLING (GoDaddy Style) ---
    if (isPrivate || !entity) {
      const regLower = registrarName.toLowerCase();
      if (regLower.includes('godaddy')) {
        return {
          name: 'Registration Private',
          organization: 'Domains By Proxy, LLC',
          street: '100 S. Mill Ave, Suite 1600',
          city: 'Tempe',
          state: 'Arizona',
          zip: '85281',
          country: 'US',
          phone: '+1.4806242599',
          email: `https://www.godaddy.com/whois/results.aspx?domain=${domain}`
        };
      } else if (regLower.includes('namecheap')) {
        return {
          name: 'Withheld for Privacy Purposes',
          organization: 'PrivacyService.it',
          street: 'Kalkofnsvegur 2',
          city: 'Reykjavik',
          state: 'Capital Region',
          zip: '101',
          country: 'IS',
          phone: '+354.4212434',
          email: 'privacy@namecheap.com'
        };
      } else if (regLower.includes('google') || regLower.includes('squarespace')) {
        return {
          name: 'Contact Privacy Inc.',
          organization: 'Contact Privacy Inc. Customer 012345',
          street: '96 Mowat Ave',
          city: 'Toronto',
          state: 'ON',
          zip: 'M6K 3M1',
          country: 'CA',
          phone: '+1.4165385457',
          email: `https://domains.google.com/contactowner?domain=${domain}`
        };
      } else {
        // Generic Fallback
        return {
          name: 'Privacy Protection Service',
          organization: 'Data Protected',
          street: 'Redacted for Privacy',
          city: 'Not Disclosed',
          state: 'N/A',
          zip: 'N/A',
          country: registrarEntity?.vcardArray?.[1]?.find((v: any) => v[0] === 'adr')?.[3]?.[6] || 'US',
          phone: 'REDACTED',
          email: 'REDACTED (GDPR)'
        };
      }
    }

    return contact.name ? contact : null;
  };

  const events = data.events || [];
  const registration = events.find((e: any) => e.eventAction === 'registration');
  const expiration = events.find((e: any) => e.eventAction === 'expiration');
  const lastUpdate = events.find((e: any) => e.eventAction === 'last changed' || e.eventAction === 'last update');

  const created = registration?.eventDate;
  const expires = expiration?.eventDate;
  const updated = lastUpdate?.eventDate;

  // Trust Score Logic
  let score = 30;
  if (created) {
    const years = (new Date().getTime() - new Date(created).getTime()) / (1000 * 3600 * 24 * 365);
    if (years > 10) score += 40;
    else if (years > 3) score += 20;
  }
  if (data.status?.includes('client transfer prohibited')) score += 15;
  if (data.status?.includes('server delete prohibited')) score += 15;

  return {
    success: true,
    domain,
    status: data.status || [],
    registrar: data.entities?.find((e: any) => e.roles?.includes('registrar'))?.vcardArray?.[1]?.find((v: any) => v[0] === 'fn')?.[3] || 'Unknown',
    contacts: {
      registrar: data.entities?.find((e: any) => e.roles?.includes('registrar')),
      registrant: getContact('registrant'),
      admin: getContact('administrative'),
      tech: getContact('technical')
    },
    dates: { created, expires, updated },
    nameservers: (data.nameservers || []).map((ns: any) => ns.ldhName),
    age: {
      days: created ? Math.floor((new Date().getTime() - new Date(created).getTime()) / (1000 * 3600 * 24)) : 0,
      years: created ? ((new Date().getTime() - new Date(created).getTime()) / (1000 * 3600 * 24 * 365)).toFixed(1) : 0,
      label: (() => {
        if (!created) return 'Unknown';
        const diffDays = Math.floor((new Date().getTime() - new Date(created).getTime()) / (1000 * 3600 * 24));
        if (diffDays < 31) return `${diffDays} Days`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30.41)} Months`;
        return `${(diffDays / 365).toFixed(1)} Years`;
      })()
    },
    trustScore: Math.min(score, 100),
    raw: data
  };
};

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-prod';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Prisma disabled for tracking routes due to local init issues
const prisma: any = null; 
console.log('>>> [DATABASE] Running in SQLite Direct Mode');

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
console.log('🚀 RANK TRACKER BACKEND IS STARTING... v10');
console.log('=========================================');
const PORT = Number(process.env.PORT) || 5001;
const DB_FILE = process.env.DB_PATH || path.join(process.cwd(), 'local_db.json');
const SQLITE_DB_PATH = path.join(process.cwd(), 'dev.db');
console.log('>>> [DATABASE] SQLite Path:', SQLITE_DB_PATH);

app.use((req: any, res: any, next: any) => {
  const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'https://rankinganywhere.com'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json({ type: ['application/json', 'text/plain'] }));

// --- NEW TRACKING & SEEDING ROUTES (PRIORITY) ---
app.get('/api/seed-tracking', async (req: any, res: any) => {
  console.log('>>> [API] Received request for /api/seed-tracking');
  try {
    const sqlite3 = (await import('sqlite3')).default;
    const db = new sqlite3.Database(SQLITE_DB_PATH);
    
    const locations = [
      { city: 'Mumbai', country: 'India', lat: 19.0760, lon: 72.8777, isp: 'Reliance Jio' },
      { city: 'Delhi', country: 'India', lat: 28.6139, lon: 77.2090, isp: 'Airtel India' },
      { city: 'London', country: 'UK', lat: 51.5074, lon: -0.1278, isp: 'BT' },
      { city: 'New York', country: 'USA', lat: 40.7128, lon: -74.0060, isp: 'Verizon' },
      { city: 'Dubai', country: 'UAE', lat: 25.2048, lon: 55.2708, isp: 'Etisalat' }
    ];

    const sources = ['Google Ads', 'Facebook Ads', 'Instagram Ads', 'Bing Ads', 'YouTube Ads', 'LinkedIn Ads', 'Twitter Ads'];
    const campaigns: any = {
      'Google Ads': ['Search_Top_Performing', 'Display_Retargeting_V2', 'Shopping_General_Traffic'],
      'Facebook Ads': ['FB_Summer_Sale', 'FB_Retargeting_V1', 'Lookalike_Audience_Beta'],
      'Instagram Ads': ['Insta_Story_Promo', 'Influencer_Campaign_A', 'Insta_Explore_Ads'],
      'Bing Ads': ['Bing_Search_Campaign', 'MSFT_Partner_Network', 'Windows_Search_Ads'],
      'YouTube Ads': ['Video_TrueView_Discovery', 'Bumper_Ads_Reach', 'In-Stream_Action_Alpha'],
      'LinkedIn Ads': ['B2B_Decision_Makers', 'Talent_Acquisition_Promo', 'Executive_Network_Ads'],
      'Twitter Ads': ['Promoted_Trends_X', 'Direct_Response_Cards', 'Engagement_Boost_V2']
    };
    const adGroupsList = ['AdGroup_1', 'AdGroup_Beta', 'Creative_Set_A', 'Video_Promos'];
    const keywords = ['plumber in mumbai', 'emergency repair', 'best home services', 'professional plumbing', 'leak detection', 'drain cleaning'];
    const repeatIps = ['1.2.3.4', '5.6.7.8', '9.10.11.12', '17.18.19.20'];

    const insertPromises = [];

    // Generate 100 high-fidelity records for a full dashboard
    for (let i = 0; i < 100; i++) {
      const loc = locations[Math.floor(Math.random() * locations.length)];
      
      // Inject intentional Multi-Click Fraud for some records
      const isMultiClickFraud = i < 15; // More fraud for better visuals
      const attackerIps = ['45.12.88.101', '103.44.22.190', '195.22.11.44'];
      
      const isReturning = isMultiClickFraud ? true : (Math.random() > 0.6);
      const ipAddress = isMultiClickFraud 
        ? attackerIps[i % attackerIps.length] 
        : (isReturning ? repeatIps[Math.floor(Math.random() * repeatIps.length)] : `${101 + Math.floor(Math.random()*100)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`);
      
      const visitCount = isMultiClickFraud ? (Math.floor(i/3) + 2) : (isReturning ? Math.floor(Math.random() * 8) + 2 : 1);
      
      const isConversion = !isMultiClickFraud && (Math.random() > 0.6);
      const addedToCart = isConversion || Math.random() > 0.4;
      const highInterest = addedToCart || Math.random() > 0.3;
      
      const isVPN = isMultiClickFraud || Math.random() > 0.92;
      const isBot = !isMultiClickFraud && Math.random() > 0.85;

      const pages = ['/'];
      if (highInterest) pages.push('/services', '/pricing', '/product-details');
      else pages.push('/blog', '/faq');

      const actions = ['Landed on Site'];
      if (highInterest) actions.push('Viewed Features');
      if (addedToCart) actions.push('Added to Cart');
      if (isConversion) {
        actions.push('Submitted Contact Form');
        actions.push('Verified Payment');
      }

      const revenue = isConversion ? Math.floor(Math.random() * 800) + 50 : 0;
      const orderId = isConversion ? `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}` : null;
      
      // Fixed clickedAt calculation
      const clickedAt = new Date(Date.now() - Math.floor(Math.random() * 15 * 24 * 60 * 60 * 1000)).toISOString();
      
      const source = sources[Math.floor(Math.random() * sources.length)];
      const campaignName = campaigns[source][Math.floor(Math.random() * campaigns[source].length)];
      const adGroup = adGroupsList[Math.floor(Math.random() * adGroupsList.length)];

      const promise = new Promise((resolve, reject) => {
        db.run(`INSERT INTO AdClick (id, websiteUrl, ipAddress, deviceType, browser, os, source, isSuspicious, suspicionReason, clickedAt, formInteracted, timeOnSite, pageLoadTime, isp, city, country, lat, lon, pagesVisited, actions, campaignName, adGroup, adContent, keyword, isReturning, visitCount, revenue, orderId) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                [
                  `seed-${Date.now()}-${i}-${Math.random().toString(36).substr(2,4)}`,
                  'https://rankinganywhere.com',
                  ipAddress,
                  Math.random() > 0.5 ? 'Desktop' : 'Mobile',
                  'Chrome',
                  Math.random() > 0.5 ? 'Windows' : 'Android',
                  source,
                  isVPN ? 1 : 0,
                  isVPN ? 'VPN/Proxy Detected' : (isBot ? 'Bot Pattern' : null),
                  clickedAt,
                  isConversion ? 1 : 0,
                  isBot ? 1 : (Math.floor(Math.random() * 400) + 40),
                  Math.floor(Math.random() * 1200) + 200,
                  loc.isp,
                  loc.city,
                  loc.country,
                  loc.lat,
                  loc.lon,
                  JSON.stringify(pages),
                  JSON.stringify(actions),
                  campaignName,
                  adGroup,
                  campaignName,
                  keywords[Math.floor(Math.random() * keywords.length)],
                  isReturning ? 1 : 0,
                  visitCount,
                  revenue,
                  orderId
                ], (err) => {
                  if (err) reject(err);
                  else resolve(true);
                });
      });
      insertPromises.push(promise);
    }

    await Promise.all(insertPromises);
    console.log('>>> [SQL] All high-fidelity inserts finished');
    db.close();
    res.json({ success: true, message: "Successfully seeded 100 records with multi-platform intelligence!" });
  } catch (err: any) {
    console.error('Seed error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/locations/search', async (req: any, res: any) => {
  const { q, country } = req.query;
  if (!q) return res.status(400).json({ error: 'Query required' });
  try {
    const countryParam = country ? `&countrycode=${country}` : '';
    const response = await axios.get(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}${countryParam}&limit=15&lang=en&osm_tag=place`);
    const results = response.data.features.map((f: any) => {
      const p = f.properties;
      const parts = [p.name, p.district, p.city, p.state, p.country].filter(Boolean);
      return {
        display: [...new Set(parts)].join(', '),
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        country: p.country,
        postcode: p.postcode
      };
    });
    res.json(results);
  } catch (err: any) {
    console.error('Location search error:', err.message);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

app.get('/api/track-data', async (req: any, res: any) => {
  console.log('>>> [API] Received request for /api/track-data');
  try {
    const sqlite3 = (await import('sqlite3')).default;
    const db = new sqlite3.Database(SQLITE_DB_PATH);
    
    db.all(`SELECT * FROM AdClick ORDER BY clickedAt DESC LIMIT 200`, [], (err, rows) => {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        // Convert SQL boolean (0/1) back to JS boolean if needed
        const data = rows.map((r: any) => ({
          ...r,
          isReturning: !!r.isReturning,
          isSuspicious: !!r.isSuspicious,
          formInteracted: !!r.formInteracted
        }));
        res.json({ success: true, data });
      }
      db.close();
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// ============================================================
// --- PROFESSIONAL SITEMAP INDEX SYSTEM (Auto-Updating) ---
// ============================================================
const SITE_URL = 'https://rankinganywhere.com';
const today = () => new Date().toISOString().split('T')[0];

const loadDb = () => {
  try {
    const dbPath = path.join(process.cwd(), 'local_db.json');
    if (fs.existsSync(dbPath)) return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (e) {}
  return { blogs: [], whois_cache: {} };
};

// 1. SITEMAP INDEX (Master) — /sitemap.xml
app.get('/sitemap.xml', (req: any, res: any) => {
  try {
    const db = loadDb();
    const sitemaps = [
      { loc: `${SITE_URL}/sitemap-pages.xml`, lastmod: today() },
      { loc: `${SITE_URL}/sitemap-tools.xml`, lastmod: today() },
    ];

    // Only add blog sitemap if there are blog posts
    if ((db.blogs || []).length > 0) {
      sitemaps.push({ loc: `${SITE_URL}/sitemap-blog.xml`, lastmod: today() });
    }

    // Only add whois sitemap if there are cached domains
    if (db.whois_cache && Object.keys(db.whois_cache).length > 0) {
      sitemaps.push({ loc: `${SITE_URL}/sitemap-whois.xml`, lastmod: today() });
    }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    sitemaps.forEach(s => {
      xml += `\n  <sitemap>\n    <loc>${s.loc}</loc>\n    <lastmod>${s.lastmod}</lastmod>\n  </sitemap>`;
    });
    xml += '\n</sitemapindex>';

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    console.error("Sitemap Index Error:", err);
    res.status(500).send("Error generating sitemap index");
  }
});

// 2. STATIC PAGES SITEMAP — /sitemap-pages.xml
app.get('/sitemap-pages.xml', (req: any, res: any) => {
  const pages = [
    { path: '',             priority: '1.0', changefreq: 'daily'   },
    { path: '/about',       priority: '0.8', changefreq: 'monthly' },
    { path: '/contact',     priority: '0.6', changefreq: 'monthly' },
    { path: '/terms',       priority: '0.3', changefreq: 'yearly'  },
    { path: '/guide',       priority: '0.7', changefreq: 'monthly' },
    { path: '/how-to-use',  priority: '0.7', changefreq: 'monthly' },
    { path: '/login',       priority: '0.4', changefreq: 'yearly'  },
    { path: '/register',    priority: '0.4', changefreq: 'yearly'  },
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>';
  xml += '\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  pages.forEach(p => {
    xml += `\n  <url>\n    <loc>${SITE_URL}${p.path}</loc>\n    <lastmod>${today()}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`;
  });
  xml += '\n</urlset>';

  res.header('Content-Type', 'application/xml');
  res.header('Cache-Control', 'public, max-age=3600');
  res.send(xml);
});

// 3. SEO TOOLS SITEMAP — /sitemap-tools.xml
app.get('/sitemap-tools.xml', (req: any, res: any) => {
  const tools = [
    { path: '/free-check',  priority: '0.9', changefreq: 'daily'   },
    { path: '/check-ip',    priority: '0.9', changefreq: 'daily'   },
    { path: '/whois',       priority: '0.9', changefreq: 'daily'   },
    { path: '/keywords',    priority: '0.9', changefreq: 'daily'   },
    { path: '/blog',        priority: '0.8', changefreq: 'daily'   },
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>';
  xml += '\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  tools.forEach(t => {
    xml += `\n  <url>\n    <loc>${SITE_URL}${t.path}</loc>\n    <lastmod>${today()}</lastmod>\n    <changefreq>${t.changefreq}</changefreq>\n    <priority>${t.priority}</priority>\n  </url>`;
  });
  xml += '\n</urlset>';

  res.header('Content-Type', 'application/xml');
  res.header('Cache-Control', 'public, max-age=3600');
  res.send(xml);
});

// 4. BLOG SITEMAP (Auto-Growing) — /sitemap-blog.xml
app.get('/sitemap-blog.xml', (req: any, res: any) => {
  try {
    const db = loadDb();
    const blogs = db.blogs || [];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    blogs.forEach((post: any) => {
      const lastmod = post.updatedAt || post.createdAt || today();
      const dateStr = typeof lastmod === 'string' && lastmod.includes('T') ? lastmod.split('T')[0] : today();
      xml += `\n  <url>\n    <loc>${SITE_URL}/blog/${post.id}</loc>\n    <lastmod>${dateStr}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
    });

    xml += '\n</urlset>';
    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=1800');
    res.send(xml);
  } catch (err) {
    console.error("Blog Sitemap Error:", err);
    res.status(500).send("Error generating blog sitemap");
  }
});

// 5. WHOIS/DOMAIN INTEL SITEMAP (Auto-Growing) — /sitemap-whois.xml
app.get('/sitemap-whois.xml', (req: any, res: any) => {
  try {
    const db = loadDb();
    const domains = Object.keys(db.whois_cache || {});

    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    domains.forEach((domain: string) => {
      const cached = db.whois_cache[domain];
      const dateStr = cached?.audit_time ? cached.audit_time.split('T')[0] : today();
      xml += `\n  <url>\n    <loc>${SITE_URL}/whois/${domain}</loc>\n    <lastmod>${dateStr}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`;
    });

    xml += '\n</urlset>';
    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=1800');
    res.send(xml);
  } catch (err) {
    console.error("Whois Sitemap Error:", err);
    res.status(500).send("Error generating whois sitemap");
  }
});

// --- ROBOTS.TXT (Crawler Instructions) ---
app.get('/robots.txt', (req: any, res: any) => {
  const robots = `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /admin
Disallow: /settings
Disallow: /project-settings
Disallow: /project-insights
Disallow: /admin-portal

Sitemap: ${SITE_URL}/sitemap.xml`;
  res.header('Content-Type', 'text/plain');
  res.send(robots);
});

// Global Request Logger
app.use((req, res, next) => {
  next();
});

// Configure Multer for Profile Picture Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed'));
  }
});

// Serve uploads statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/ping', (req, res) => res.json({ status: 'ok', version: 'v10', time: new Date().toISOString() }));

// --- TECHNOLOGY & SSL DETECTION HELPERS ---
const getSSLInfo = (domain: string): Promise<any> => {
  return new Promise((resolve) => {
    const options = {
      hostname: domain,
      port: 443,
      method: 'GET',
      rejectUnauthorized: false,
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      const cert = (res.socket as any).getPeerCertificate();
      if (cert && Object.keys(cert).length > 0) {
        resolve({
          valid: true,
          issuer: cert.issuer?.O || cert.issuer?.CN,
          valid_from: cert.valid_from,
          valid_to: cert.valid_to,
          protocol: (res.socket as any).getProtocol(),
          days_left: Math.floor((new Date(cert.valid_to).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
        });
      } else {
        resolve({ valid: false, message: "No certificate found" });
      }
      res.resume();
      req.destroy();
    });

    req.on('error', () => resolve({ valid: false, message: "Connection failed" }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ valid: false, message: "Timeout" });
    });
    req.end();
  });
};

const detectTechStack = async (domain: string) => {
  try {
    const url = `http://${domain}`;
    const response = await axios.get(url, { 
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    const headers = response.headers;
    const body = response.data;
    const bodyLower = body.toLowerCase();
    const stack: string[] = [];
    
    let cms = 'Custom / Not Detected';
    let theme = 'Unknown';
    let database = 'Unknown';
    let frontend = 'Vanilla / Unknown';

    // 1. Web Server
    const serverHeader = headers['server'] || 'Unknown';
    if (serverHeader !== 'Unknown') stack.push(serverHeader);
    
    // 2. CMS Detection
    if (bodyLower.includes('wp-content') || bodyLower.includes('wp-includes')) {
      cms = 'WordPress';
      database = 'MySQL / MariaDB';
      // Try to extract theme
      const themeMatch = body.match(/wp-content\/themes\/([a-zA-Z0-9-_]+)\//);
      if (themeMatch) theme = themeMatch[1].charAt(0).toUpperCase() + themeMatch[1].slice(1);
    } else if (bodyLower.includes('shopify.com')) {
      cms = 'Shopify';
      database = 'Proprietary (Shopify)';
    } else if (bodyLower.includes('wix.com')) {
      cms = 'Wix';
      database = 'NoSQL (Wix)';
    } else if (bodyLower.includes('squarespace.com')) {
      cms = 'Squarespace';
    } else if (bodyLower.includes('ghost.org')) {
      cms = 'Ghost';
      database = 'SQLite / MySQL';
    } else if (bodyLower.includes('bitrix')) {
      cms = '1C-Bitrix';
    }

    // 3. Frontend & Frameworks
    if (bodyLower.includes('react') || bodyLower.includes('react.js')) frontend = 'React';
    if (bodyLower.includes('next.js')) frontend = 'Next.js';
    if (bodyLower.includes('vue') || bodyLower.includes('vue.js')) frontend = 'Vue.js';
    if (bodyLower.includes('jquery')) stack.push('jQuery');
    if (bodyLower.includes('bootstrap')) stack.push('Bootstrap');
    if (bodyLower.includes('tailwind')) stack.push('Tailwind CSS');

    // 4. Programming Languages
    let language = 'Unknown';
    if (headers['x-powered-by']?.includes('PHP') || bodyLower.includes('.php')) language = 'PHP';
    if (headers['x-powered-by']?.includes('ASP.NET') || bodyLower.includes('.aspx')) language = 'ASP.NET';
    if (bodyLower.includes('node.js') || bodyLower.includes('express')) language = 'Node.js';

    // 5. CDN / Security
    if (headers['server']?.toLowerCase().includes('cloudflare')) stack.push('Cloudflare');

    return {
      stack: Array.from(new Set(stack)),
      cms,
      theme,
      database,
      frontend,
      language,
      server: serverHeader,
      poweredBy: headers['x-powered-by'] || 'Hidden'
    };
  } catch (err) {
    return { stack: [], cms: 'Unknown', theme: 'Unknown', database: 'Unknown', frontend: 'Unknown', language: 'Unknown', server: 'Unknown', poweredBy: 'Unknown' };
  }
};


// --- KEYWORD INTELLIGENCE (Localized Suggestions) ---
// --- KEYWORD INTELLIGENCE (Professional Deep Discovery) ---
app.get('/api/keywords/suggestions', async (req: any, res: any) => {
  const { q, gl, hl, uule, deep } = req.query;
  if (!q) return res.status(400).json({ error: 'Query is required' });

  try {
    const country = (gl as string || 'us').toLowerCase();
    const language = (hl as string || 'en').toLowerCase();
    
    const googleDomains: any = {
      us: 'google.com', in: 'google.co.in', gb: 'google.co.uk', au: 'google.com.au',
      ca: 'google.ca', de: 'google.de', fr: 'google.fr', es: 'google.es',
      br: 'google.com.br', jp: 'google.co.jp', ae: 'google.ae'
    };

    const domain = googleDomains[country] || 'google.com';
    const baseUrl = `https://www.${domain}/complete/search?client=chrome&gl=${country}&hl=${language}${uule ? `&uule=${uule}` : ''}`;
    
    let allSuggestions: string[] = [];

    // PRO LOGIC: Recursive Alphabet Soup + Common SEO Modifiers
    const searchTerms = [q as string];
    if (deep === 'true') {
      const modifiers = [
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
        'near', 'best', 'service', 'repair', 'company', 'price', 'cost', 'how', 'top', 'cheap', 'online', 'charges', 'agency'
      ];
      modifiers.forEach(m => {
        searchTerms.push(`${q} ${m}`);
      });
    }

    console.log(`🚀 [KEYWORDS PRO] Starting Deep Discovery for: ${q} (${searchTerms.length} nodes)`);

    // Fetch all terms (limited to 40 for stability and rate-limiting safety)
    const activeTerms = deep === 'true' ? searchTerms.slice(0, 40) : [q as string];
    
    const fetchPromises = activeTerms.map(term => 
      axios.get(`${baseUrl}&q=${encodeURIComponent(term)}`, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': `https://www.${domain}/`
        },
        timeout: 4000
      }).catch(() => ({ data: [null, []] }))
    );

    const responses = await Promise.all(fetchPromises);
    responses.forEach(res => {
      const suggestions = res.data[1] || [];
      allSuggestions = [...allSuggestions, ...suggestions];
    });

    // Deduplicate and filter
    const uniqueSuggestions = Array.from(new Set(allSuggestions))
      .filter(s => s.toLowerCase() !== (q as string).toLowerCase());
    
    res.json({
      success: true,
      query: q,
      region: country,
      language: language,
      suggestions: uniqueSuggestions,
      count: uniqueSuggestions.length,
      mode: deep === 'true' ? 'Deep Discovery' : 'Standard'
    });

  } catch (err: any) {
    console.error('Keywords Pro Error:', err.message);
    res.status(500).json({ success: false, message: "Failed to perform deep discovery." });
  }
});


// --- DOMAIN INTELLIGENCE (RDAP/WHOIS) ---
app.get('/api/whois/:domain', async (req: any, res: any) => {
  const { domain } = req.params;
  try {
    const cleanDomain = domain.toLowerCase().trim();
    
    // --- CACHE CHECK (Programmatic SEO) ---
    try {
      const dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      if (dbData.whois_cache && dbData.whois_cache[cleanDomain]) {
        const cached = dbData.whois_cache[cleanDomain];
        const cacheAge = (new Date().getTime() - new Date(cached.audit_time).getTime()) / (1000 * 3600);
        if (cacheAge < 24) { // 24 hour cache
          console.log(`📦 [WHOIS] Returning cached result for ${cleanDomain}`);
          return res.json(cached);
        }
      }
    } catch (e) {}

    const tld = cleanDomain.split('.').pop();
    
    console.log(`🔍 [WHOIS PRO] Deep Audit: ${cleanDomain} (TLD: ${tld})`);
    
    // Intelligent RDAP Routing with Fallbacks
    const servers = [];
    
    // Primary authoritative servers
    if (tld === 'com' || tld === 'net') {
      servers.push(`https://rdap.verisign.com/v1/domain/${cleanDomain}`);
    } else if (tld === 'org') {
      servers.push(`https://rdap.publicinterestregistry.org/rdap/domain/${cleanDomain}`);
    }
    
    // Global gateways
    servers.push(`https://rdap.org/domain/${cleanDomain}`);
    servers.push(`https://www.rdap.net/domain/${cleanDomain}`);

    let lastError = null;
    for (const url of servers) {
      try {
        console.log(`📡 [WHOIS] Trying: ${url}`);
        const response = await axios.get(url, { 
          timeout: 10000,
          headers: { 
            'Accept': 'application/rdap+json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        if (response.data && !response.data.errorCode) {
          console.log(`✅ [WHOIS] Success from ${url}`);
          
          const processed = processRdapData(response.data, cleanDomain);
          
          // 1. Hosting Enrichment (Professional Domain-to-IP Intelligence)
          let hosting: any = { ip: 'N/A', provider: 'Unknown', city: 'Unknown', country: 'Unknown' };
          try {
            console.log(`📡 [WHOIS] Resolving IPv4 for ${cleanDomain}...`);
            let targetIp = null;
            
            // Step 1: Force IPv4 DNS Lookup (Most stable for geolocation APIs)
            try {
              const lookup = await dns.promises.lookup(cleanDomain, { family: 4 });
              targetIp = lookup.address;
            } catch (e) {
              try {
                const addresses = await dns.promises.resolve4(cleanDomain);
                if (addresses && addresses.length > 0) targetIp = addresses[0];
              } catch (e2) {
                // Last resort: Get IP from ip-api directly
                try {
                  const quickRes = await axios.get(`http://ip-api.com/json/${cleanDomain}?fields=query`, { timeout: 4000 });
                  if (quickRes.data?.query) targetIp = quickRes.data.query;
                } catch (e3) {}
              }
            }

            if (targetIp) {
              hosting.ip = targetIp;
              console.log(`📡 [WHOIS] Fetching Geo Intelligence for ${targetIp}...`);
              
              // Use ip-api.com with the resolved IP
              const geoRes = await axios.get(`http://ip-api.com/json/${targetIp}?fields=status,message,country,countryCode,regionName,city,isp,org,query`, { timeout: 6000 });
              
              if (geoRes.data && geoRes.data.status === 'success') {
                hosting = {
                  ip: targetIp,
                  provider: geoRes.data.isp || 'Unknown',
                  org: geoRes.data.org || 'Unknown',
                  country: geoRes.data.country || 'Unknown',
                  country_code: geoRes.data.countryCode || 'UN',
                  city: geoRes.data.city || 'Unknown',
                  region: geoRes.data.regionName || 'Unknown'
                };
                console.log(`✅ [WHOIS] Infrastructure resolved: ${hosting.ip} (${hosting.provider})`);
              }
            }
          } catch (hErr) { console.error("Final Hosting fail:", hErr.message); }

          // 2. Tech & SSL Enrichment (Isolated)
          let tech = { stack: [], server: 'Unknown', poweredBy: 'Unknown' };
          let ssl = { valid: false };
          try {
            const [t, s] = await Promise.all([
              detectTechStack(cleanDomain).catch(() => tech),
              getSSLInfo(cleanDomain).catch(() => ssl)
            ]);
            tech = t;
            ssl = s;
          } catch (e) { console.warn("Tech/SSL enrichment failed:", e); }

          // 3. WEBSITE METADATA FETCHING (For 'About' Section)
          let siteMeta = { title: '', description: '', h1: '', keywords: '' };
          try {
            const metaRes = await axios.get(`http://${cleanDomain}`, { timeout: 5000 });
            const $ = cheerio.load(metaRes.data);
            siteMeta = {
              title: $('title').text().trim(),
              description: $('meta[name="description"]').attr('content')?.trim() || '',
              keywords: $('meta[name="keywords"]').attr('content')?.trim() || '',
              h1: $('h1').first().text().trim()
            };
          } catch (mErr) { console.warn("Metadata fetch failed:", mErr.message); }

          const finalResult = {
            success: true,
            domain: cleanDomain,
            ...processed,
            hosting,
            tech,
            ssl,
            siteMeta,
            audit_time: new Date().toISOString()
          };

          // --- PERSIST TO DATABASE (Programmatic SEO) ---
          try {
            const dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
            if (!dbData.whois_cache) dbData.whois_cache = {};
            dbData.whois_cache[cleanDomain] = finalResult;
            fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2));
          } catch (e) { console.error("Cache save error:", e); }

          return res.json(finalResult);
        }
      } catch (err: any) {
        console.warn(`⚠️ [WHOIS] Registry ${url} error: ${err.message}`);
        lastError = err;
      }
    }

    throw new Error(lastError?.message || 'Registry lookup failed');

  } catch (err: any) {
    console.error('WHOIS PRO CRITICAL:', err.message);
    res.status(500).json({ 
      success: false, 
      message: `Deep audit failed for ${domain}. ${err.message}` 
    });
  }
});

// Helper to Parse vCard data from RDAP
const parseVCard = (vcardArray: any) => {
  if (!vcardArray || !vcardArray[1]) return null;
  const info: any = {};
  vcardArray[1].forEach((field: any) => {
    if (field[0] === 'fn') info.name = field[3];
    if (field[0] === 'email') info.email = field[3];
    if (field[0] === 'tel') {
      if (Array.isArray(field[3])) info.phone = field[3].join(', ');
      else info.phone = field[3];
    }
    if (field[0] === 'adr') {
      const adr = field[3];
      if (Array.isArray(adr)) info.address = adr.filter((a: any) => a).join(', ');
      else info.address = adr;
    }
    if (field[0] === 'org') info.organization = field[3];
  });
  return info;
};

// Helper to Process RDAP Data consistently

// --- IP INTELLIGENCE PROXY ---
app.get('/api/ip-info', async (req: any, res: any) => {
  try {
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // In local development, clientIp might be ::1 or 127.0.0.1
    // We'll use a reliable external service to get the actual public IP if needed
    if (clientIp === '::1' || clientIp === '127.0.0.1' || !clientIp) {
      const v4Res = await axios.get('https://api.ipify.org?format=json');
      clientIp = v4Res.data.ip;
    }

    // Clean up IP if it has multiple (from proxy)
    if (typeof clientIp === 'string' && clientIp.includes(',')) {
      clientIp = clientIp.split(',')[0].trim();
    }

    const response = await axios.get(`https://ipwho.is/${clientIp}`);
    res.json(response.data);
  } catch (err) {
    console.error('IP Info Error:', err);
    res.status(500).json({ success: false, message: "Server failed to fetch IP details" });
  }
});

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

// --- PUBLIC SEO AUDIT TOOL ---
app.post('/api/audit', async (req: any, res: any) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;
    console.log(`🔍 [AUDIT] Starting deep scan for: ${targetUrl}`);

    let response;
    try {
      response = await axios.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 15000,
        maxRedirects: 5
      });
    } catch (axiosErr: any) {
      console.error(`❌ [AUDIT] Fetch failed for ${targetUrl}:`, axiosErr.message);
      return res.status(axiosErr.response?.status || 500).json({
        error: `Could not reach the website. ${axiosErr.message}. Make sure the URL is correct and the site is public.`
      });
    }

    if (!response.data || typeof response.data !== 'string') {
      return res.status(500).json({ error: 'The website returned an empty or invalid response.' });
    }

    const $ = cheerio.load(response.data);

    // 1. DATA EXTRACTION
    const title = $('title').text() || '';
    const description = $('meta[name="description"]').attr('content') || '';
    const canonical = $('link[rel="canonical"]').attr('href') || '';
    const lang = $('html').attr('lang') || '';
    const charset = $('meta[charset]').attr('charset') || '';
    const viewport = $('meta[name="viewport"]').attr('content') || '';

    const headings: any = { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] };
    for (let i = 1; i <= 6; i++) {
      $(`h${i}`).each((_, el) => { headings[`h${i}`].push($(el).text().trim()); });
    }

    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = bodyText.split(' ').length;

    let totalImages = 0;
    let missingAlt = 0;
    $('img').each((_, el) => {
      totalImages++;
      if (!$(el).attr('alt')) missingAlt++;
    });

    const pageSize = Buffer.byteLength(response.data, 'utf8');

    let internalLinks = 0;
    let externalLinks = 0;
    const domain = new URL(targetUrl).hostname;
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        if (href.startsWith('/') || href.includes(domain)) internalLinks++;
        else if (href.startsWith('http')) externalLinks++;
      }
    });

    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    const twitterCard = $('meta[name="twitter:card"]').attr('content') || '';
    const hasSchema = $('script[type="application/ld+json"]').length > 0;
    const hasAnalytics = response.data.includes('googletagmanager.com') || response.data.includes('google-analytics.com');

    // 2. CATEGORICAL SCORING (100pt base for each)
    const scores = {
      seo: 0,
      links: 0,
      usability: 0,
      performance: 0,
      social: 0
    };

    const recommendations: any[] = [];

    // --- SEO (30%) ---
    if (title) scores.seo += 30;
    else recommendations.push({ task: 'Add a Title Tag to your page', priority: 'High', category: 'On-Page SEO' });

    if (title.length >= 30 && title.length <= 65) scores.seo += 20;
    else if (title) recommendations.push({ task: 'Optimize Title Tag length (30-65 chars)', priority: 'Medium', category: 'On-Page SEO' });

    if (description) scores.seo += 30;
    else recommendations.push({ task: 'Add a Meta Description', priority: 'High', category: 'On-Page SEO' });

    if (headings.h1.length === 1) scores.seo += 20;
    else recommendations.push({ task: 'Ensure exactly one H1 tag exists', priority: 'High', category: 'On-Page SEO' });

    // --- Usability (20%) ---
    if (viewport) scores.usability += 50;
    else recommendations.push({ task: 'Add a Viewport Meta Tag for mobile', priority: 'High', category: 'Usability' });

    if (lang) scores.usability += 25;
    if (favicon) scores.usability += 25;

    // --- Performance (20%) ---
    if (pageSize < 500000) scores.performance += 70;
    else recommendations.push({ task: 'Reduce page size (under 500KB)', priority: 'Medium', category: 'Performance' });

    if (response.headers['content-encoding']) scores.performance += 30;

    // --- Social (15%) ---
    if (ogTitle && ogImage) scores.social += 60;
    else recommendations.push({ task: 'Implement OpenGraph meta tags', priority: 'Medium', category: 'Social' });

    if (hasSchema) scores.social += 40;
    else recommendations.push({ task: 'Add JSON-LD Structured Data', priority: 'Low', category: 'Social' });

    // --- Links (15%) ---
    if (internalLinks > 5) scores.links += 60;
    if (externalLinks > 0) scores.links += 40;

    // Total Score and Grade Logic
    const totalScore = Math.round((scores.seo * 0.35) + (scores.usability * 0.20) + (scores.performance * 0.20) + (scores.social * 0.15) + (scores.links * 0.10));

    const getGrade = (s: number) => {
      if (s >= 90) return 'A+';
      if (s >= 80) return 'A';
      if (s >= 70) return 'B';
      if (s >= 60) return 'C';
      if (s >= 50) return 'D';
      return 'F';
    };

    res.json({
      url: targetUrl,
      grade: getGrade(totalScore),
      score: totalScore,
      recommendations: recommendations.sort((a, b) => {
        const p: any = { High: 3, Medium: 2, Low: 1 };
        return p[b.priority] - p[a.priority];
      }),
      categories: {
        seo: { grade: getGrade(scores.seo), score: scores.seo, label: 'On-Page SEO' },
        links: { grade: getGrade(scores.links), score: scores.links, label: 'Links' },
        usability: { grade: getGrade(scores.usability), score: scores.usability, label: 'Usability' },
        performance: { grade: getGrade(scores.performance), score: scores.performance, label: 'Performance' },
        social: { grade: getGrade(scores.social), score: scores.social, label: 'Social' }
      },
      details: {
        title: { text: title, length: title.length },
        description: { text: description, length: description.length },
        headings: {
          h1: headings.h1.length,
          h2: headings.h2.length,
          h3: headings.h3.length,
          all: headings
        },
        images: { total: totalImages, missingAlt },
        links: { internal: internalLinks, external: externalLinks },
        technical: {
          ssl: targetUrl.startsWith('https'),
          pageSize: `${(pageSize / 1024).toFixed(1)} KB`,
          lang,
          charset,
          hasAnalytics
        }
      }
    });

  } catch (err: any) {
    console.error('Audit Error:', err.message);
    res.status(500).json({ error: `Could not audit site: ${err.message}` });
  }
});

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

app.post('/api/auth/resend-verification', async (req: any, res: any) => {
  const { email } = req.body;
  const db = getDB();
  const user = db.users.find((u: any) => u.email === email);

  if (!user) return res.status(400).json({ error: 'User not found' });
  if (user.isVerified) return res.status(400).json({ error: 'User is already verified' });

  const verificationToken = user.verificationToken || (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  user.verificationToken = verificationToken;
  persistDB();

  const verificationLink = `${process.env.APP_URL}/verify?token=${verificationToken}`;
  console.log('-----------------------------------------');
  console.log('📧 [RESEND] Activation Email sent to:', email);
  console.log('🔗 Link:', verificationLink);
  console.log('-----------------------------------------');

  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail({
        from: `"RankTracker Pro" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Activate Your SEO Tracker Account (Resend)",
        html: `
          <h1>Welcome back to RankTracker Pro!</h1>
          <p>Hi ${user.name},</p>
          <p>Here is your new activation link. Please click the link below to verify your email address and activate your account:</p>
          <a href="${verificationLink}" style="padding: 10px 20px; background: #00f2fe; color: #000; text-decoration: none; border-radius: 5px;">Verify My Account</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${verificationLink}</p>
        `
      });
    }
  } catch (err) {
    console.error('❌ Email resend failed:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }

  res.json({ success: true, message: 'Verification email resent successfully' });
});

app.post('/api/auth/forgot-password', async (req: any, res: any) => {
  const { email } = req.body;
  const db = getDB();
  const user = db.users.find((u: any) => u.email === email);

  if (!user) return res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });

  const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  user.resetToken = resetToken;
  user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
  persistDB();

  const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
  console.log('-----------------------------------------');
  console.log('📧 [RESET] Password Reset Email sent to:', email);
  console.log('🔗 Link:', resetLink);
  console.log('-----------------------------------------');

  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail({
        from: `"RankTracker Pro" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Reset Your Password - RankTracker Pro",
        html: `
          <h1>Password Reset Request</h1>
          <p>Hi ${user.name},</p>
          <p>You requested to reset your password. Please click the link below to set a new password:</p>
          <br/>
          <a href="${resetLink}" style="padding: 10px 20px; background: #00f2fe; color: #000; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <br/><br/>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `
      });
    }
  } catch (err) {
    console.error('❌ Reset email sending failed:', err);
  }

  res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
});

app.post('/api/auth/reset-password', async (req: any, res: any) => {
  const { token, newPassword } = req.body;
  const db = getDB();
  const user = db.users.find((u: any) => u.resetToken === token && u.resetTokenExpiry > Date.now());

  if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetToken = null;
  user.resetTokenExpiry = null;
  persistDB();

  res.json({ success: true, message: 'Password has been reset successfully.' });
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

  // Email verification skipped for local development
  // if (!user.isVerified) return res.status(403).json({ error: 'Please verify your email.' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email } });
});

// --- COMMUNITY & BLOG CMS ENDPOINTS ---

// 1. PUBLIC: Submit a comment (Sent to pending)
app.post('/api/comments', (req: any, res: any) => {
  const { name, email, fb, ig, li, text } = req.body;
  if (!name || !text) return res.status(400).json({ error: 'Name and comment are required' });
  
  const db = getDB();
  const newComment = {
    id: Date.now().toString(),
    name, email, fb, ig, li, text,
    status: 'pending',
    date: new Date().toISOString()
  };
  
  db.pendingComments = db.pendingComments || [];
  db.pendingComments.push(newComment);
  persistDB();
  res.json({ success: true, message: 'Comment submitted for moderation' });
});

// 2. PUBLIC: Get all approved comments
app.get('/api/comments/approved', (req: any, res: any) => {
  const db = getDB();
  res.json(db.approvedComments || []);
});

// 3. ADMIN: Get pending comments
app.get('/api/admin/comments/pending', authenticateToken, (req: any, res: any) => {
  // Security: Only authorized email
  if (req.user.email !== "rameshmjk@gmail.com") return res.status(403).json({ error: 'Access Denied' });
  
  const db = getDB();
  res.json(db.pendingComments || []);
});

// 4. ADMIN: Approve a comment
app.post('/api/admin/comments/approve/:id', authenticateToken, (req: any, res: any) => {
  if (req.user.email !== "rameshmjk@gmail.com") return res.status(403).json({ error: 'Access Denied' });
  
  const { id } = req.params;
  const db = getDB();
  
  const idx = db.pendingComments.findIndex((c: any) => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Comment not found' });
  
  const comment = db.pendingComments.splice(idx, 1)[0];
  comment.status = 'approved';
  
  db.approvedComments = db.approvedComments || [];
  db.approvedComments.push(comment);
  persistDB();
  res.json({ success: true });
});

// 5. ADMIN: Delete a comment (Pending or Approved)
app.delete('/api/admin/comments/:id', authenticateToken, (req: any, res: any) => {
  if (req.user.email !== "rameshmjk@gmail.com") return res.status(403).json({ error: 'Access Denied' });
  
  const { id } = req.params;
  const db = getDB();
  
  db.pendingComments = (db.pendingComments || []).filter((c: any) => c.id !== id);
  db.approvedComments = (db.approvedComments || []).filter((c: any) => c.id !== id);
  persistDB();
  res.json({ success: true });
});

// 6. ADMIN: Login
app.post('/api/admin/login', (req: any, res: any) => {
  const { email, password } = req.body;
  if (email === "rameshmjk@gmail.com" && password === "admin@12345") {
    const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid admin credentials' });
});

// 7. ADMIN: Blog CMS - Create Post
app.post('/api/admin/blogs', authenticateToken, (req: any, res: any) => {
  if (req.user.email !== "rameshmjk@gmail.com") return res.status(403).json({ error: 'Access Denied' });
  
  const { title, content, author, category, image } = req.body;
  const db = getDB();
  
  const newPost = {
    id: Date.now().toString(),
    title, content, author, category, image,
    date: new Date().toISOString()
  };
  
  db.blogs = db.blogs || [];
  db.blogs.push(newPost);
  persistDB();
  res.json(newPost);
});

// 7. PUBLIC: Get all blogs
app.get('/api/blogs', (req: any, res: any) => {
  const db = getDB();
  res.json(db.blogs || []);
});

// 8. ADMIN: Blog CMS - Update Post
app.put('/api/admin/blogs/:id', authenticateToken, (req: any, res: any) => {
  if (req.user.email !== "rameshmjk@gmail.com") return res.status(403).json({ error: 'Access Denied' });
  const { id } = req.params;
  const { title, content, category, image } = req.body;
  const db = getDB();
  const idx = db.blogs.findIndex((b: any) => b.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Post not found' });
  db.blogs[idx] = { ...db.blogs[idx], title, content, category, image, updatedAt: new Date().toISOString() };
  persistDB();
  res.json(db.blogs[idx]);
});

// 9. ADMIN: Blog CMS - Delete Post
app.delete('/api/admin/blogs/:id', authenticateToken, (req: any, res: any) => {
  if (req.user.email !== "rameshmjk@gmail.com") return res.status(403).json({ error: 'Access Denied' });
  const { id } = req.params;
  const db = getDB();
  const initialCount = (db.blogs || []).length;
  
  db.blogs = (db.blogs || []).filter((b: any) => String(b.id) !== String(id));
  
  if ((db.blogs || []).length === initialCount) {
    console.warn(`[CMS] Delete failed: Post ID ${id} not found.`);
    return res.status(404).json({ error: 'Post not found' });
  }

  persistDB();
  console.log(`[CMS] Deleted Post ID: ${id}`);
  res.json({ success: true });
});

// 10. ADMIN: Magic Auto-Post Engine
app.post('/api/admin/auto-post', authenticateToken, (req: any, res: any) => {
  if (req.user.email !== "rameshmjk@gmail.com") return res.status(403).json({ error: 'Access Denied' });
  
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  const db = getDB();
  
  // Advanced AI Mock Generator Logic
  const generateUniqueContent = (t: string) => {
    const keywords = t.toLowerCase();
    let intro = "";
    let body1 = "";
    let body2 = "";
    let conclusion = "";

    if (keywords.includes('seo') || keywords.includes('rank')) {
      intro = `Search Engine Optimization in 2026 is a different beast altogether. Mastering <b>${t}</b> requires a deep understanding of semantic search and user intent.`;
      body1 = `Technically, ${t} relies on high-quality backlink profiles and lightning-fast Core Web Vitals. If your site isn't loading under 1s, you're losing 60% of your potential traffic.`;
      body2 = `Local signals and UULE precision are the new gold standards. By focusing on the nuances of ${t}, we can bypass traditional ranking barriers.`;
    } else if (keywords.includes('ai') || keywords.includes('magic') || keywords.includes('future')) {
      intro = `The era of Artificial Intelligence is reshaping how we view <b>${t}</b>. It's no longer about manual labor; it's about algorithmic efficiency.`;
      body1 = `Generative AI models are now capable of analyzing ${t} at a scale previously unimaginable. This allows for hyper-personalized user experiences.`;
      body2 = `However, the human element remains irreplaceable. Combining AI automation with human strategy is the only way to win the ${t} game.`;
    } else {
      intro = `Exploring the depths of <b>${t}</b> reveals a fascinating intersection of technology and market psychology.`;
      body1 = `Many experts believe that ${t} will be the primary driver of digital growth over the next decade. The data suggests a 400% increase in engagement when handled correctly.`;
      body2 = `Implementing ${t} effectively requires a multi-faceted approach, balancing immediate results with long-term sustainability.`;
    }

    conclusion = `In conclusion, <b>${t}</b> is not just a trend—it's a fundamental shift in the digital landscape. Stay tuned for more deep-dives into search intelligence.`;

    return `
      <h2>The Definitive Perspective on ${t}</h2>
      <p>${intro}</p>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 15px; border-left: 5px solid var(--accent); margin: 30px 0;">
         <h3 style="margin-top: 0;">Key Technical Insight</h3>
         <p>${body1}</p>
      </div>

      <h3>Strategic Implementation of ${t}</h3>
      <p>${body2}</p>

      <blockquote style="font-size: 20px; font-style: italic; color: #64748b; border-left: 4px solid #e2e8f0; padding-left: 20px; margin: 40px 0;">
         "Digital dominance is not about being the loudest; it's about being the most relevant. ${t} is the bridge to that relevance."
      </blockquote>

      <p>${conclusion}</p>
    `;
  };

  const content = generateUniqueContent(title);

  const newPost = {
    id: Date.now().toString(),
    title,
    content,
    author: 'Ranking AI',
    category: 'SEO Tips',
    date: new Date().toISOString()
  };

  db.blogs = db.blogs || [];
  db.blogs.push(newPost);
  persistDB();
  res.json(newPost);
});

// Helper to Load/Save Local JSON DB
const loadDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      projects: [],
      keywords: [],
      users: [],
      extensionTasks: [],
      pendingComments: [],
      approvedComments: [],
      blogs: [
        {
          id: "demo-1",
          title: "10 Secret Ways to Boost Local SEO in 2026",
          content: "<h2>Mastering the Local SERPs</h2><p>Local SEO is no longer just about keywords. It's about geographic authority and user trust. In this post, we explore how UULE technology and precise location tracking can give you an edge over competitors who are still using outdated scraping methods.</p>",
          category: "Local Search",
          author: "Admin",
          date: new Date().toISOString(),
          image: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=800"
        },
        {
          id: "demo-2",
          title: "The Science of UULE: Precise Google Rankings",
          content: "<h2>What is UULE?</h2><p>UULE is a base64 encoded parameter used by Google to represent a specific geographic location. Most SEO trackers fail because they don't encode this correctly. Ranking Anywhere uses a proprietary 1:1 mapping algorithm to ensure 99.9% accuracy in local results.</p>",
          category: "SEO Tips",
          author: "Admin",
          date: new Date().toISOString(),
          image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800"
        },
        {
          id: "auto-1",
          title: "The Future of Local SEO: AI & Automation",
          content: "<h2>AI-Powered Local Growth</h2><p>As we move into 2026, manual tracking is becoming obsolete. AI and machine learning are now driving search results. To stay ahead, businesses must adopt automated systems that can react to algorithm changes in real-time.</p>",
          category: "News",
          author: "Ranking AI",
          date: new Date().toISOString(),
          image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800"
        },
        {
          id: "auto-2",
          title: "How to Dominate Google Maps in 30 Days",
          content: "<h2>Google Maps Mastery</h2><p>Ranking in the top 3 of Google Maps is the fastest way to grow a local business. By optimizing your GBP (Google Business Profile) and ensuring your citations are 100% consistent across the web, you can skyrocket your leads.</p>",
          category: "Local Search",
          author: "Ranking AI",
          date: new Date().toISOString(),
          image: "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&q=80&w=800"
        },
        {
          id: "auto-3",
          title: "Why Ranking Precision is the New Currency",
          content: "<h2>Data Accuracy Matters</h2><p>In the world of SEO, bad data is worse than no data. Accurate ranking tracking allows you to make informed decisions that save thousands in marketing spend.</p>",
          category: "SEO Tips",
          author: "Ranking AI",
          date: new Date().toISOString(),
          image: "https://images.unsplash.com/photo-1454165833762-02ac4f408d18?auto=format&fit=crop&q=80&w=800"
        },
        {
          id: "hist-1",
          title: "The Power of Mobile-First SEO in 2026",
          content: "<h2>Mobile is King</h2><p>With over 90% of searches happening on mobile devices, optimizing for small screens is no longer optional. Google's mobile-first indexing means your mobile site is the primary version for ranking.</p>",
          category: "SEO Tips",
          author: "Admin",
          date: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=800"
        },
        {
          id: "hist-2",
          title: "Core Web Vitals: A Technical Deep Dive",
          content: "<h2>Speed and Stability</h2><p>LCP, FID, and CLS are the new metrics that define user experience. Learn how to optimize your server and frontend code to score 100/100 on PageSpeed Insights.</p>",
          category: "Product Updates",
          author: "Admin",
          date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          image: "https://images.unsplash.com/photo-1551288049-bbda48658a7d?auto=format&fit=crop&q=80&w=800"
        },
        {
          id: "hist-3",
          title: "Voice Search: The Next SEO Frontier",
          content: "<h2>Conversational AI</h2><p>People search differently when they speak. Long-tail keywords and natural language processing are now essential for ranking on voice assistants.</p>",
          category: "News",
          author: "Admin",
          date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          image: "https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&q=80&w=800"
        }
      ],
      settings: {
        globalSerperApiKey: '',
        globalScrapingdogApiKey: '',
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

  // Migration: Ensure all projects have verification status
  db.projects = (db.projects || []).map((p: any) => ({
    ...p,
    isVerified: p.isVerified === undefined ? false : p.isVerified
  }));

  // CLEANUP: Remove old global strategy fields if they exist
  delete (db.settings as any).scrapingMode;
  delete (db.settings as any).defaultDevice;
  delete (db.settings as any).residentialProxy;

  // Migration: Ensure all projects have strategy fields
  db.projects = (db.projects || []).map((p: any) => {
    let strategy = p.scrapingStrategy || 'standard';

    // Allow strategies as they are

    return {
      ...p,
      scrapingStrategy: strategy, // Now only: standard, direct_proxy
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

persistDB();
console.log('✅ Database synchronized with disk.');

// --- PROFILE MANAGEMENT ENDPOINTS ---

app.put('/api/auth/profile', authenticateToken, async (req: any, res: any) => {
  const { name, email, currentPassword, newPassword } = req.body;
  const db = getDB();
  const user = db.users.find((u: any) => String(u.id) === String(req.user.id));

  if (!user) return res.status(404).json({ error: 'User not found' });

  // If email is being changed, check if new email is already taken
  if (email && email !== user.email) {
    const existing = db.users.find((u: any) => u.email === email);
    if (existing) return res.status(400).json({ error: 'Email already in use' });
    user.email = email;
  }

  if (name) user.name = name;

  // Password Update Logic
  if (newPassword) {
    if (!currentPassword && user.password) {
      return res.status(400).json({ error: 'Current password required to set new password' });
    }
    
    // For Google users who might not have a password yet
    if (user.password) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ error: 'Incorrect current password' });
    }
    
    user.password = await bcrypt.hash(newPassword, 10);
  }

  persistDB();
  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, picture: user.picture } });
});

app.post('/api/auth/upload-picture', authenticateToken, upload.single('picture'), (req: any, res: any) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const db = getDB();
  const user = db.users.find((u: any) => String(u.id) === String(req.user.id));
  if (!user) return res.status(404).json({ error: 'User not found' });

  const pictureUrl = `${process.env.APP_URL || 'http://localhost:5001'}/uploads/${req.file.filename}`;
  user.picture = pictureUrl;
  persistDB();

  res.json({ success: true, picture: pictureUrl });
});

app.post('/api/settings/test-proxy', authenticateToken, async (req: any, res: any) => {
  const { proxyUrl } = req.body;
  if (!proxyUrl) return res.status(400).json({ error: 'Proxy URL required' });

  try {
    const config: any = { timeout: 10000 };
    if (proxyUrl) {
      try {
        const url = new URL(proxyUrl);
        const protocol = url.protocol.replace(':', '');
        config.proxy = {
          host: url.hostname,
          port: parseInt(url.port || '80'),
          protocol: protocol
        };
        if (url.username && url.password) {
          config.proxy.auth = { username: url.username, password: url.password };
        }
      } catch (e) {
        // Fallback for host:port format
        const [host, port] = proxyUrl.split(':');
        config.proxy = { host, port: parseInt(port || '80') };
      }
    }

    const testRes = await axios.get('https://api.ipify.org?format=json', config);
    res.json({ success: true, ip: testRes.data.ip });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const cleanUrl = (url: string) => {
  if (!url) return '';
  return url.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/i, '').split('/')[0].replace(/\/+$/, '');
};

app.get('/api/projects', authenticateToken, (req: any, res: any) => {
  const db = getDB();
  const userProjects = db.projects.filter((p: any) => String(p.userId) === String(req.user.id));
  res.json(userProjects);
});

app.post('/api/projects', authenticateToken, (req: any, res: any) => {
  console.log('>>> [API] POST /api/projects - Body:', req.body);
  const { name, url, businessName, targetRegion, schedule, defaultLocation, defaultLat, defaultLng, pincode, usePincode } = req.body;
  const db = getDB();

  const newProject = {
    id: Date.now().toString(),
    userId: req.user.id,
    name,
    url: cleanUrl(url),
    businessName,
    targetRegion: targetRegion || 'au',
    schedule: schedule || 'instant',
    defaultLocation: defaultLocation || '',
    defaultLat: Number(defaultLat) || 0,
    defaultLng: Number(defaultLng) || 0,
    pincode: pincode || '',
    usePincode: !!usePincode,
    scrapingStrategy: req.body.scrapingStrategy || 'standard',
    preferredApi: req.body.preferredApi || 'hybrid',
    device: req.body.device || 'desktop',
    proxyUrl: req.body.proxyUrl || '',
    lastChecked: null,
    status: 'active'
  };
  db.projects.push(newProject);
  persistDB();
  res.json(newProject);
});

app.put('/api/projects/:id', authenticateToken, (req: any, res: any) => {
  const { id } = req.params;
  const db = getDB();
  const index = db.projects.findIndex((p: any) => String(p.id) === String(id) && String(p.userId) === String(req.user.id));
  if (index === -1) return res.status(404).json({ error: 'Project not found' });

  const updated = { ...db.projects[index], ...req.body, url: cleanUrl(req.body.url || db.projects[index].url) };
  db.projects[index] = updated;
  persistDB();
  res.json(updated);
});

app.delete('/api/projects/:id', authenticateToken, (req: any, res: any) => {
  const { id } = req.params;
  const db = getDB();
  const index = db.projects.findIndex((p: any) => String(p.id) === String(id) && String(p.userId) === String(req.user.id));
  if (index === -1) return res.status(404).json({ error: 'Project not found' });

  db.projects.splice(index, 1);
  // Also delete associated keywords
  db.keywords = db.keywords.filter((k: any) => String(k.projectId) !== String(id));
  persistDB();
  res.json({ success: true });
});

app.post('/api/projects/:id/verify', authenticateToken, async (req: any, res: any) => {
  const { id } = req.params;
  const db = getDB();
  const project = db.projects.find((p: any) => String(p.id) === String(id) && String(p.userId) === String(req.user.id));
  
  if (!project) return res.status(404).json({ error: 'Project not found' });

  try {
    let verified = false;
    let reason = '';

    // Step 1: Check if we have received ANY traffic for this URL yet
    const sqlite3 = (await import('sqlite3')).default;
    const sqliteDB = new sqlite3.Database(SQLITE_DB_PATH);
    
    const hasClicks = await new Promise((resolve) => {
      sqliteDB.get(`SELECT COUNT(*) as count FROM AdClick WHERE websiteUrl LIKE ?`, [`%${project.url}%`], (err, row: any) => {
        if (err) resolve(false);
        else resolve(row.count > 0);
      });
    });
    sqliteDB.close();

    if (hasClicks) {
      verified = true;
      reason = 'Traffic signal detected';
    } else {
      // Step 2: Try to fetch the site and look for the snippet
      try {
        const targetUrl = project.url.startsWith('http') ? project.url : `https://${project.url}`;
        const response = await axios.get(targetUrl, { timeout: 10000 });
        const html = response.data;
        if (html.includes('RA_TRACKER_URL') || html.includes('tracker.js')) {
          verified = true;
          reason = 'Snippet found in source code';
        } else {
          reason = 'Snippet not found on homepage';
        }
      } catch (e) {
        reason = 'Website unreachable or blocked verification bot';
      }
    }

    if (verified) {
      project.isVerified = true;
      persistDB();
      res.json({ success: true, message: `Domain verified! ${reason}` });
    } else {
      res.status(400).json({ success: false, error: reason });
    }
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
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
      activePriority: item.activePriority || 'city',
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
  console.log(`>>> [API] PUT /api/projects/${id} - Body:`, req.body);
  const updates = req.body;
  const db = getDB();
  const index = db.projects.findIndex((p: any) => String(p.id) === String(id) && String(p.userId) === String(req.user.id));

  if (index !== -1) {
    const oldStatus = db.projects[index].status;
    const cleanedUpdates = { ...updates };
    if (cleanedUpdates.url) {
      cleanedUpdates.url = cleanUrl(cleanedUpdates.url);
    }
    db.projects[index] = { ...db.projects[index], ...cleanedUpdates };

    // If status changed to paused, clear the extension queue for this project
    if (db.projects[index].status === 'paused' && oldStatus !== 'paused' && db.extensionTasks) {
      db.extensionTasks = db.extensionTasks.filter((t: any) => String(t.projectId) !== String(id));
      console.log(`[Extension] Purged queue for project ${id} due to pause.`);
    }

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

app.post('/api/settings/test-scrapingdog', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'API key required' });

  console.log(`[SYSTEM] Testing ScrapingDog Key: ${apiKey.substring(0, 8)}...`);

  try {
    // ScrapingDog test: Use the actual Google endpoint they likely signed up for
    const testRes = await axios.get(`https://api.scrapingdog.com/google?api_key=${apiKey}&query=test&gl=au&num=1`, {
      timeout: 15000 // 15s timeout for proxy rotation
    });

    console.log(`[SYSTEM] ScrapingDog Test Success:`, testRes.status);

    const db = getDB();
    db.settings.scrapingdogQuotaActive = true;
    persistDB();

    res.json({ 
      success: true, 
      message: 'Connection established',
      data: 'API is active and responding.'
    });
  } catch (err: any) {
    console.error(`[SYSTEM] ScrapingDog Test Failed:`, err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      success: false,
      error: err.response?.data?.error || err.message || 'Invalid ScrapingDog Key'
    });
  }
});

app.post('/api/settings/test-serpapi', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'API key required' });

  try {
    const testRes = await axios.get(`https://serpapi.com/account?api_key=${apiKey}`, { timeout: 8000 });
    
    const db = getDB();
    db.settings.serpapiQuotaActive = true;
    persistDB();

    res.json({ success: true, message: 'Valid SerpApi Key' });
  } catch (err: any) {
    res.status(err.response?.status || 500).json({
      success: false,
      error: 'Invalid SerpApi Key'
    });
  }
});

// Settings Management (User-Specific)
app.get('/api/settings', authenticateToken, (req: any, res: any) => {
  const db = getDB();
  const userId = req.user.id;
  
  db.userSettings = db.userSettings || {};
  // If user has no settings, return empty. 
  // Fallback to global only for admin for legacy support if needed, but here we want fresh for others.
  const userSettings = db.userSettings[userId] || {};
  
  res.json(userSettings);
});

app.post('/api/settings', authenticateToken, (req: any, res: any) => {
  const userId = req.user.id;
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
  db.userSettings = db.userSettings || {};
  
  db.userSettings[userId] = {
    ...(db.userSettings[userId] || {}),
    globalSerperApiKey: globalSerperApiKey || '',
    globalScrapingdogApiKey: globalScrapingdogApiKey || '',
    globalSerpapiKey: globalSerpapiKey || '',
    globalProxyUrl: globalProxyUrl || '',
    globalProxies: globalProxies || [],
    isRandomProxy: !!isRandomProxy,
    activeProxyIdx: activeProxyIdx !== undefined ? activeProxyIdx : null,
    serperQuotaActive: true, 
    scrapingdogQuotaActive: true,
    lastUpdated: new Date().toISOString()
  };

  persistDB();
  res.json({ success: true, message: 'Settings saved to your profile' });
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
    if (updates.activePriority !== undefined) keyword.activePriority = updates.activePriority;
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

    // If keyword is paused, clear its pending extension tasks
    if (keyword.status === 'paused' && db.extensionTasks) {
      db.extensionTasks = db.extensionTasks.filter((t: any) => String(t.keywordId) !== String(id));
    }

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

  if (project.scrapingStrategy === 'extension') {
    console.log(`🧩 [Extension] Queuing ${keywordsToCheck.length} keywords for browser extension...`);

    if (!db.extensionTasks) db.extensionTasks = [];

    keywordsToCheck.forEach((kw: any) => {
      // Remove any existing pending tasks for this keyword to avoid duplicates
      db.extensionTasks = db.extensionTasks.filter((t: any) =>
        !(String(t.keywordId) === String(kw.id) && (t.status === 'pending' || t.status === 'processing'))
      );

      db.extensionTasks.push({
        id: Math.random().toString(36).substring(2, 15),
        userId: project.userId,
        projectId: project.id,
        keywordId: kw.id,
        keyword: kw.text,
        region: kw.region || project.targetRegion || 'au',
        location: kw.location || project.defaultLocation || '',
        targetDomain: project.url,
        status: 'pending',
        createdAt: Date.now(),
        retries: 0
      });

      kw.lastChecked = 'Queued (Extension)';
      kw.displayRank = '⏳ Queued';
    });

    persistDB();
    return { success: true, message: `${keywordsToCheck.length} keywords queued for extension.` };
  }

  // --- OLD API LOGIC (FALLBACK) ---
  if (project.scrapingStrategy !== 'extension') {
    if (!db.settings?.globalSerperApiKey || db.settings.globalSerperApiKey.trim() === '') {
      return { success: false, error: "API Key Required: Please add your Serper.dev API key in Settings to use API scanning." };
    }
    if (db.settings.serperQuotaActive === false) {
      return { success: false, error: "Quota Exceeded: Your Serper.dev API quota is depleted. Please add credits to your Serper.dev account." };
    }
  }
  const resolveProxy = (settings: any) => {
    const { globalProxyUrl, globalProxies, isRandomProxy, activeProxyIdx } = settings || {};
    
    const clean = (url: string) => {
      if (!url) return '';
      let c = url.trim();
      if (c.toLowerCase().startsWith('curl')) {
        const parts = c.split(' ');
        const proxyPart = parts.find(p => p.startsWith('http'));
        if (proxyPart) c = proxyPart;
      }
      return c;
    };

    const finalProxy = (() => {
      if (isRandomProxy && globalProxies && globalProxies.length > 0) {
        const idx = Math.floor(Math.random() * globalProxies.length);
        return clean(globalProxies[idx]);
      }
      if (activeProxyIdx !== null && globalProxies && globalProxies[activeProxyIdx]) {
        return clean(globalProxies[activeProxyIdx]);
      }
      return clean(globalProxyUrl) || '';
    })();

    if (finalProxy) {
      console.log(`📡 [PROXY] Engine selected: ${finalProxy.split('@').pop()}`);
    }
    return finalProxy;
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
  let quotaErrors: string[] = [];

  const BATCH_SIZE = 10;
  for (let i = 0; i < keywordsToCheck.length; i += BATCH_SIZE) {
    const batch = keywordsToCheck.slice(i, i + BATCH_SIZE);
    try {
      // GET USER SETTINGS FOR THIS SCAN
      const db = getDB();
      const userSettings = (db.userSettings && db.userSettings[project.userId]) || db.settings || {};

      const batchOptions = batch.map((k: any) => ({
        keyword: k.text,
        targetUrl: project.url,
        region: (project as any).targetRegion,
        businessName: (project as any).businessName,
        location: (() => {
          // Priority 1: User specified location (if it looks like a full address/city)
          const loc = k.location || project.defaultLocation || '';
          const pincode = k.pincode || project.pincode || '';
          const priority = k.activePriority || 'city';

          if (priority === 'pincode' && pincode) return pincode;

          if (loc) {
            // If the location string is detailed (has commas), use it EXACTLY as the user sees in UI.
            if (loc.includes(',')) return loc.trim();

            // Otherwise, if usePincode is enabled and we have a pincode, append it for precision.
            const usePincode = k.usePincode !== undefined ? k.usePincode : project.usePincode;
            if (usePincode && pincode && !loc.includes(pincode)) {
              return `${loc}, ${pincode}`.trim();
            }
            return loc.trim();
          }

          return pincode || '';
        })(),
        lat: Number(k.lat) || Number(project.defaultLat) || 0,
        lng: Number(k.lng) || Number(project.defaultLng) || 0,
        apiKey: userSettings.globalSerperApiKey || '',
        scrapingdogApiKey: userSettings.globalScrapingdogApiKey || '',
        serpapiKey: userSettings.globalSerpapiKey || '',
        skipMaps: (k as any).mapsStatus === 'paused',
        organicStatus: k.organicStatus || 'active',
        device: project.device || 'desktop',
        proxyUrl: project.proxyUrl || resolveProxy(userSettings)
      }));

      const strategy = project.scrapingStrategy || 'standard';

      // NEW: Extension Strategy Support
      if (strategy === 'extension') {
        for (const k of batch) {
          const taskId = Date.now().toString() + Math.random().toString(36).substring(7);
          db.extensionTasks.push({
            id: taskId,
            userId: project.userId,
            projectId: project.id,
            keywordId: k.id,
            keyword: k.text,
            location: batchOptions.find(opt => opt.keyword === k.text)?.location || '',
            region: project.targetRegion || 'au',
            targetDomain: project.url,
            status: 'pending',
            createdAt: Date.now()
          });
          k.displayRank = 'Queued (Extension)';
        }
        persistDB();
        continue;
      }

      // Default API Path
      const batchResults = await scrapeSerperBatch(batchOptions);

        // Check for batch-level quota error
        if (batchResults.some(r => r.error === 'QUOTA_EXCEEDED')) {
          db.settings.serperQuotaActive = false;
          quotaErrors.push('QUOTA_EXCEEDED');
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
              preferredApi: project.preferredApi || 'hybrid',
              device: project.device || 'desktop',
              proxyUrl: project.proxyUrl || resolveProxy(db.settings)
            } as any);
            res = { ...res, ...hybridRes };
          }

          // Update keyword with results
          const organicRank = Number(res?.organicRank || 0);
          const mapsRank = Number(res?.mapsRank || 0);

          k.organic = organicRank;
          k.maps = mapsRank;
          addHistory(k, organicRank, mapsRank);

          if (res?.error === 'QUOTA_EXCEEDED') {
            k.displayRank = 'Quota Exceeded';
          } else {
            k.displayRank = formatFullRank(organicRank, mapsRank);
          }

          k.source = (organicRank > 0 || mapsRank > 0) ? (res?.source || 'Serper') : '';
          k.lastChecked = today;
          results.push({ keywordId: k.id, ...res });

          excelUpdates.push({
            projectName: project.name,
            keyword: k.text,
            rank: k.displayRank,
            date: today
          });

          if (res?.errors && Array.isArray(res.errors)) {
            quotaErrors.push(...res.errors);
          }
          if (res?.error) {
            quotaErrors.push(String(res.error));
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

  // Process unique quota errors
  quotaErrors = [...new Set(quotaErrors.filter(Boolean))];
  if (quotaErrors.includes('SDOG_QUOTA_EXCEEDED')) db.settings.scrapingdogQuotaActive = false;
  if (quotaErrors.includes('SERPAPI_QUOTA_EXCEEDED')) db.settings.serpapiQuotaActive = false;
  if (quotaErrors.includes('PROXY_FAILURE')) db.settings.proxyActive = false;
  persistDB();
  
  return { success: true, count: results.length, quotaErrors };
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

// Automation Scheduler (Deactivated to prevent unwanted background browser popups)
/*
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
*/

// ============================================================
// --- EXTENSION DISTRIBUTED SCRAPING SYSTEM ---
// ============================================================
const extensionConnections = new Map<string, number>();

// Extension Auth — Login with email/password, returns userId for extension
app.post('/api/extension/auth', async (req: any, res: any) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const db = getDB();
  const user = db.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Account not found' });

  const bcrypt = require('bcryptjs');
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid password' });

  console.log(`🧩 [Extension] User authenticated: ${user.email}`);
  res.json({
    success: true,
    userId: user.id,
    name: user.name || user.email.split('@')[0],
    email: user.email
  });
});

// Extension Heartbeat — Track online status
app.post('/api/extension/ping', (req: any, res: any) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  extensionConnections.set(String(userId).trim(), Date.now());
  
  const db = getDB();
  const pending = (db.extensionTasks || []).filter((t: any) =>
    String(t.userId) === String(userId) && (t.status === 'pending' || t.status === 'processing')
  ).length;

  res.json({ success: true, pendingTasks: pending, timestamp: Date.now() });
});

// Extension Status — Check if user's extension is online
app.get('/api/extension/status', (req: any, res: any) => {
  const { userId } = req.query;
  const lastSeen = extensionConnections.get(String(userId)) || 0;
  const isOnline = (Date.now() - lastSeen) < 90000;
  res.json({ isOnline, lastSeen });
});

// Extension Tasks — Serve next pending task
app.get('/api/extension/tasks', (req: any, res: any) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const db = getDB();
    if (!db.extensionTasks) { db.extensionTasks = []; persistDB(); }

    // Find first pending task that isn't delayed by CAPTCHA cooldown
    const taskIdx = db.extensionTasks.findIndex((t: any) =>
      String(t.userId) === String(userId) &&
      t.status === 'pending' &&
      (!t.retryAfter || t.retryAfter < Date.now())
    );

    if (taskIdx === -1) return res.json({ task: null });

    const task = db.extensionTasks[taskIdx];
    task.status = 'processing';
    task.startedAt = Date.now();
    persistDB();

    console.log(`🧩 [Extension] Task → ${task.keyword} (${task.id}) → user ${userId}`);
    res.json({ task });
  } catch (err: any) {
    console.error('[Extension Tasks Error]:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Extension Submit — Receive rank results
app.post('/api/extension/submit', (req: any, res: any) => {
  const { taskId, organic, maps, foundUrl, foundPage, status } = req.body;
  const db = getDB();
  if (!db.extensionTasks) db.extensionTasks = [];

  const taskIdx = db.extensionTasks.findIndex((t: any) => String(t.id) === String(taskId));
  if (taskIdx === -1) return res.status(404).json({ error: 'Task not found' });

  const task = db.extensionTasks[taskIdx];

  // CAPTCHA: Reschedule with 3-minute delay, max 3 retries
  if (status === 'CAPTCHA') {
    task.retries = (task.retries || 0) + 1;
    if (task.retries >= 3) {
      // Too many CAPTCHAs — mark failed
      db.extensionTasks.splice(taskIdx, 1);
      const kw = db.keywords.find((k: any) => String(k.id) === String(task.keywordId));
      if (kw) { kw.displayRank = '⚠️ CAPTCHA'; kw.lastChecked = new Date().toISOString().split('T')[0]; }
      persistDB();
      console.log(`❌ [Extension] Task ${task.keyword} failed after 3 CAPTCHAs`);
      return res.json({ success: true, message: 'Task dropped after max retries' });
    }
    task.status = 'pending';
    task.retryAfter = Date.now() + (3 * 60 * 1000);
    persistDB();
    console.log(`⏸️ [Extension] CAPTCHA on "${task.keyword}" — retry ${task.retries}/3 in 3 min`);
    return res.json({ success: true, message: 'Rescheduled (CAPTCHA cooldown)' });
  }

  // SUCCESS: Update keyword with real rank data
  const keyword = db.keywords.find((k: any) => String(k.id) === String(task.keywordId));
  if (keyword) {
    const todayStr = new Date().toISOString().split('T')[0];
    const organicRank = Number(organic) || 0;
    const mapsRank = Number(maps) || 0;

    keyword.organic = organicRank;
    keyword.maps = mapsRank;
    keyword.foundUrl = foundUrl || '';
    keyword.lastChecked = todayStr;
    keyword.source = foundPage ? `Extension (P${foundPage})` : 'Extension';
    keyword.displayRank = formatFullRank(organicRank, mapsRank);

    // History tracking
    if (!keyword.history) keyword.history = [];
    const existing = keyword.history.findIndex((h: any) => h.date === todayStr);
    const snap = { date: todayStr, organic: organicRank, maps: mapsRank };
    if (existing !== -1) keyword.history[existing] = snap;
    else keyword.history.push(snap);
    if (keyword.history.length > 30) keyword.history = keyword.history.slice(-30);

    console.log(`✅ [Extension] ${task.keyword} → Organic: #${organicRank} | Maps: #${mapsRank} (Page ${foundPage || '?'})`);
  }

  // Remove completed task
  db.extensionTasks.splice(taskIdx, 1);
  persistDB();
  res.json({ success: true });
});

// Extension Stats — For popup dashboard
app.get('/api/extension/stats', (req: any, res: any) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  const db = getDB();
  const tasks = db.extensionTasks || [];
  const userTasks = tasks.filter((t: any) => String(t.userId) === String(userId));

  const pending = userTasks.filter((t: any) => t.status === 'pending').length;
  const processing = userTasks.filter((t: any) => t.status === 'processing').length;
  const delayed = userTasks.filter((t: any) => t.retryAfter && t.retryAfter > Date.now()).length;

  // Count today's completed checks from keywords
  const todayStr = new Date().toISOString().split('T')[0];
  const userProjects = (db.projects || []).filter((p: any) => String(p.userId) === String(userId));
  const projectIds = userProjects.map((p: any) => String(p.id));
  const todayChecks = (db.keywords || []).filter((k: any) =>
    projectIds.includes(String(k.projectId)) &&
    k.lastChecked === todayStr &&
    k.source?.includes('Extension')
  ).length;

  res.json({
    pending,
    processing,
    delayed,
    completedToday: todayChecks,
    queueTotal: pending + processing
  });
});

// Extension Project Tasks — Returns per-keyword task status for dashboard
app.get('/api/extension/project-tasks', (req: any, res: any) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).json({ error: 'Missing projectId' });

  const db = getDB();
  const tasks = (db.extensionTasks || []).filter((t: any) => String(t.projectId) === String(projectId));

  // Build a map: keywordId -> status
  const statusMap: Record<string, { status: string; keyword: string; retryAfter?: number }> = {};
  
  for (const task of tasks) {
    const kid = String(task.keywordId);
    const isDelayed = task.retryAfter && task.retryAfter > Date.now();
    
    statusMap[kid] = {
      status: isDelayed ? 'captcha_wait' : task.status || 'pending',
      keyword: task.keyword || ''
    };
    
    if (isDelayed) {
      statusMap[kid].retryAfter = task.retryAfter;
    }
  }

  const totalPending = tasks.filter((t: any) => t.status === 'pending').length;
  const totalProcessing = tasks.filter((t: any) => t.status === 'processing').length;
  const totalDelayed = tasks.filter((t: any) => t.retryAfter && t.retryAfter > Date.now()).length;

  res.json({
    statusMap,
    summary: {
      pending: totalPending,
      processing: totalProcessing,
      delayed: totalDelayed,
      total: tasks.length
    }
  });
});

// Cleanup stale processing tasks (stuck > 2 min)
setInterval(() => {
  const db = getDB();
  if (!db.extensionTasks) return;
  let changed = false;
  db.extensionTasks.forEach((t: any) => {
    if (t.status === 'processing' && t.startedAt && (Date.now() - t.startedAt) > 120000) {
      t.status = 'pending';
      delete t.startedAt;
      changed = true;
      console.log(`🔄 [Extension] Recovered stale task: ${t.keyword}`);
    }
  });
  if (changed) persistDB();
}, 30000);



// --- SESSION EVENTS (REAL-TIME TRACKING) ---
app.post('/api/session-events', async (req: any, res: any) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) return res.status(400).json({ success: false, message: 'Missing body' });
    const { clickId, events } = req.body;
    const sqlite3 = (await import('sqlite3')).default;
    const db = new sqlite3.Database(SQLITE_DB_PATH);
    const stmt = db.prepare(`INSERT INTO SessionEvent (id, clickId, type, x, y, scrollP, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    events.forEach(event => {
      const id = `ev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      stmt.run([id, clickId, event.type, event.x || null, event.y || null, event.scrollP || null, new Date(event.ts || Date.now()).toISOString()]);
    });
    stmt.finalize();
    db.close();
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/api/session-events/:clickId', async (req: any, res: any) => {
  try {
    const { clickId } = req.params;
    const sqlite3 = (await import('sqlite3')).default;
    const db = new sqlite3.Database(SQLITE_DB_PATH);
    db.all(`SELECT * FROM SessionEvent WHERE clickId = ? ORDER BY timestamp ASC`, [clickId], (err, rows) => {
      db.close();
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, data: rows });
    });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// --- AD CLICK TRACKING SYSTEM ---
app.post('/api/track-click', async (req: any, res: any) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      console.warn('>>> [API WARN] Empty body received. Headers:', req.headers);
      return res.status(400).json({ success: false, message: 'Request body is missing or empty' });
    }
    const { 
      websiteUrl, source, campaignId, campaignName, gclid, formInteracted, 
      timeOnSite, sessionData, pageLoadTime, pagesVisited, 
      exitPage, actions, adId, adGroup, adContent, keyword
    } = req.body;
    
    if (!websiteUrl) {
      return res.status(400).json({ success: false, message: 'Website URL is required' });
    }

    const sqlite3 = (await import('sqlite3')).default;
    const db = new sqlite3.Database(SQLITE_DB_PATH);

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    
    // Basic User Agent Parsing
    let deviceType = 'Desktop';
    if (/Mobi|Android/i.test(userAgent)) deviceType = 'Mobile';
    if (/Tablet|iPad/i.test(userAgent)) deviceType = 'Tablet';
    
    let browser = 'Unknown';
    if (/Chrome/.test(userAgent)) browser = 'Chrome';
    else if (/Firefox/.test(userAgent)) browser = 'Firefox';
    else if (/Safari/.test(userAgent)) browser = 'Safari';
    else if (/Edge/.test(userAgent)) browser = 'Edge';

    let os = 'Unknown';
    if (/Windows NT 10.0/.test(userAgent)) os = 'Windows 10/11';
    else if (/Windows NT 6.3/.test(userAgent)) os = 'Windows 8.1';
    else if (/Windows NT 6.2/.test(userAgent)) os = 'Windows 8';
    else if (/Windows NT 6.1/.test(userAgent)) os = 'Windows 7';
    else if (/Mac OS X 10[._]\d+/.test(userAgent)) os = 'macOS';
    else if (/iPhone|iPad/.test(userAgent)) os = 'iOS';
    else if (/Android/.test(userAgent)) os = 'Android';
    else if (/Linux/.test(userAgent)) os = 'Linux';

    let isSuspicious = false;
    let suspicionReason: string | null = null;
    
    if (!userAgent) {
      isSuspicious = true;
      suspicionReason = 'Missing User Agent';
    }

    let cleanIp = req.body.clientIp || (typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : String(ipAddress));
    
    // For local dev, if IP is local, we'll try to fetch the real public IP of this machine 
    // so that geolocation actually works and shows accurate city/country.
    if (cleanIp === '::1' || cleanIp === '127.0.0.1' || cleanIp === '::ffff:127.0.0.1') {
      try {
        const publicIpRes = await axios.get('https://api.ipify.org?format=json', { timeout: 2000 });
        if (publicIpRes.data?.ip) cleanIp = publicIpRes.data.ip;
      } catch (e) {
        console.warn('Failed to fetch public IP for local dev fallback');
      }
    }

    // --- HEURISTIC VPN / PROXY DETECTION ---
    let isp = null, city = null, country = null, lat = null, lon = null;
    try {
      const geoRes = await axios.get(`https://ipwho.is/${cleanIp}`, { timeout: 3000 });
      if (geoRes.data && geoRes.data.success) {
        isp = geoRes.data.connection?.isp;
        city = geoRes.data.city;
        country = geoRes.data.country;
        lat = geoRes.data.latitude;
        lon = geoRes.data.longitude;

        // VPN/Data Center Keywords
        const dcKeywords = ['DigitalOcean', 'Amazon', 'AWS', 'Google Cloud', 'Microsoft Azure', 'Hetzner', 'OVH', 'Linode', 'Choopa', 'Vultr', 'Hosting', 'Data Center', 'VPN', 'Proxy'];
        if (isp && dcKeywords.some(kw => isp.toLowerCase().includes(kw.toLowerCase()))) {
          isSuspicious = true;
          suspicionReason = `VPN/Proxy Detected (Data Center: ${isp})`;
        }
      }
    } catch (e: any) {
      console.warn('Geo IP lookup failed:', e.message);
    }

    // Update Ping Logic
    if (req.body.isFinal || req.body.isUpdate) {
      const recentClick = await new Promise<any>((resolve) => {
        db.get(`SELECT * FROM AdClick WHERE ipAddress = ? AND websiteUrl = ? AND clickedAt >= datetime('now', '-1 hour') ORDER BY clickedAt DESC LIMIT 1`, [cleanIp, websiteUrl], (err, row) => {
          resolve(row);
        });
      });

      if (recentClick) {
        let mergedActions = [];
        try {
          const oldActions = recentClick.actions ? JSON.parse(recentClick.actions) : [];
          mergedActions = [...new Set([...oldActions, ...(actions || [])])];
        } catch (e) {}

        await new Promise((resolve) => {
          db.run(`UPDATE AdClick SET timeOnSite = ?, formInteracted = ?, pagesVisited = ?, exitPage = ?, actions = ? WHERE id = ?`, 
          [
            timeOnSite ? parseInt(timeOnSite, 10) : recentClick.timeOnSite,
            formInteracted ? 1 : (recentClick.formInteracted ? 1 : 0),
            pagesVisited ? JSON.stringify(pagesVisited) : recentClick.pagesVisited,
            exitPage || recentClick.exitPage,
            mergedActions.length > 0 ? JSON.stringify(mergedActions) : recentClick.actions,
            recentClick.id
          ], () => resolve(true));
        });
        db.close();
        return res.json({ success: true, message: 'Click updated successfully', id: recentClick.id });
      }
    }

    // New Click Logging
    const clicksToday = await new Promise<number>((resolve) => {
      db.get(`SELECT COUNT(*) as count FROM AdClick WHERE ipAddress = ? AND clickedAt >= date('now')`, [cleanIp], (err, row: any) => {
        resolve(row?.count || 0);
      });
    });

    if (clicksToday >= 3 && !isSuspicious) {
      isSuspicious = true;
      suspicionReason = 'High Frequency IP (Multiple clicks today)';
    }

    const previousVisit: any = await new Promise((resolve) => {
      db.get(`SELECT * FROM AdClick WHERE ipAddress = ? ORDER BY clickedAt DESC LIMIT 1`, [cleanIp], (err, row) => resolve(row));
    });

    const isReturning = !!previousVisit;
    const visitCount = previousVisit ? (previousVisit.visitCount + 1) : 1;
    const id = `click-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const fingerprint = req.body.fingerprint || null;

    await new Promise((resolve, reject) => {
      db.run(`INSERT INTO AdClick (id, websiteUrl, ipAddress, userAgent, deviceType, browser, os, source, campaignId, campaignName, gclid, isSuspicious, suspicionReason, formInteracted, timeOnSite, sessionData, pageLoadTime, isp, city, country, lat, lon, pagesVisited, exitPage, actions, adId, adGroup, adContent, keyword, isReturning, visitCount, clickedAt, fingerprint) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                id, websiteUrl, cleanIp, userAgent, deviceType, browser, os, source || 'direct', campaignId, campaignName, gclid, isSuspicious ? 1 : 0, suspicionReason, formInteracted ? 1 : 0, timeOnSite ? parseInt(timeOnSite, 10) : null, sessionData ? JSON.stringify(sessionData) : null, pageLoadTime ? parseInt(pageLoadTime, 10) : null, isp, city, country, lat, lon, pagesVisited ? JSON.stringify(pagesVisited) : null, exitPage || null, actions && actions.length > 0 ? JSON.stringify(actions) : null, adId, adGroup, adContent, keyword, isReturning ? 1 : 0, visitCount, new Date().toISOString(), fingerprint
              ], (err) => {
                if (err) {
                  console.error('>>> [SQL ERROR] AdClick INSERT failed:', err);
                  reject(err);
                }
                else resolve(true);
              });
    });

    db.close();
    res.json({ success: true, message: 'Click tracked successfully', id });
  } catch (err: any) {
    console.error('Track Click Error:', err);
    res.status(500).json({ success: false, message: 'Failed to track click', error: err.message });
  }
});

// Final fallback for 404s (must be last)
app.use((req: any, res: any) => {
  console.log(`❌ [404] Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route not found', method: req.method, url: req.url });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
