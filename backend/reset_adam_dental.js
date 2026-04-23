import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'local_db.json');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

const PROJECT_ID = "adam_dental_proj_1776944295597";
const keywords = db.keywords.filter(k => k.projectId === PROJECT_ID);

console.log("Resetting ranks for Adam Dental to force a fresh LIVE check...");
keywords.forEach(k => {
    k.organic = 0;
    k.maps = 0;
    k.rank = 0;
    k.mapsRank = 0;
    k.displayRank = 'N/A';
    k.source = '';
    k.lastChecked = null;
});

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
console.log("Database reset. Ready for live dashboard check.");
