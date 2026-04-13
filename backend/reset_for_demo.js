
import fs from 'fs';

const dbPath = './local_db.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// RESET ALL LIVE KEYWORDS TO 0 (To prove the dashboard button works)
db.keywords = db.keywords.map(k => {
  if (k.status === "active") {
    return { 
      ...k, 
      organic: 0, 
      displayRank: "N/A"
    };
  }
  return k;
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log("✅ DATABASE RESET TO N/A (READY FOR DASHBOARD PROOF)");
