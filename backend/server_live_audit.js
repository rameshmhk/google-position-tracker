import fs from 'fs';
import path from 'path';
import axios from 'axios';

const API_KEY = "15e4117333b41e399dff5a3a9aed2b2a239730d7";
const TARGET_DOMAIN = "adamdental.com.au";
const BRAND_NAME = "Adam Dental";

const DB_PATH = path.join(process.cwd(), 'local_db.json');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

const projectId = "adam_dental_1776945720827"; // Latest Project ID
const keywords = db.keywords.filter(k => k.projectId === projectId);

async function checkRank(kw, loc) {
    try {
        const res = await axios.post('https://google.serper.dev/search', {
            q: kw,
            gl: "au",
            location: loc,
            num: 100
        }, {
            headers: { 'X-API-KEY': API_KEY, 'Content-Type': 'application/json' }
        });

        const organic = res.data.organic || [];
        let organicRank = 0;
        let foundUrl = '';

        for (const item of organic) {
            const link = (item.link || '').toLowerCase();
            const title = (item.title || '').toLowerCase();
            if (link.includes(TARGET_DOMAIN) || title.includes(BRAND_NAME.toLowerCase())) {
                organicRank = item.position;
                foundUrl = item.link;
                break;
            }
        }

        const mapsRes = await axios.post('https://google.serper.dev/places', {
            q: kw,
            gl: "au",
            location: loc
        }, {
            headers: { 'X-API-KEY': API_KEY, 'Content-Type': 'application/json' }
        });

        const places = mapsRes.data.places || [];
        let mapsRank = 0;
        for (let i = 0; i < places.length; i++) {
            const p = places[i];
            const pTitle = (p.title || '').toLowerCase();
            const pWeb = (p.website || '').toLowerCase();
            if (pTitle.includes(BRAND_NAME.toLowerCase()) || pWeb.includes(TARGET_DOMAIN)) {
                mapsRank = i + 1;
                break;
            }
        }

        return { organicRank, mapsRank };
    } catch (err) {
        return { organicRank: 0, mapsRank: 0 };
    }
}

async function runAudit() {
    console.log("=== EXECUTING LIVE API RANKING CHECK ON SERVER ===");
    for (const k of keywords) {
        const result = await checkRank(k.text, k.location);
        console.log(`✅ "${k.text}": Organic #${result.organicRank}, Maps #${result.mapsRank}`);

        k.organic = result.organicRank;
        k.maps = result.mapsRank;
        k.rank = result.organicRank;
        k.mapsRank = result.mapsRank;
        k.lastChecked = new Date().toISOString().split('T')[0];
        k.source = 'Live Server API';
        k.status = 'active';
        k.displayRank = (result.organicRank > 0 ? `#${result.organicRank}` : 'DNS');
    }

    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    console.log("=== SERVER DATABASE UPDATED WITH REAL-TIME RANKINGS ===");
}

runAudit();
