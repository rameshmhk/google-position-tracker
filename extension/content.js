/**
 * RankTracker Pro - Content Script
 * Scrapes Google Search results for target domains
 */

console.log("[RankTracker] Content script active on:", window.location.href);

// Wait for results to load
setTimeout(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const keyword = urlParams.get('q');
  
  // Get target domain from storage (set by background script before opening)
  chrome.storage.local.get(['currentTargetDomain'], (data) => {
    const targetDomain = data.currentTargetDomain;
    if (!targetDomain) return;

    findRank(targetDomain);
  });
}, 2000);

function findRank(targetDomain) {
  // CAPTCHA DETECTION
  const isCaptcha = document.querySelector('#captcha-form, #recaptcha, iframe[src*="recaptcha"]');
  if (isCaptcha || document.title.includes("unusual traffic")) {
    console.log("[RankTracker] Captcha detected!");
    chrome.runtime.sendMessage({ type: "CAPTCHA_DETECTED" });
    return;
  }

  const results = document.querySelectorAll('div.g, .tF2Cxc, .MjjYud');
  let rank = 0;
  let foundUrl = "";

  console.log(`[RankTracker] Searching for: ${targetDomain} among ${results.length} results`);

  for (let i = 0; i < results.length; i++) {
    const link = results[i].querySelector('a');
    if (!link) continue;

    const href = link.href.toLowerCase();
    const cleanDomain = targetDomain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");

    if (href.includes(cleanDomain)) {
      rank = i + 1;
      foundUrl = link.href;
      break;
    }
  }

  // Send result to background script
  chrome.runtime.sendMessage({
    type: "RANK_RESULT",
    rank: rank,
    foundUrl: foundUrl
  });
}
