/**
 * Ranking Anywhere — Offscreen DOM Parser v2.1
 * 
 * Uses XMLHttpRequest instead of fetch() for better cookie/session handling.
 * The offscreen document runs with the extension's permissions, so it can
 * access Google search with the user's real cookies.
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "SCRAPE_PAGE") return;

  const { url, targetDomain, checkMaps, requestUrl } = message;

  const xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.setRequestHeader("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
  xhr.setRequestHeader("Accept-Language", "en-US,en;q=0.9");
  xhr.withCredentials = true; // Send cookies with request
  
  xhr.onload = function() {
    const html = xhr.responseText;

    // ── CAPTCHA CHECK ──
    const lowerHtml = html.toLowerCase();
    const isCaptcha = 
      lowerHtml.includes("/sorry/") ||
      lowerHtml.includes("unusual traffic") ||
      lowerHtml.includes("systems have detected") ||
      lowerHtml.includes("recaptcha") ||
      lowerHtml.includes("g-recaptcha") ||
      (xhr.status === 429) ||
      (xhr.responseURL && xhr.responseURL.includes("/sorry/"));

    if (isCaptcha) {
      console.warn("[Offscreen] CAPTCHA detected for:", url);
      chrome.runtime.sendMessage({
        type: "SCRAPE_RESULT",
        requestUrl,
        organic: 0, maps: 0, captcha: true, foundUrl: ""
      });
      return;
    }

    // Parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // ── ORGANIC RANK ──
    const organicResult = findOrganicRank(doc, targetDomain);

    // ── MAPS RANK ──
    let mapsRank = 0;
    if (checkMaps) {
      mapsRank = findMapsRank(doc, html, targetDomain);
    }

    console.log(`[Offscreen] Result: organic=#${organicResult.rank} maps=#${mapsRank} url=${organicResult.url}`);

    chrome.runtime.sendMessage({
      type: "SCRAPE_RESULT",
      requestUrl,
      organic: organicResult.rank,
      foundUrl: organicResult.url,
      maps: mapsRank,
      captcha: false
    });
  };

  xhr.onerror = function() {
    console.error("[Offscreen] XHR error for:", url);
    chrome.runtime.sendMessage({
      type: "SCRAPE_RESULT",
      requestUrl,
      organic: 0, maps: 0, captcha: false, foundUrl: "",
      error: "Network error"
    });
  };

  xhr.ontimeout = function() {
    console.error("[Offscreen] XHR timeout for:", url);
    chrome.runtime.sendMessage({
      type: "SCRAPE_RESULT",
      requestUrl,
      organic: 0, maps: 0, captcha: false, foundUrl: ""
    });
  };

  xhr.timeout = 20000; // 20 second timeout
  xhr.send();
});

/**
 * Find organic ranking for target domain
 */
function findOrganicRank(doc, targetDomain) {
  const cleanDomain = targetDomain
    .replace(/https?:\/\//, "")
    .replace("www.", "")
    .split("/")[0]
    .toLowerCase();

  // Strategy 1: Standard .g result blocks
  const gBlocks = doc.querySelectorAll("#search .g, #rso .g, #rso > div > div");
  let position = 0;

  for (const block of gBlocks) {
    if (block.closest(".related-question-pair")) continue;
    if (block.querySelector(".related-question-pair")) continue;
    // Skip "People also ask" and other non-result blocks
    if (block.classList.contains("ULSxyf")) continue;

    const links = block.querySelectorAll("a[href]");
    let foundLink = false;
    
    for (const link of links) {
      const href = (link.getAttribute("href") || "").toLowerCase();
      if (!href.startsWith("http")) continue;
      if (href.includes("google.com") && !href.includes(cleanDomain)) continue;
      if (href.includes("webcache.google")) continue;
      if (href.includes("translate.google")) continue;

      if (!foundLink) {
        position++;
        foundLink = true;
      }

      if (href.includes(cleanDomain)) {
        return { rank: position, url: link.getAttribute("href") };
      }
      break; // Only first real link per block
    }
  }

  // Strategy 2: Fallback - all result links
  if (position === 0) {
    const allLinks = doc.querySelectorAll("#rso a[href*='http']");
    let pos = 0;
    const seen = new Set();

    for (const link of allLinks) {
      const href = (link.getAttribute("href") || "");
      if (!href.startsWith("http")) continue;
      if (href.includes("google.com")) continue;

      try {
        const domain = new URL(href).hostname.replace("www.", "").toLowerCase();
        if (seen.has(domain)) continue;
        seen.add(domain);
        pos++;

        if (domain.includes(cleanDomain) || cleanDomain.includes(domain)) {
          return { rank: pos, url: href };
        }
      } catch (e) { continue; }
    }
  }

  return { rank: 0, url: "" };
}

/**
 * Find Maps/Local Pack ranking
 */
function findMapsRank(doc, html, targetDomain) {
  const cleanDomain = targetDomain
    .replace(/https?:\/\//, "")
    .replace("www.", "")
    .split("/")[0]
    .toLowerCase();

  const mapSelectors = [
    ".VkpGBb", ".cXedhc", "[data-cid]", 
    ".rllt__details", ".dbg0pd"
  ];

  for (const selector of mapSelectors) {
    const items = doc.querySelectorAll(selector);
    if (items.length === 0) continue;

    let mapPos = 0;
    for (const item of items) {
      mapPos++;
      const text = item.textContent.toLowerCase();
      const links = item.querySelectorAll("a[href]");
      
      if (text.includes(cleanDomain)) return mapPos;

      for (const link of links) {
        const href = (link.getAttribute("href") || "").toLowerCase();
        if (href.includes(cleanDomain)) return mapPos;
      }
    }
  }

  return 0;
}
