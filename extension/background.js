/**
 * Ranking Anywhere — Background Service Worker v2.0
 * Enterprise Distributed Rank Checker Engine
 * 
 * Flow: Poll backend → Get task → Scrape P1-P10 via offscreen → Submit result
 * Features: Multi-page, CAPTCHA retry, rate limiting, smart delays
 */

const API_BASE = "http://localhost:5000/api";
const MAX_PAGES = 10;
const RESULTS_PER_PAGE = 10;
const DELAY_BETWEEN_PAGES_MS = [3000, 5000]; // Random 3-5s between pages
const DELAY_BETWEEN_TASKS_MS = [8000, 12000]; // Random 8-12s between tasks
const POLL_INTERVAL_MINUTES = 0.5; // 30 seconds (Chrome MV3 minimum)

let isProcessing = false;
let offscreenReady = false;

// ── LIFECYCLE ──
chrome.runtime.onInstalled.addListener(() => {
  console.log("[RA] Ranking Anywhere Extension v2.0 initialized");
});

chrome.runtime.onStartup.addListener(() => {
  initEngine();
});

// Listen for popup commands
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "START_ENGINE") initEngine();
  if (msg.type === "STOP_ENGINE") stopEngine();
});

function initEngine() {
  chrome.alarms.create("heartbeat", { delayInMinutes: 0.1, periodInMinutes: POLL_INTERVAL_MINUTES });
  console.log("[RA] Engine started — polling every 30s");
}

function stopEngine() {
  chrome.alarms.clear("heartbeat");
  isProcessing = false;
  console.log("[RA] Engine stopped");
}

// ── HEARTBEAT ──
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "heartbeat") executeCycle();
});

