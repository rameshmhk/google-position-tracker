const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'local_db.json');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

// 1. Update Global Settings
db.settings = {
  ...db.settings,
  globalScrapingdogApiKey: "",
  globalSerpapiKey: "",
  scrapingMode: "hybrid" // default
};

// 2. Update Projects
db.projects = db.projects.map(p => ({
  ...p,
  scheduleDay: "Friday", // default
  scrapingStrategy: "inherit" // default
}));

// 3. Update Keywords
db.keywords = db.keywords.map(k => ({
  ...k,
  organicStatus: "active" // default
}));

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
console.log('✅ Database migrated successfully!');
