import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { formatFullRank, formatOrganicRank } from './utils/rankUtils.js';
import { scrapeGoogleRank, scrapeSerperBatch, hybridScrape, wait } from './services/scraperService.js';
import { updateExcelMatrix } from './services/excelService.js';

const app = express();
const PORT = 5000;
const DB_FILE = path.join(process.cwd(), 'local_db.json');

app.use(cors());
app.use(express.json());

// Global Request Logger
app.use((req, res, next) => {
  console.log(`\n🚨 [REQ] ${new Date().toLocaleTimeString()} -> ${req.method} ${req.url}`);
  next();
});

app.get('/api/ping', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Helper to Load/Save Local JSON DB
const loadDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = { 
      projects: [], 
      keywords: [],
      settings: { 
        globalSerperApiKey: '',
        globalScrapingdogApiKey: '',
        globalSerpapiKey: '',
        scrapingMode: 'hybrid'
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  
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
    scrapingMode: 'hybrid',
    ...db.settings
  };

  // Migration: Ensure all projects have strategy fields
  db.projects = (db.projects || []).map((p: any) => ({
    ...p,
    scrapingStrategy: p.scrapingStrategy || 'inherit',
    scheduleDay: p.scheduleDay || 'Friday'
  }));

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

app.get('/api/projects', (req, res) => {
  const db = getDB();
  res.json(db.projects);
});

app.post('/api/projects', (req, res) => {
  const { name, url, targetRegion, businessName, schedule } = req.body;
  const db = getDB();
  const newProject = {
    id: Date.now().toString(),
    name,
    url,
    targetRegion,
    businessName,
    serperApiKey: req.body.serperApiKey || '',
    status: 'active',
    schedule: schedule || 'instant',
    lastCheck: 0
  };
  db.projects.push(newProject);
  persistDB();
  res.json(newProject);
});

app.get('/api/projects/:id/keywords', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const keywords = (db?.keywords || []).filter((k: any) => String(k.projectId) === String(id));
  
  const formatted = (keywords || []).map((k: any) => ({
    ...k,
    displayRank: formatFullRank(k?.organic || 0, k?.maps || 0)
  }));
  
  res.json(formatted);
});

app.post('/api/projects/:id/keywords', (req, res) => {
  const { id } = req.params;
  const { keywords } = req.body;
  const db = getDB();
  
  const project = db.projects.find((p: any) => String(p.id) === String(id));
  if (!project) {
    console.error(`[KeywordAdd] Project not found: ${id}`);
    return res.status(404).json({ error: 'Project not found' });
  }

  if (!keywords || !Array.isArray(keywords)) {
    return res.status(400).json({ error: 'Keywords missing or not an array' });
  }
  
  console.log(`[KeywordAdd] Adding keywords for project ${id}:`, keywords);
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
      lng
    };
  });
  
  console.log(`[KeywordAdd] Mapped to ${newKeywords.length} items. First:`, newKeywords[0]);
  db.keywords.push(...newKeywords);
  persistDB();
  res.json({ success: true, count: newKeywords.length });
});

app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  db.projects = db.projects.filter((p: any) => String(p.id) !== String(id));
  db.keywords = db.keywords.filter((k: any) => String(k.projectId) !== String(id));
  persistDB();
  res.json({ success: true });
});

app.put('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const db = getDB();
  const index = db.projects.findIndex((p: any) => String(p.id) === String(id));
  
  if (index !== -1) {
    db.projects[index] = { ...db.projects[index], ...updates };
    persistDB();
    res.json(db.projects[index]);
  } else {
    res.status(404).json({ error: 'Project not found' });
  }
});

