const fs = require('fs');
const path = '/var/www/tracker/backend/local_db.json';
const db = JSON.parse(fs.readFileSync(path, 'utf8'));

db.settings = {
  globalSerperApiKey: '',
  globalScrapingdogApiKey: '',
  globalSerpapiKey: '',
  globalProxyUrl: '',
  globalProxies: [],
  isRandomProxy: false,
  activeProxyIdx: null,
  serperQuotaActive: false,
  scrapingdogQuotaActive: false
};

db.userSettings = {};

fs.writeFileSync(path, JSON.stringify(db, null, 2));
console.log('SERVER DB CLEANED SUCCESSFULLY');
