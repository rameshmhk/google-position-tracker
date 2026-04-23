import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'local_db.json');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

const projectId = "1776937143253"; // abbagroup
const project = db.projects.find(p => p.id === projectId);

if (project) {
    console.log(`Updating project "abbagroup" to HYBRID strategy...`);
    project.scrapingStrategy = 'hybrid';
}

const keywords = db.keywords.filter(k => k.projectId === projectId);
keywords.forEach(k => {
    // Reset ranks to force a fresh look
    k.organic = 0;
    k.maps = 0;
    k.displayRank = 'N/A';
    k.source = '';
});

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
console.log("Project updated to HYBRID and ranks reset. Please restart the backend server if changes don't show up.");
