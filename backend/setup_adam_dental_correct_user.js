import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'local_db.json');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

const testUserId = "1776349431674"; // The user in the screenshot

// 1. Remove ALL projects and keywords for Test User
db.projects = db.projects.filter(p => p.userId !== testUserId);
db.keywords = db.keywords.filter(k => {
    // Keep keyword only if its project belongs to someone else
    const p = db.projects.find(proj => String(proj.id) === String(k.projectId));
    return p !== undefined;
});

// 2. Add the Adam Dental project
const projectId = "adam_dental_" + Date.now();
const adamDentalProject = {
    id: projectId,
    userId: testUserId,
    name: "Adam Dental",
    url: "adamdental.com.au",
    businessName: "Adam Dental",
    targetRegion: "au",
    schedule: "instant",
    defaultLocation: "Mulgrave, Victoria, Australia",
    defaultLat: -37.915,
    defaultLng: 145.148,
    pincode: "3170",
    usePincode: true,
    scrapingStrategy: "hybrid",
    device: "desktop",
    proxyUrl: "",
    lastChecked: null,
    status: "active"
};

const keywordTexts = [
    "dental supplies australia",
    "dental needles",
    "dental supplies sydney",
    "dental supplies brisbane",
    "dental supplies melbourne",
    "dental supplies perth",
    "dental supplies adelaide",
    "dental equipment",
    "powder free latex gloves",
    "autoclave bags",
    "scotchbond",
    "nitrile gloves"
];

const keywords = keywordTexts.map(text => {
    let loc = "Mulgrave, Victoria, Australia";
    if (text.includes("sydney")) loc = "Sydney, Australia";
    else if (text.includes("brisbane")) loc = "Brisbane, Australia";
    else if (text.includes("melbourne")) loc = "Melbourne, Australia";
    else if (text.includes("perth")) loc = "Perth, Australia";
    else if (text.includes("adelaide")) loc = "Adelaide, Australia";
    else if (text.includes("australia")) loc = "Australia";

    return {
        id: Math.random().toString(36).substring(7),
        projectId: projectId,
        text: text,
        organic: 0,
        maps: 0,
        status: "active",
        mapsStatus: "active",
        organicStatus: "active",
        location: loc,
        lat: 0,
        lng: 0,
        displayRank: "N/A",
        source: "",
        lastChecked: null,
        history: []
    };
});

db.projects.push(adamDentalProject);
db.keywords.push(...keywords);

// Also reset global serper quota so API checks work
if (db.settings) {
    db.settings.serperQuotaActive = true;
}

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
console.log(`Setup complete. Added Adam Dental to Test User.`);
