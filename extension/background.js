/**
 * RankTracker Pro - Ultra-Stable Background Service
 * RankTracker Pro - Enterprise Background Service v2.0
 */

const API_BASE = "http://localhost:5000/api";
let isRunning = false;
let scraperWindowId = null;

// 1. Startup Logic
chrome.runtime.onInstalled.addListener(() => {
    console.log("[Service] RankTracker Pro Extension Initialized.");
    cleanupResources();
});

async function cleanupResources() {
    // Close any stray windows/tabs from previous sessions
    const windows = await chrome.windows.getAll();
    for (const win of windows) {
        if (win.type === 'popup') { // Our scrapers are popups
            try { await chrome.windows.remove(win.id); } catch(e){}
        }
    }
}

// 2. Heartbeat & Task Orchestration
function startHeartbeat() {
    chrome.alarms.create("pulse", { periodInMinutes: 0.25 });
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "pulse") executeCycle();
});

async function executeCycle() {
    if (isRunning) return;
    
    try {
        const { userId, isExtensionActive } = await chrome.storage.local.get(['userId', 'isExtensionActive']);
        if (!isExtensionActive || !userId) return;

        // Heartbeat Ping
        await fetch(`${API_BASE}/extension/ping`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userId.trim() })
        });

        // Fetch Next Task
        const response = await fetch(`${API_BASE}/extension/tasks?userId=${userId.trim()}`);
        if (!response.ok) return;

        const { task } = await response.json();
        if (task) {
            isRunning = true;
            await performScraping(task);
        }
    } catch (err) {
        console.warn("[Service] Cycle skipped (Backend unavailable).");
        isRunning = false;
    }
}

async function performScraping(task) {
    const { keyword, region, targetDomain, taskId, location } = task;
    const tld = getTLD(region || 'au');
    
    let uule = "";
    if (location) {
        const canonical = location.includes(",") ? location : `${location}, Australia`;
        const UULE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
        const key = UULE_CHARS[canonical.length] || 'A';
        const uuleEncoded = btoa(unescape(encodeURIComponent(canonical))).replace(/=/g, '');
        uule = `&uule=w+CAIQICI${key}${uuleEncoded}`;
    }

    const url = `https://www.${tld}/search?q=${encodeURIComponent(keyword)}&gl=${region || 'au'}${uule}&num=100`;

    try {
        // TRULY INVISIBLE: Use Chrome Offscreen API (No windows, no popups)
        await chrome.offscreen.createDocument({
            url: 'offscreen.html',
            reasons: ['DOM_PARSER'],
            justification: 'Perform background SEO ranking checks without disturbing the user.'
        });

        // Send task to offscreen document
        chrome.runtime.sendMessage({
            type: 'PERFORM_HIDDEN_SCRAPE',
            url,
            targetDomain
        });

        // Listener for result from offscreen
        const resultListener = async (message) => {
            if (message.type === 'SCRAPE_RESULT') {
                chrome.runtime.onMessage.removeListener(resultListener);
                
                await submitResult(taskId, { 
                    organic: message.rank || 0, 
                    maps: message.mapsRank || 0, 
                    status: message.status 
                });
                
                // Cleanup offscreen document
                await chrome.offscreen.closeDocument();
                isRunning = false;
            }
        };

        chrome.runtime.onMessage.addListener(resultListener);

        // Safety Timeout (30s)
        setTimeout(async () => {
            if (isRunning) {
                chrome.runtime.onMessage.removeListener(resultListener);
                try { await chrome.offscreen.closeDocument(); } catch(e){}
                isRunning = false;
            }
        }, 30000);

    } catch (err) {
        console.error("[Scraper] Fatal error:", err);
        isRunning = false;
    }
}

async function submitResult(taskId, result) {
    try {
        await fetch(`${API_BASE}/extension/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId, ...result })
        });
    } catch (e) {}
}

function getTLD(region) {
    const map = { "au": "google.com.au", "in": "google.co.in", "uk": "google.co.uk", "us": "google.com" };
    return map[region.toLowerCase()] || "google.com";
}

// Initial Kickoff
startHeartbeat();
executeCycle();
