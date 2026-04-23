import fs from 'fs';
import path from 'path';
import axios from 'axios';

const API_KEY = "15e4117333b41e399dff5a3a9aed2b2a239730d7";
const DB_PATH = path.join(process.cwd(), 'local_db.json');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

const userId = "111499858881808739149"; // Ramesh Kumar
const projectId = "adam_dental_proj_" + Date.now();

const adamDentalProject = {
    id: projectId,
    userId: userId,
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
    lastChecked: new Date().toISOString().split('T')[0],
    lastCheck: Date.now(),
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

// Clear existing projects/keywords for this user if desired (user said "sare delete karo")
db.projects = db.projects.filter(p => p.userId !== userId);
db.keywords = db.keywords.filter(k => {
    const p = db.projects.find(proj => proj.id === k.projectId);
    return p !== undefined; // Keep keywords of other users' projects
});

db.projects.push(adamDentalProject);
db.keywords.push(...keywords);

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

console.log(`Successfully set up "Adam Dental" project with ${keywords.length} keywords.`);
console.log(`Project ID: ${projectId}`);
