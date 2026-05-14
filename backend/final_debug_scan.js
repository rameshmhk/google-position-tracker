import axios from 'axios';
import fs from 'fs';

const DB_FILE = 'local_db.json';
const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
const API_KEY = db.settings.globalSerperApiKey;

const keywords = [
  "business brokers australia",
  "sell your business",
  "business brokerage",
  "business brokers"
];

const targetDomain = "abbagroup.com.au";

async function runDiagnostic() {
  console.log("🚀 Starting Broad Diagnostic Scan...");
  const results = [];

  for (const kw of keywords) {
    console.log(`Scanning: ${kw}...`);
    try {
      const response = await axios.post('https://google.serper.dev/search', {
        q: kw,
        gl: 'au',
        location: '', // Smart Location Bypass
        num: 100
      }, {
        headers: { 'X-API-KEY': API_KEY, 'Content-Type': 'application/json' }
      });

      const organic = response.data.organic || [];
      const matches = organic.filter(r => r.link.toLowerCase().includes(targetDomain));
      
      results.push({
        keyword: kw,
        count: organic.length,
        foundAt: matches.map(m => m.position),
        top10Links: organic.slice(0, 10).map(r => r.link)
      });
    } catch (err) {
      console.error(`Error for ${kw}:`, err.message);
    }
  }

  fs.writeFileSync('debug_raw_hits.json', JSON.stringify(results, null, 2));
  console.log("✅ Diagnostic Complete! Output saved to debug_raw_hits.json");
}

runDiagnostic();
