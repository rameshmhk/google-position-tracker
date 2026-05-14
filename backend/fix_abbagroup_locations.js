import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'local_db.json');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

const projectId = "1776937143253"; // abbagroup
const keywords = db.keywords.filter(k => k.projectId === projectId);

console.log(`Fixing locations for ${keywords.length} keywords in project "abbagroup"...`);

const CITIES = ['sydney', 'canberra', 'wollongong', 'newcastle', 'australia'];

keywords.forEach(k => {
    const text = k.text.toLowerCase();
    let foundCity = '';
    
    for (const city of CITIES) {
        if (text.includes(city)) {
            foundCity = city;
            break;
        }
    }

    if (foundCity) {
        const canonical = foundCity.charAt(0).toUpperCase() + foundCity.slice(1) + ", Australia";
        console.log(`- Updating "${k.text}": "${k.location}" -> "${canonical}"`);
        k.location = canonical;
    }
});

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
console.log("Database updated successfully.");
