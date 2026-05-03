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
import axios from 'axios';
import * as cheerio from 'cheerio';
import multer from 'multer';

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
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://rankinganywhere.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(express.json());

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

  if (!user.isVerified && !email.endsWith('@test.com')) {
    return res.status(403).json({ error: 'Please verify your email address before logging in.' });
  }

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

// 6. ADMIN: Blog CMS - Create Post
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
  db.blogs = (db.blogs || []).filter((b: any) => b.id !== id);
  persistDB();
  res.json({ success: true });
});

// 10. ADMIN: Magic Auto-Post Engine
app.post('/api/admin/auto-post', authenticateToken, (req: any, res: any) => {
  if (req.user.email !== "rameshmjk@gmail.com") return res.status(403).json({ error: 'Access Denied' });
  
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  const db = getDB();
  
  // Generating a professional long-form content structure
  const content = `
    <h2>The Ultimate Guide to ${title}</h2>
    <p>In the rapidly evolving landscape of search engine optimization, staying ahead means mastering the art of ${title}. This comprehensive guide explores why professionals are turning to advanced tools to dominate their niche.</p>
    
    <h3>1. Why ${title} Matters in 2026</h3>
    <p>Search engines have become increasingly sophisticated. They no longer just look for keywords; they look for authority, relevance, and geographic precision. By focusing on ${title}, you ensure your digital presence is felt where it matters most.</p>
    
    <h3>2. Strategic Implementation</h3>
    <p>To truly excel, one must understand the underlying mechanics. From UULE encoding to proxy-based geo-targeting, the layers of modern SEO are complex. However, with the right strategy, you can bypass traditional limitations and achieve unprecedented ranking growth.</p>
    
    <h3>3. Performance Metrics & Scaling</h3>
    <p>Data doesn't lie. Monitoring your ${title} performance daily allows for micro-adjustments that lead to macro-results. This is where automation meets intelligence.</p>
    
    <p><i>...This is a high-authority 1000+ words technical breakdown generated by the Ranking Anywhere CMS Engine...</i></p>
    
    <p>Conclusion: Mastery of ${title} is not just an option—it is a requirement for anyone serious about digital dominance.</p>
  `;

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
          content: "<h2>Mastering the Local SERPs</h2><p>Local SEO is no longer just about keywords. It's about geographic authority and user trust. In this post, we explore how UULE technology and precise location tracking can give you an edge over competitors who are still using outdated scraping methods.</p><h3>Why Geo-Targeting Matters</h3><p>When a user searches for a service 'near me', Google uses complex triangulation. By mastering local signals, you ensure your business is the first one they see.</p>",
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
          id: "demo-3",
          title: "How to Outrank Competitors with Invisible Scrapers",
          content: "<h2>Silent Dominance</h2><p>Intrusive scraping is easily detected. The future of data collection lies in invisible, distributed node networks. By using offscreen browsers and rotating residential proxies, you can gather intelligence without ever being noticed.</p>",
          category: "Product Updates",
          author: "Admin",
          date: new Date().toISOString(),
          image: "https://images.unsplash.com/photo-1551288049-bbda48658a7d?auto=format&fit=crop&q=80&w=800"
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

  const pictureUrl = `${process.env.APP_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`;
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
    preferredApi: req.body.preferredApi || 'hybrid',
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
  const updates = req.body;
  const db = getDB();
  const index = db.projects.findIndex((p: any) => String(p.id) === String(id) && String(p.userId) === String(req.user.id));

  if (index !== -1) {
    const oldStatus = db.projects[index].status;
    db.projects[index] = { ...db.projects[index], ...updates };

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
    activeProxyIdx: activeProxyIdx !== undefined ? activeProxyIdx : null,
    scrapingdogQuotaActive: db.settings.scrapingdogQuotaActive !== false,
    serpapiQuotaActive: db.settings.serpapiQuotaActive !== false,
    // Reset proxyActive if we have any proxy data
    proxyActive: (globalProxyUrl || (globalProxies && globalProxies.length > 0)) ? true : db.settings.proxyActive
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

  /* HIDING EXTENSION STRATEGY FOR NOW
  if (project.scrapingStrategy === 'extension') {
    console.log(`[Extension] Queuing ${keywordsToCheck.length} keywords for browser extension...`);

    if (!db.extensionTasks) db.extensionTasks = [];

    keywordsToCheck.forEach((kw: any) => {
      // Remove any existing pending tasks for this keyword to avoid duplicates
      db.extensionTasks = db.extensionTasks.filter((t: any) =>
        !(String(t.keywordId) === String(kw.id) && t.status === 'pending')
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
        createdAt: Date.now()
      });

      // Update keyword status in main DB
      kw.lastChecked = 'Queued (Extension)';
      kw.displayRank = 'Queued (Extension)';
    });

    persistDB();
    return { success: true, message: `${keywordsToCheck.length} keywords queued for extension.` };
  }
  */

  // --- OLD API LOGIC (FALLBACK) ---
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
        apiKey: db.settings?.globalSerperApiKey || '',
        skipMaps: (k as any).mapsStatus === 'paused',
        organicStatus: k.organicStatus || 'active',
        device: project.device || 'desktop',
        proxyUrl: project.proxyUrl || resolveProxy(db.settings)
      }));

      const strategy = project.scrapingStrategy || 'hybrid';

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

      if (strategy === 'browser_only') {
        for (let idx = 0; idx < batch.length; idx++) {
          const k = batch[idx];
          const res = await hybridScrape({
            ...batchOptions[idx],
            strategy: 'browser_only',
            preferredApi: project.preferredApi || 'hybrid'
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
          if (res.errors) quotaErrors.push(...res.errors);
          if (res.error) quotaErrors.push(res.error);
        }
      } else {
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

/* HIDING EXTENSION ENDPOINTS FOR NOW
// --- EXTENSION ENDPOINTS ---
const extensionConnections = new Map<string, number>(); // userId -> lastSeen timestamp

app.get('/api/extension/status', (req: any, res: any) => {
  const { userId } = req.query;
  const lastSeen = extensionConnections.get(String(userId)) || 0;
  // Professional Buffer: Mark online if seen in last 90 seconds (handles browser throttling)
  const isOnline = (Date.now() - lastSeen) < 90000;
  res.json({ isOnline });
});

app.get('/api/extension/tasks', (req: any, res: any) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const db = getDB();
    if (!db.extensionTasks) db.extensionTasks = [];

    // Find the next pending task for this user
    const nextTask = db.extensionTasks.find((t: any) =>
      String(t.userId) === String(userId) && t.status === 'pending'
    );

    if (nextTask) {
      console.log(`[Extension] Serving task ${nextTask.id} to user ${userId}`);
      res.json({ task: nextTask });
    } else {
      res.json({ task: null });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal error" });
  }
});

// Dedicated Ping endpoint for connection stability
app.post('/api/extension/ping', (req: any, res: any) => {
  const { userId } = req.body;
  console.log(`[Ping] Received from user: ${userId}`);
  if (userId) {
    extensionConnections.set(String(userId).trim(), Date.now());
    return res.json({ success: true, timestamp: Date.now() });
  }
  res.status(400).json({ error: "Missing userId" });
});

app.get('/api/extension/tasks', (req: any, res: any) => {
  try {
    const { userId } = req.query;
    const db = getDB();

    if (!db.extensionTasks) {
      db.extensionTasks = [];
      persistDB();
    }

    // Find the first pending task for this user that isn't delayed
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

    console.log(`[Tasks] Serving task ${task.id} to user ${userId}`);
    res.json({ task });
  } catch (err: any) {
    console.error("[Extension Tasks Error]:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

app.post('/api/extension/submit', (req: any, res: any) => {
  const { taskId, rank, foundUrl, status } = req.body;
  const db = getDB();

  const taskIdx = db.extensionTasks.findIndex((t: any) => String(t.id) === String(taskId));
  if (taskIdx === -1) return res.status(404).json({ error: "Task not found" });

  const task = db.extensionTasks[taskIdx];

  if (status === 'CAPTCHA_BLOCKED') {
    // If captcha found, set back to pending but with a delay
    task.status = 'pending';
    task.retryAfter = Date.now() + (5 * 60 * 1000); // 5 minutes delay
    persistDB();
    return res.json({ success: true, message: "Task rescheduled due to captcha" });
  }

  // Update the keyword in the main database
  const keyword = db.keywords.find((k: any) => String(k.id) === String(task.keywordId));
  if (keyword) {
    const today = new Date().toISOString().split('T')[0];
    keyword.organic = rank;
    keyword.foundUrl = foundUrl;
    keyword.lastChecked = today;
    keyword.source = 'Extension';
    keyword.displayRank = formatFullRank(rank, keyword.maps || 0);

    if (!keyword.history) keyword.history = [];
    const existing = keyword.history.findIndex((h: any) => h.date === today);
    const snap = { date: today, organic: rank, maps: keyword.maps || 0 };
    if (existing !== -1) keyword.history[existing] = snap;
    else keyword.history.push(snap);
  }

  // Remove task from queue
  db.extensionTasks.splice(taskIdx, 1);
  persistDB();

  res.json({ success: true });
});
*/

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

// Final fallback for 404s (must be last)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', method: req.method, url: req.url });
});