app.delete('/api/keywords/:id', (req, res) => {
  const { id } = req.params;
  const db = getDB();
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

app.get('/api/download-excel', (req, res) => {
  const EXCEL_FILE = path.join(process.cwd(), 'rankings.xlsx');
  if (fs.existsSync(EXCEL_FILE)) {
    res.download(EXCEL_FILE);
  } else {
    res.status(404).json({ error: 'Excel file not found. Run a check first!' });
  }
});

// Settings Management
app.get('/api/settings', (req, res) => {
  const db = getDB();
  res.json(db.settings || { globalSerperApiKey: '' });
});

app.post('/api/settings', (req, res) => {
  const { globalSerperApiKey, globalScrapingdogApiKey, globalSerpapiKey, scrapingMode } = req.body;
  const db = getDB();
  db.settings = { 
    ...db.settings, 
    globalSerperApiKey: globalSerperApiKey || '',
    globalScrapingdogApiKey: globalScrapingdogApiKey || '',
    globalSerpapiKey: globalSerpapiKey || '',
    scrapingMode: scrapingMode || 'hybrid'
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

app.post('/api/keywords/sync', (req, res) => {
  const { projectId, keywords } = req.body;
  if (!projectId || !Array.isArray(keywords)) {
    return res.status(400).json({ error: 'Missing projectId or keywords array' });
  }
  
  const db = getDB();
  db.keywords = db.keywords.filter((k: any) => String(k.projectId) !== String(projectId));
  
  const toSave = keywords.map((k: any) => ({
    ...k,
    projectId: String(projectId),
    id: k.id || Math.random().toString(36).substring(7)
  }));
  
  db.keywords.push(...toSave);
  persistDB();
  console.log(`[Sync] Synced ${toSave.length} keywords for project ${projectId}`);
  res.json({ success: true, count: toSave.length });
});

app.put('/api/keywords/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const db = getDB();
  const keyword = db.keywords.find((k: any) => String(k.id) === String(id));
  
  if (keyword) {
    if (updates.text) keyword.text = updates.text;
    if (updates.location !== undefined) keyword.location = updates.location;
    if (updates.lat !== undefined) keyword.lat = updates.lat;
    if (updates.lng !== undefined) keyword.lng = updates.lng;
    if (updates.status) keyword.status = updates.status;
    persistDB();
    res.json(keyword);
  } else {
    res.status(404).json({ error: 'Keyword not found' });
  }
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

app.post('/api/check-project/:id', async (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const project = db.projects.find((p: any) => String(p.id) === String(id));
  if (!project) return res.status(404).json({ error: "Project not found" });

  const projectKeywords = db.keywords.filter((k: any) => String(k.projectId) === String(id) && k.status === 'active');
  console.log(`\n🚨 [DASHBOARD TRIGGER] Rank check started for Project: "${project.name}" (ID: ${id})`);
  console.log(`🟢 Active Keywords to scan: ${projectKeywords.length}`);
  
  const results: any[] = [];
  const excelUpdates: any[] = [];
  const today: string = new Date().toISOString().split('T')[0] || '';

  // Batch processing (10 keywords at a time)
  const BATCH_SIZE = 10;
  for (let i = 0; i < projectKeywords.length; i += BATCH_SIZE) {
    const batch = projectKeywords.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} (${batch.length} keywords)...`);
    
    try {
      const batchOptions = batch.map((k: any) => ({
        keyword: k.text,
        targetUrl: project.url,
        region: (project as any).targetRegion,
        businessName: (project as any).businessName,
        location: (k as any).location,
        lat: (k as any).lat,
        lng: (k as any).lng,
        apiKey: (project as any).serperApiKey || db.settings?.globalSerperApiKey || '',
        skipMaps: (k as any).mapsStatus === 'paused'
      }));

      // STRATEGY CHECK: If global mode is 'browser_only', we skip API batch and go direct
      const scrapingdogKey = db.settings?.globalScrapingdogApiKey || '';
      const serpapiKey = db.settings?.globalSerpapiKey || '';
      const strategy = (project as any).scrapingStrategy === 'inherit' 
        ? (db.settings?.scrapingMode || 'hybrid') 
        : ((project as any).scrapingStrategy || 'hybrid');

      if (strategy === 'browser_only') {
        console.log(`🚀 [DIRECT BROWSER] Skipping API batch for ${batch.length} keywords as "Real Browser Only" is active.`);
        for (const k of batch) {
          const res = await hybridScrape({
            keyword: k.text,
            targetUrl: project.url,
            region: (project as any).targetRegion,
            businessName: (project as any).businessName,
            location: (k as any).location,
            lat: (k as any).lat,
            lng: (k as any).lng,
            skipMaps: (k as any).mapsStatus === 'paused',
            skipOrganic: (k as any).organicStatus === 'paused',
            strategy: 'browser_only'
          } as any);
          
          results.push({ keywordId: k.id, ...res });
        }
      } else {
        // HYBRID FLOW: API wave first
        const batchResults = await scrapeSerperBatch(batchOptions);

        for (let idx = 0; idx < batchResults.length; idx++) {
          let res = batchResults[idx];
          const k = batch[idx];
          if (!k || !res) continue;

          // If Serper failed to find it, trigger Hybrid (Tiered) Fallback (with Coordinates)
          if (res.organicRank === 0) {
            console.log(`[Hybrid Fallback] Serper missed "${k.text}". Using browser with GPS...`);
            const hybridRes = await hybridScrape({
              keyword: k.text,
              targetUrl: project.url,
              region: (project as any).targetRegion,
              businessName: (project as any).businessName,
              location: (k as any).location,
              lat: (k as any).lat,
              lng: (k as any).lng,
              apiKey: (project as any).serperApiKey || db.settings?.globalSerperApiKey || '',
              scrapingdogApiKey: scrapingdogKey,
              serpapiKey: serpapiKey,
              skipMaps: (k as any).mapsStatus === 'paused',
              skipOrganic: (k as any).organicStatus === 'paused',
              strategy: strategy
            } as any);
            res = { ...res, ...hybridRes };
          }
          results.push({ keywordId: k.id, ...res });

          // Update DB with results
          const display = formatFullRank(res.organicRank, res.mapsRank);
          k.organic = res.organicRank;
          k.maps = res.mapsRank;
          k.displayRank = display;
          k.lastChecked = today;

          console.log(`[Result] Keyword: ${k.text} -> Rank: ${display}`);

          excelUpdates.push({
            projectName: project.name,
            websiteUrl: project.url,
            keyword: k.text,
            foundUrl: res.foundUrl || project.url,
            rank: display,
            date: today
          });
        }
      }

      // Save Atomic state for this batch
      persistDB();
      project.lastCheck = Date.now();
      persistDB();

      // Removed breathing delay for maximum speed
    } catch (err) {
      console.error(`Error processing batch starting at index ${i}:`, err);
    }
  }
  
  persistDB();

  if (excelUpdates.length > 0) {
    await updateExcelMatrix(excelUpdates);
  }
    });

    persistDB();
    project.lastCheck = Date.now();
    persistDB();

    if (excelUpdates.length > 0) {
      await updateExcelMatrix(excelUpdates);
    }

    res.json({ success: true, count: batchResults.length });
  } catch (err: any) {
    console.error(`[ProjectBatchError] Full project check failed:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/check-keyword-batch', async (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const k = db.keywords.find((kw: any) => String(kw.id) === String(id));
  if (!k) return res.status(404).json({ error: "Keyword not found" });
  
  const project = db.projects.find((p: any) => String(p.id) === String(k.projectId));
  if (!project) return res.status(404).json({ error: "Project not found" });

  const today: string = new Date().toISOString().split('T')[0] || '';
  const scrapingdogKey = db.settings?.globalScrapingdogApiKey || '';
  const serpapiKey = db.settings?.globalSerpapiKey || '';
  const strategy = (project as any).scrapingStrategy === 'inherit' 
    ? (db.settings?.scrapingMode || 'hybrid') 
    : ((project as any).scrapingStrategy || 'hybrid');

  try {
    console.log(`[SingleCheck] Processing "${k.text}"...`);
    
    // Check rank
    const result = await hybridScrape({
      keyword: k.text,
      targetUrl: project.url,
      region: (project as any).targetRegion,
      businessName: (project as any).businessName,
      location: (k as any).location,
      lat: (k as any).lat,
      lng: (k as any).lng,
      apiKey: (project as any).serperApiKey || db.settings?.globalSerperApiKey || '',
      scrapingdogApiKey: scrapingdogKey,
      serpapiKey: serpapiKey,
      skipMaps: (k as any).mapsStatus === 'paused',
      skipOrganic: (k as any).organicStatus === 'paused',
      strategy: strategy
    } as any);

    // Update DB
    const display = formatFullRank(result.organicRank, result.mapsRank);
    k.organic = result.organicRank;
    k.maps = result.mapsRank;
    k.displayRank = display;
    k.lastChecked = today;
    k.source = result.source || 'Unknown';

    persistDB();
    project.lastCheck = Date.now();
    persistDB();

    // Excel update
    await updateExcelMatrix([{
      projectName: project.name,
      websiteUrl: project.url,
      keyword: k.text,
      foundUrl: result.foundUrl || project.url,
      rank: display,
      date: today
    }]);

    res.json({ success: true, result: { id: k.id, organic: k.organic, maps: k.maps, displayRank: display } });
  } catch (err: any) {
    console.error(`Single Check Error for ${k.text}:`, err);
    res.status(500).json({ error: err.message });
  }
});

// Automation Scheduler (Checks every minute)
setInterval(async () => {
  const db = getDB();
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const ONE_WEEK = 7 * ONE_DAY;

  for (const p of db.projects) {
    if (p.status !== 'active' || p.schedule === 'instant') continue;

    const last = p.lastCheck || 0;
    const dueDaily = p.schedule === 'daily' && (now - last) >= ONE_DAY;
    
    // WEEKLY CHECK: On Specific Day
    const todayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);
    const targetDay = p.scheduleDay || 'Friday';
    const isTargetDay = todayName.toLowerCase() === targetDay.toLowerCase();
    const dueWeekly = p.schedule === 'weekly' && isTargetDay && (now - last) >= ONE_DAY;

    if (dueDaily || dueWeekly) {
      console.log(`[Scheduler] Auto-triggering scan for ${p.name}...`);
      // Trigger scan logic (Simplified call or internal function refactor)
      // Since we already have the endpoint, we could refactor the loop, 
      // but for now, we'll just log and mock the update or call a shared function.
      // Refactoring check logic to a shared function is better.
      p.lastCheck = now;
      persistDB();
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
