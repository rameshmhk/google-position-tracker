import { scrapeSerperRank, scrapeGoogleRank, wait } from '../src/services/scraperService.js';
import fs from 'fs';
import path from 'path';

const keywords = [
  "rail bridge inspection",
  "rail engineers",
  "railroad engineers",
  "uas mapping services",
  "uas solutions",
  "bridge rating",
  "bridge health monitoring system",
  "structural health monitoring of bridges",
  "railroad bridge engineering",
  "railroad bridge inspection",
  "fra bridge inspection",
  "railroad bridge design"
];

const targetUrl = "are-corp.com";
const region = "us";
const location = "Kansas";
const apiKey = "15e4117333b41e399dff5a3a9aed2b2a239730d7";

async function runComparison() {
  console.log(`\n=== RANKING INVESTIGATION FOR ${targetUrl} (Location: ${location}, Region: ${region}) ===\n`);
  
  const results = [];

  // PHASE 1: API CHECKS
  console.log("🚀 PHASE 1: Running API Checks...");
  for (const kw of keywords) {
    try {
      const apiRes = await scrapeSerperRank({
        keyword: kw,
        targetUrl,
        region,
        location,
        apiKey
      });
      results.push({
        keyword: kw,
        apiRank: apiRes.organicRank || 'N/A',
        browserRank: 'Pending...'
      });
      console.log(`   ✅ API [${kw}]: ${apiRes.organicRank || 'N/A'}`);
    } catch (err: any) {
      console.error(`   ❌ API [${kw}] Error:`, err.message);
      results.push({ keyword: kw, apiRank: 'Error', browserRank: 'Pending...' });
    }
  }

  // PHASE 2: BROWSER CHECKS
  console.log("\n🚀 PHASE 2: Running Browser Checks (Real Chrome)...");
  for (let i = 0; i < results.length; i++) {
    const item = results[i];
    console.log(`🔍 Checking Browser Rank for: "${item.keyword}"...`);
    try {
      const browserRes = await scrapeGoogleRank({
        keyword: item.keyword,
        targetUrl,
        region,
        location
      });
      item.browserRank = browserRes.organicRank || 'N/A';
      console.log(`   ✅ Browser: ${item.browserRank}`);
    } catch (err: any) {
      console.error(`   ❌ Browser [${item.keyword}] Error:`, err.message);
      item.browserRank = 'Error';
    }
    // Small delay between browser checks to avoid session issues
    await wait(2000);
  }

  console.log("\n\n=== FINAL COMPARISON TABLE ===");
  console.table(results);
}

runComparison().catch(console.error);