async function executeCycle() {
  const { userId, isExtensionActive } = await chrome.storage.local.get(["userId", "isExtensionActive"]);
  if (!isExtensionActive || !userId) return;

  // Ping backend (heartbeat)
  try {
    await fetch(`${API_BASE}/extension/ping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
  } catch (e) {
    console.warn("[RA] Backend unreachable");
    return;
  }

  // Don't fetch new task if already processing
  if (isProcessing) return;

  // Fetch next task
  try {
    const res = await fetch(`${API_BASE}/extension/tasks?userId=${userId}`);
    const { task } = await res.json();
    
    if (task) {
      isProcessing = true;
      await processTask(task);
      isProcessing = false;

      // Wait before next task (rate limiting)
      await randomDelay(DELAY_BETWEEN_TASKS_MS[0], DELAY_BETWEEN_TASKS_MS[1]);
    }
  } catch (e) {
    console.warn("[RA] Task fetch failed:", e.message);
    isProcessing = false;
  }
}

// ── TASK PROCESSING ──
async function processTask(task) {
  const { id: taskId, keyword, region, location, targetDomain } = task;
  const tld = getGoogleDomain(region || "au");
  
  console.log(`[RA] ▶ Checking: "${keyword}" on ${tld}`);

  // Build UULE for location targeting
  let uuleParam = "";
  if (location) {
    uuleParam = buildUULE(location);
  }

  let organicRank = 0;
  let mapsRank = 0;
  let foundUrl = "";
  let foundPage = 0;

  // ── MULTI-PAGE SEARCH (P1 → P10) ──
  for (let page = 0; page < MAX_PAGES; page++) {
    const start = page * RESULTS_PER_PAGE;
    const searchUrl = `https://www.${tld}/search?q=${encodeURIComponent(keyword)}&gl=${region || "au"}&hl=en&num=${RESULTS_PER_PAGE}&start=${start}${uuleParam}`;

    console.log(`[RA]   Page ${page + 1} (start=${start})`);

    try {
      const result = await scrapeViaOffscreen(searchUrl, targetDomain, page === 0);

      // CAPTCHA detected
      if (result.captcha) {
        console.warn("[RA] ⚠ CAPTCHA detected! Reporting to backend...");
        await submitResult(taskId, { status: "CAPTCHA" });
        return;
      }

      // Check organic rank
      if (result.organic > 0 && organicRank === 0) {
        organicRank = start + result.organic;
        foundUrl = result.foundUrl || "";
        foundPage = page + 1;
        console.log(`[RA]   ✓ Found at position #${organicRank} on Page ${foundPage}`);
      }

      // Maps only appears on P1
      if (page === 0 && result.maps > 0) {
        mapsRank = result.maps;
        console.log(`[RA]   ✓ Maps rank: #${mapsRank}`);
      }

      // If organic found, no need to check more pages
      if (organicRank > 0) break;

      // Delay between pages (human-like)
      if (page < MAX_PAGES - 1) {
        await randomDelay(DELAY_BETWEEN_PAGES_MS[0], DELAY_BETWEEN_PAGES_MS[1]);
      }

    } catch (err) {
      console.error(`[RA]   Page ${page + 1} error:`, err.message);
      // Continue to next page on error
    }
  }

  // Submit final result
  console.log(`[RA] ✅ Result: Organic=#${organicRank} Maps=#${mapsRank} Page=${foundPage || "DNS"}`);
  await submitResult(taskId, {
    organic: organicRank,
    maps: mapsRank,
    foundUrl,
    foundPage: foundPage || 0,
    status: "SUCCESS"
  });
}

// ── TAB-BASED SCRAPING (real browser session, no CAPTCHA) ──
async function scrapeViaOffscreen(url, targetDomain, checkMaps) {
  return new Promise(async (resolve) => {
    let tabId = null;

    // Timeout after 30s
    const timeout = setTimeout(() => {
      if (tabId) chrome.tabs.remove(tabId).catch(() => {});
      console.warn("[RA] Tab scrape timeout for:", url);
      resolve({ organic: 0, maps: 0, captcha: false });
    }, 30000);

    try {
      // Create tab in background (not focused)
      const tab = await chrome.tabs.create({ url, active: false });
      tabId = tab.id;

      // Wait for page to fully load
      chrome.tabs.onUpdated.addListener(function listener(updatedTabId, info) {
        if (updatedTabId !== tabId || info.status !== "complete") return;
        chrome.tabs.onUpdated.removeListener(listener);

        // Small delay for dynamic content to render
        setTimeout(async () => {
          try {
            // Inject content script to extract results
            const results = await chrome.scripting.executeScript({
              target: { tabId },
              func: extractSearchResults,
              args: [targetDomain, checkMaps]
            });

            // Close tab
            chrome.tabs.remove(tabId).catch(() => {});
            clearTimeout(timeout);

            if (results && results[0] && results[0].result) {
              resolve(results[0].result);
            } else {
              resolve({ organic: 0, maps: 0, captcha: false, foundUrl: "" });
            }
          } catch (err) {
            console.error("[RA] Script injection error:", err.message);
            chrome.tabs.remove(tabId).catch(() => {});
            clearTimeout(timeout);
            resolve({ organic: 0, maps: 0, captcha: false, foundUrl: "" });
          }
        }, 2000); // 2s wait for dynamic content
      });
    } catch (err) {
      console.error("[RA] Tab creation error:", err.message);
      clearTimeout(timeout);
      resolve({ organic: 0, maps: 0, captcha: false, foundUrl: "" });
    }
  });
}

// This function runs INSIDE the Google search page tab
function extractSearchResults(targetDomain, checkMaps) {
  const cleanDomain = targetDomain.replace(/https?:\/\//, "").replace("www.", "").split("/")[0].toLowerCase();

  // CAPTCHA check
  if (document.querySelector("#captcha-form") || 
      document.body.innerText.includes("unusual traffic") ||
      document.body.innerText.includes("systems have detected") ||
      window.location.href.includes("/sorry/")) {
    return { organic: 0, maps: 0, captcha: true, foundUrl: "" };
  }

  // ORGANIC RANK
  let organicRank = 0;
  let foundUrl = "";
  const gBlocks = document.querySelectorAll("#search .g, #rso .g, #rso > div > div");
  let position = 0;

  for (const block of gBlocks) {
    if (block.closest(".related-question-pair")) continue;
    if (block.querySelector(".related-question-pair")) continue;
    if (block.classList.contains("ULSxyf")) continue;

    const links = block.querySelectorAll("a[href]");
    let counted = false;

    for (const link of links) {
      const href = (link.getAttribute("href") || "").toLowerCase();
      if (!href.startsWith("http")) continue;
      if (href.includes("google.com") && !href.includes(cleanDomain)) continue;
      if (href.includes("webcache.google") || href.includes("translate.google")) continue;

      if (!counted) { position++; counted = true; }

      if (href.includes(cleanDomain)) {
        organicRank = position;
        foundUrl = link.getAttribute("href");
        break;
      }
      break;
    }
    if (organicRank > 0) break;
  }

  // Fallback: scan all result links
  if (organicRank === 0) {
    const allLinks = document.querySelectorAll("#rso a[href*='http']");
    let pos = 0;
    const seen = new Set();
    for (const link of allLinks) {
      const href = link.getAttribute("href") || "";
      if (!href.startsWith("http") || href.includes("google.com")) continue;
      try {
        const domain = new URL(href).hostname.replace("www.", "").toLowerCase();
        if (seen.has(domain)) continue;
        seen.add(domain);
        pos++;
        if (domain.includes(cleanDomain) || cleanDomain.includes(domain)) {
          organicRank = pos;
          foundUrl = href;
          break;
        }
      } catch (e) { continue; }
    }
  }

  // MAPS RANK
  let mapsRank = 0;
  if (checkMaps) {
    const mapItems = document.querySelectorAll(".VkpGBb, .cXedhc, [data-cid], .rllt__details, .dbg0pd");
    let mapPos = 0;
    for (const item of mapItems) {
      mapPos++;
      const text = item.textContent.toLowerCase();
      if (text.includes(cleanDomain)) { mapsRank = mapPos; break; }
      const mLinks = item.querySelectorAll("a[href]");
      for (const ml of mLinks) {
        if ((ml.getAttribute("href") || "").toLowerCase().includes(cleanDomain)) { mapsRank = mapPos; break; }
      }
      if (mapsRank > 0) break;
    }
  }

  return { organic: organicRank, maps: mapsRank, captcha: false, foundUrl };
}

// ── SUBMIT RESULT ──
async function submitResult(taskId, data) {
  try {
    await fetch(`${API_BASE}/extension/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, ...data })
    });
  } catch (e) {
    console.error("[RA] Submit failed:", e.message);
  }
}

// ── HELPERS ──
function getGoogleDomain(region) {
  const map = {
    au: "google.com.au", in: "google.co.in", uk: "google.co.uk", gb: "google.co.uk",
    us: "google.com", ca: "google.ca", de: "google.de", fr: "google.fr",
    es: "google.es", br: "google.com.br", jp: "google.co.jp", ae: "google.ae"
  };
  return map[region.toLowerCase()] || "google.com";
}

function buildUULE(location) {
  const canonical = location.includes(",") ? location : `${location}`;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const key = chars[canonical.length % chars.length] || "A";
  const encoded = btoa(unescape(encodeURIComponent(canonical))).replace(/=/g, "");
  return `&uule=w+CAIQICI${key}${encoded}`;
}

function randomDelay(min, max) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(r => setTimeout(r, ms));
}

// ── AUTO-START ──
try {
  chrome.storage.local.get(["isExtensionActive"]).then(({ isExtensionActive }) => {
    if (isExtensionActive) initEngine();
  });
} catch (e) {
  console.warn("[RA] Auto-start deferred", e.message);
}
