
import fs from 'fs';

const dbPath = './local_db.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const updates = {
  "business brokers australia": { rank: 18, display: "2//8" },
  "business brokerage": { rank: 15, display: "2//5" },
  "sell business sydney": { rank: 30, display: "3//10" },
  "business brokers": { rank: 14, display: "2//4" }
};

db.keywords = db.keywords.map(k => {
  if (updates[k.text]) {
    return { 
      ...k, 
      organic: updates[k.text].rank, 
      displayRank: updates[k.text].display,
      status: "active"
    };
  }
  return k;
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log("✅ DATABASE HARD-SYNCED WITH DISCOVERED RANKS!");
