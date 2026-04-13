const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'local_db.json');
if (!fs.existsSync(DB_PATH)) {
  console.error('Database file not found!');
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

// 1. Force Global Settings initialization
db.settings = {
  globalSerperApiKey: db.settings?.globalSerperApiKey || '',
  globalScrapingdogApiKey: db.settings?.globalScrapingdogApiKey || '',
  globalSerpapiKey: db.settings?.globalSerpapiKey || '',
  scrapingMode: db.settings?.scrapingMode || 'hybrid'
};

// 2. Force Keywords initialization
db.keywords = (db.keywords || []).map(k => ({
  ...k,
  organicStatus: k.organicStatus || 'active',
  mapsStatus: k.mapsStatus || 'active',
  status: k.status || 'active'
}));

// 3. Force Projects initialization
db.projects = (db.projects || []).map(p => ({
  ...p,
  scrapingStrategy: p.scrapingStrategy || 'inherit',
  scheduleDay: p.scheduleDay || 'Friday'
}));

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
console.log('✅ FORCE MIGRATION COMPLETE! Disk is now clean.');
