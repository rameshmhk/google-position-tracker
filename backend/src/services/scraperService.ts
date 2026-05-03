import { addExtra } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const puppeteerExtra = addExtra(puppeteer as any);
puppeteerExtra.use(StealthPlugin());

const UULE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export interface ScrapeOptions {
  keyword: string;
  targetUrl: string;
  region?: string;
  businessName?: string;
  location?: string;
  lat?: number;
  lng?: number;
  apiKey?: string;
  scrapingdogApiKey?: string;
  serpapiKey?: string;
  skipMaps?: boolean;
  skipOrganic?: boolean;
  device?: 'desktop' | 'mobile';
  proxyUrl?: string;
}

const BROWSER_DATA_DIR = path.join(process.cwd(), 'browser_data');

export const REGION_TO_COUNTRY: Record<string, string> = {
  'au': 'Australia',
  'us': 'United States',
  'gb': 'United Kingdom',
  'uk': 'United Kingdom',
  'in': 'India'
};

const REGION_TO_TLD: Record<string, string> = {
  'au': 'google.com.au',
  'us': 'google.com',
  'gb': 'google.co.uk',
  'uk': 'google.co.uk',
  'in': 'google.co.in'
};

const getUULE = (location: string, region: string = 'au'): string => {
  const country = REGION_TO_COUNTRY[region.toLowerCase()] || 'Australia';
  // If the location already has commas or mentions the country, use it as is.
  const canonical = (location.includes(',') || location.toLowerCase().includes(country.toLowerCase())) 
    ? location 
    : `${location}, ${country}`;
    
  const length = canonical.length;
  const key = UULE_CHARS[length] || 'A';
  // Use UTF-8 safe base64 encoding
  const encoded = Buffer.from(canonical).toString('base64').replace(/=/g, '');
  return `w+CAIQICI${key}${encoded}`;
};

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0'
];

export const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

const getRandomDelay = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

/**
 * High Reliability Scraper using Serper.dev API
 */
/**
 * Batch Scraper for Serper.dev
 * Optimized for Top 100 Results (10 Pages) in a single request.
 */
export const scrapeSerperBatch = async (optionsList: ScrapeOptions[]) => {
  if (optionsList.length === 0) return [];
  const apiKey = optionsList[0]?.apiKey;
  if (!apiKey) {
    console.error('[Batch Scraper] No API Key provided');
    return [];
  }

  const results = optionsList.map(opt => ({
    keyword: opt.keyword,
    organicRank: 0,
    mapsRank: 0,
    foundUrl: '',
    found: false,
    options: opt
  }));

  const cleanTarget = (url: string) => {
    if (!url) return '';
    try {
      return url.toLowerCase()
        .replace(/^(https?:\/\/)?(www\.)?/, '') // Remove protocol and www
        .split('/')[0] // Get domain part
        ?.split('?')[0] // Remove query strings
        ?.replace(/\/$/, '') // Final slash trim
        ?.trim() || '';
    } catch {
      return url.toLowerCase().trim();
    }
  };

  try {
    // Phase 1: High-Speed Organic Wave (Top 100)
    console.log(`\n🔥 [SCRAPER] BATCH WAVE TRIGGERED for ${results.length} keywords!`);
    console.log(`[Batch] Scanning Top 100 (10 Pages) for ${results.length} keywords...`);
    
    // Create batch payload
    const batchPayload = results.map(r => {
      const region = r.options.region || 'au';
      const country = REGION_TO_COUNTRY[region.toLowerCase()] || 'Australia';
      const rawLocation = (r.options.location || '').toLowerCase().trim();
      
      // USER REQUEST: Use the exact location string passed from the backend.
      let finalLocation = r.options.location || '';
      // Only append country if it's a single word (like just a city name) and doesn't contain country
      if (finalLocation && !finalLocation.includes(',') && !finalLocation.toLowerCase().includes(country.toLowerCase())) {
        finalLocation = `${finalLocation}, ${country}`;
      }

      // If location is just the country name, leave it empty for Serper to use gl-region default
      const useLocation = (rawLocation === country.toLowerCase()) ? '' : finalLocation;
      const uule = finalLocation ? getUULE(finalLocation, region) : '';
      
      // LOG COORDINATES IF PRESENT
      if (r.options.lat || r.options.lng) {
        console.log(`[Batch-GPS] Keyword "${r.keyword}" has coordinates: ${r.options.lat}, ${r.options.lng}.`);
      }

      return {
        q: r.keyword,
        gl: region,
        location: useLocation,
        uule: uule, // SYNC WITH BROWSER PRECISION
        num: 100 
      };
    });

    const searchRes = await axios.post('https://google.serper.dev/search', batchPayload, {
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' }
    });

    const batchData = Array.isArray(searchRes.data) ? searchRes.data : [searchRes.data];

    // UPDATED: Standard for-loop to support async deep-scan fallback
    const ABS_LOG = 'C:\\Users\\natas\\OneDrive\\Desktop\\Google Position Tracter\\backend\\debug_scan_audit.log';
    for (let batchIdx = 0; batchIdx < batchData.length; batchIdx++) {
      const data = batchData[batchIdx];
      const item = results[batchIdx];
      if (!item || !data) continue;

      const targetUrlRaw = item.options?.targetUrl || '';
      const targetDomain = cleanTarget(targetUrlRaw).toLowerCase();
      const organic = data.organic || [];

      fs.appendFileSync(ABS_LOG, `\n--- [Batch Scan] Keyword: "${item.keyword}" --- \nLooking for: "${targetDomain}"\n`);

      // 1. Check Page 1 (Top 100) - Only if not skipped
      if (!item.options.skipOrganic) {
        for (let i = 0; i < organic.length; i++) {
          const res = organic[i];
          if (!res) continue;
          const resLink = (res.link || '').toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
          const resTitle = (res.title || '').toLowerCase();
          
          // PHASE 1: DIRECT DOMAIN MATCH (Robust check for subfolder/exact match)
          const isDomainMatch = resLink.startsWith(targetDomain) || resLink.includes('.' + targetDomain) || resLink === targetDomain;
          
          // PHASE 2: BRAND MATCH (First part of domain, e.g. 'abbagroup')
          const brand = targetDomain.split('.')[0] || '';
          const isBrandMatch = brand.length > 4 && (resLink.includes(brand) || resTitle.includes(brand));

          if (isDomainMatch || isBrandMatch) {
            item.organicRank = res.position || (i + 1);
            item.foundUrl = res.link;
            item.found = true;
            console.log(`\n🔥 [DASHBOARD] 🎯 MATCH FOUND! Rank: ${item.organicRank} for "${item.keyword}"`);
            fs.appendFileSync(ABS_LOG, `🎯 MATCH FOUND at Rank ${item.organicRank} for "${item.keyword}"\n`);
            break;
          }
        }
      } else {
        console.log(`[Batch] Skipping Organic for "${item.keyword}" as requested.`);
        item.found = true; // Mark as found to skip deep scan
      }

      // 2. Deep Recovery Loop (Pages 11 to 20) - Since Page 1 (num:100) already checked up to 100
      if (!item.found) {
        console.log(`\n⚠️ [DASHBOARD] NO MATCH for "${item.keyword}" in first wave (Top 100). Retrying iterative Deep Scan for the next 100...`);
        
        // DEEP RECOVERY LOOP: Start from page 2 (Pos 11 - 200) 
        // We start from 2 instead of 11 because num:100 in wave 1 might only return 10 results
        for (let p = 2; p <= 20; p++) {
          if (item.found) break;
          try {
            const region = item.options.region || 'au';
            const rawLoc = (item.options.location || '').toLowerCase().trim();
            const country = REGION_TO_COUNTRY[region.toLowerCase()] || 'Australia';
            const finalLocation = (rawLoc && !rawLoc.includes(',')) ? `${rawLoc}, ${country}` : (rawLoc || '');
            const uule = finalLocation ? getUULE(finalLocation, region) : '';
            const useLoc = (rawLoc === country.toLowerCase()) ? '' : finalLocation;

            const deepRes = await axios.post('https://google.serper.dev/search', {
              q: item.keyword,
              gl: region,
              location: useLoc,
              uule: uule, // SYNC PRECISION
              num: 10,
              page: p
            }, {
              headers: { 'X-API-KEY': apiKey || '', 'Content-Type': 'application/json' }
            });
            
            const deepOrganic = deepRes.data.organic || [];
            if (deepOrganic.length === 0) break; // End of results

            console.log(`[DeepScan] Page ${p}: Found ${deepOrganic.length} results for "${item.keyword}"`);

            for (let di = 0; di < deepOrganic.length; di++) {
              const dr = deepOrganic[di];
              if (!dr) continue;
              const drLink = (dr.link || '').toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
              
              // NEW ROBUST MATCHING
              const drMatch = drLink.startsWith(targetDomain) || 
                              drLink.includes('.' + targetDomain) || 
                              drLink === targetDomain;

              if (drMatch) {
                item.organicRank = dr.position || (di + 1 + ((p - 1) * 10));
                item.foundUrl = dr.link;
                item.found = true;
                console.log(`\n🔥 [DEEP RECOVERY] 🎯 MATCH FOUND on Page ${p}! Absolute Rank: ${item.organicRank} for "${item.keyword}"`);
                fs.appendFileSync(ABS_LOG, `🎯 DEEP MATCH FOUND at Rank ${item.organicRank} on Page ${p} for "${item.keyword}"\n`);
                break;
              }
            }
          } catch (deepErr: any) {
            console.error(`[DeepScraper] Error during retry Page ${p}:`, deepErr.message);
          }
        }
      }
      
      if (!item.found) {
        fs.appendFileSync(ABS_LOG, `⚠ NO MATCH FOUND in Top 200 results for "${item.keyword}"\n`);
      }
    }

    // Phase 2: Maps Wave (No change needed)
    const pendingMaps = results.filter(r => !r.options.skipMaps && (r.options.businessName || r.options.targetUrl));
    if (pendingMaps.length > 0) {
      console.log(`[Batch] Maps Wave: Scanning ${pendingMaps.length} keywords...`);
      const mapsPayload = pendingMaps.map(r => ({
        q: r.keyword,
        gl: r.options.region || 'au',
        location: (() => {
          const loc = r.options.location || '';
          const country = REGION_TO_COUNTRY[(r.options.region || 'au').toLowerCase()] || 'Australia';
          return (loc && !loc.includes(',')) ? `${loc}, ${country}` : loc;
        })(),
        uule: (() => {
          const loc = r.options.location || '';
          const country = REGION_TO_COUNTRY[(r.options.region || 'au').toLowerCase()] || 'Australia';
          const finalLoc = (loc && !loc.includes(',')) ? `${loc}, ${country}` : loc;
          return finalLoc ? getUULE(finalLoc, r.options.region || 'au') : '';
        })()
      }));

      const mapsRes = await axios.post('https://google.serper.dev/places', mapsPayload, {
        headers: { 'X-API-KEY': apiKey || '', 'Content-Type': 'application/json' }
      });

      const batchMapsData = Array.isArray(mapsRes.data) ? mapsRes.data : [mapsRes.data];

      batchMapsData.forEach((data, index) => {
        const item = pendingMaps[index];
        if (!item || !data) return;

        const targetDomain = cleanTarget(item.options.targetUrl);
        const businessName = item.options.businessName;
        const shortTitle = businessName ? businessName.toLowerCase().split(' ')[0] : '';
        const places = data.places || [];

        for (let i = 0; i < places.length; i++) {
          const p = places[i];
          const pTitle = (p.title || '').toLowerCase();
          const pWeb = (p.website || '').toLowerCase();

          const nameMatch = businessName && (pTitle.includes(businessName.toLowerCase()) || (shortTitle && pTitle.includes(shortTitle)));
          const urlMatch = targetDomain && pWeb.includes(targetDomain);

          if (nameMatch || urlMatch) {
            item.mapsRank = i + 1;
            if (!item.foundUrl) item.foundUrl = p.website;
            break;
          }
        }
      });
    }

    return results.map(r => ({
      keyword: r.keyword,
      organicRank: r.organicRank,
      mapsRank: r.mapsRank,
      foundUrl: r.foundUrl,
      source: r.organicRank > 0 || r.mapsRank > 0 ? 'Serper' : ''
    }));

  } catch (err: any) {
    console.error('[Batch Scraper] Error:', err.message);
    return results.map(r => ({
      keyword: r.keyword,
      organicRank: r.organicRank,
      mapsRank: r.mapsRank,
      foundUrl: r.foundUrl,
      error: err.response?.status === 403 || err.message.includes('403') ? 'QUOTA_EXCEEDED' : undefined
    }));
  }
};

export const scrapeSerperRank = async (options: ScrapeOptions) => {
  const { keyword, targetUrl, region, businessName, location, apiKey } = options;
  const result = { organicRank: 0, mapsRank: 0, foundUrl: '' };
  
  try {
    const cleanTargetDomain = (targetUrl || '').toString().toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .split('/')[0]
      ?.split('?')[0]
      ?.trim() || '';
    
    // Canonicalize Locations for Serper Accuracy
    const useLocation = (location || '').toLowerCase().trim();
    const country = REGION_TO_COUNTRY[region?.toLowerCase() || 'au'] || 'Australia';
    const finalLocation = (useLocation && !useLocation.includes(',')) ? `${location}, ${country}` : (location || '');
    const uule = finalLocation ? getUULE(finalLocation, region || 'au') : '';

    console.log(`[Serper] Analyzing: "${cleanTargetDomain}" for Keyword: "${keyword}" (Location: ${finalLocation}, UULE: ${uule})`);

    // 1. Organic Mapping (Pages 1-20)
    let foundOrganic = false;
    for (let page = 1; page <= 20; page++) {
      if (foundOrganic) break;
      
      console.log(`[Serper] Scanning Page ${page} (num: 10)...`);
      const searchRes = await axios.post('https://google.serper.dev/search', {
        q: keyword,
        gl: region || 'au',
        location: finalLocation,
        uule: uule,
        num: 10,
        page: page
      }, {
        headers: { 'X-API-KEY': apiKey || '', 'Content-Type': 'application/json' }
      });

      const organic = searchRes.data.organic || [];
      for (let i = 0; i < organic.length; i++) {
        const item = organic[i];
        const itemLink = (item.link || '').toLowerCase();
        
        // Serper returns absolute position in 'position' field
        const absoluteRank = item.position || (i + 1 + ((page - 1) * 100));

        // SUPER ROBUST MATCHING (Matches domain, brand, or even snippets)
        const brandName = cleanTargetDomain.split('.')[0] || '';
        const isMatch = itemLink.includes(cleanTargetDomain) || (brandName.length > 4 && itemLink.includes(brandName));

        if (isMatch) {
          result.organicRank = absoluteRank;
          result.foundUrl = item.link;
          foundOrganic = true;
          console.log(`[Serper] 🎯 ORGANIC HIT! Rank ${absoluteRank} for "${cleanTargetDomain}"`);
          break;
        }
      }
      if (organic.length < 50) break; 
    }

    // 2. Maps Mapping
    if (!options.skipMaps && (businessName || targetUrl)) {
      console.log(`[Serper] Checking Maps...`);
      const placesRes = await axios.post('https://google.serper.dev/places', {
        q: keyword,
        gl: region || 'au',
        location: finalLocation || '',
        uule: uule || ''
      }, {
        headers: { 'X-API-KEY': apiKey || '', 'Content-Type': 'application/json' }
      });

      const places = placesRes.data.places || [];
      const shortTitle = businessName ? businessName.toLowerCase().split(' ')[0] : '';

      for (let i = 0; i < places.length; i++) {
        const p = places[i];
        const pTitle = (p.title || '').toLowerCase();
        const pWeb = (p.website || '').toLowerCase();

        const match = (businessName && pTitle.includes(businessName.toLowerCase())) ||
                    (shortTitle && pTitle.includes(shortTitle)) ||
                    (cleanTargetDomain && pWeb.includes(cleanTargetDomain));

        if (match) {
          result.mapsRank = i + 1;
          if (!result.foundUrl) result.foundUrl = p.website;
          console.log(`[Serper] 📍 MAPS HIT! Rank ${result.mapsRank}`);
          break;
        }
      }
    }

    console.log(`[Serper] Final Result:`, result);
    return result;
  } catch (err: any) {
    if (err.response?.status === 403 || err.response?.data?.message?.includes('credit')) {
      const QUOTA_MSG = `❌ [Serper] API QUOTA EXCEEDED! Please check your dashboard credit limit.`;
      console.error(QUOTA_MSG);
      fs.appendFileSync(path.join(process.cwd(), 'debug_scan_audit.log'), `${QUOTA_MSG}\n`);
      return { ...result, error: 'QUOTA_EXCEEDED' };
    } else {
      console.error('[Serper] Error:', err.message);
    }
    return result;
  }
};

/**
 * Main Scraper Function (Strictly Puppeteer/Real Browser)
 * Note: Serper API is handled by hybridScrape. This function is for browser fallback.
 */
export const scrapeGoogleRank = async (options: ScrapeOptions, retryCount: number = 0) => {
  const ABS_LOG = path.join(process.cwd(), 'debug_scan_audit.log');
  fs.appendFileSync(ABS_LOG, `[Scraper-PUP] TRACE: Entering scrapeGoogleRank for "${options.keyword}"\n`);

  const { keyword, targetUrl, region, businessName, location, lat, lng, proxy } = options;
  
  let browser: any = null;
  try {
    fs.appendFileSync(ABS_LOG, `[Scraper-PUP] TRACE: Launching browser (Proxy: ${options.proxyUrl || 'None'})...\n`);
    
    const launchArgs = ['--no-sandbox', '--disable-setuid-sandbox'];
    let proxyAuth = null;

    if (options.proxyUrl) {
      try {
        // Handle http://user:pass@host:port format
        const url = new URL(options.proxyUrl);
        launchArgs.push(`--proxy-server=${url.protocol}//${url.host}`);
        if (url.username && url.password) {
          proxyAuth = { username: url.username, password: url.password };
        }
      } catch (e) {
        // Fallback for simple host:port
        launchArgs.push(`--proxy-server=${options.proxyUrl}`);
      }
    }

    browser = await (puppeteerExtra as any).launch({
      headless: true,
      userDataDir: BROWSER_DATA_DIR,
      args: launchArgs
    });
    fs.appendFileSync(ABS_LOG, `[Scraper-PUP] TRACE: Browser launched successfully.\n`);

    const page = await browser.newPage();
    
    // Authenticate proxy if needed
    if (proxyAuth) {
      await page.authenticate(proxyAuth);
      fs.appendFileSync(ABS_LOG, `[Scraper-PUP] TRACE: Proxy Authentication configured for ${proxyAuth.username}\n`);
    }
    
    // DEVICE EMULATION (MOBILE VS DESKTOP)
    if (options.device === 'mobile') {
      console.log(`[Puppeteer] 📱 Emulating Mobile Device (iPhone)...`);
      await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    } else {
      await page.setViewport({ width: 1280, height: 800 });
    }

    const uuleParam = location ? `&uule=${getUULE(location, region)}` : '';
    const tld = REGION_TO_TLD[region?.toLowerCase() || 'au'] || 'google.com';
    const regionParam = region ? `&gl=${region}` : '';


    if (lat && lng) {
      console.log(`[Puppeteer] 📍 SENSOR MODE ACTIVE: Setting Geolocation to ${lat}, ${lng}`);
      const context = browser.defaultBrowserContext();
      await context.overridePermissions(`https://www.${tld}`, ['geolocation']);
      await page.setGeolocation({ latitude: Number(lat), longitude: Number(lng), accuracy: 100 });
    }

    let finalResult = { organicRank: 0, mapsRank: 0, foundUrl: '' };

    // PAGE LOOP FOR PUPPETEER
    for (let pageNum = 1; pageNum <= 10; pageNum++) {
        if (finalResult.organicRank > 0) break;

        const start = (pageNum - 1) * 10;
        const searchUrl = `https://www.${tld}/search?q=${encodeURIComponent(keyword)}&start=${start}${regionParam}${uuleParam}`;
        
        const ABS_LOG = path.join(process.cwd(), 'debug_scan_audit.log');
        fs.appendFileSync(ABS_LOG, `[Puppeteer] Scanning Page ${pageNum} for "${keyword}"...\n`);
        fs.appendFileSync(ABS_LOG, `[Puppeteer] URL: ${searchUrl}\n`);
        
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });

        const bodyContent = await page.content();
        const $ = cheerio.load(bodyContent);

        // CHECK FOR CAPTCHA
        const bodyText = await page.evaluate(() => document.body.innerText);
        if (bodyText.includes('not a robot') || bodyText.includes('detected unusual traffic') || bodyText.includes('security check')) {
            console.warn(`[Scraper] CAPTCHA Detected on Page ${pageNum}! Opening interactive window...`);
            await browser.close();
            
            const interactiveBrowser = await (puppeteerExtra as any).launch({
                headless: false,
                userDataDir: BROWSER_DATA_DIR,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const interactivePage = await interactiveBrowser.newPage();
            await interactivePage.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 90000 });
            
            // Inject Visual Banner
            await interactivePage.evaluate(() => {
                const div = document.createElement('div');
                div.id = 'ranktracker-captcha-guide';
                div.style.cssText = 'background: #ff5722; color: white; padding: 15px; text-align: center; position: fixed; top: 0; left: 0; width: 100%; z-index: 2147483647; font-family: sans-serif; font-weight: bold; box-shadow: 0 2px 10px rgba(0,0,0,0.5);';
                div.innerHTML = '⚠️ CAPTCHA DETECTED: Please solve it to continue. <br/> <small>The browser will automatically resume once search results appear.</small>';
                document.body.appendChild(div);
                document.body.style.paddingTop = '60px';
            });

            console.log('--- PLEASE SOLVE CAPTCHA IN THE OPENED WINDOW ---');
            
            // Smart Polling Loop (Max 5 minutes)
            let solved = false;
            const startTime = Date.now();
            const MAX_WAIT = 5 * 60 * 1000; // 5 Minutes

            while (Date.now() - startTime < MAX_WAIT) {
                await wait(2000);
                const currentContent = await interactivePage.content();
                const $current = cheerio.load(currentContent);
                
                // Success Indicators: Presence of results container OR absence of captcha indicators
                const hasResults = $current('div.g, .tF2Cxc, #search, #res').length > 0;
                const stillHasCaptcha = currentContent.includes('not a robot') || currentContent.includes('detected unusual traffic');

                if (hasResults && !stillHasCaptcha) {
                    console.log('✅ CAPTCHA Solved or Bypassed! Resuming...');
                    solved = true;
                    break;
                }
            }

            if (!solved) {
                if (retryCount < 1) {
                    console.log(`⚠️ CAPTCHA solving timed out after 5 minutes. Initializing IP Cooldown (5 mins) for "${keyword}"...`);
                    fs.appendFileSync(ABS_LOG, `[Scraper-PUP] CAPTCHA Timeout for "${keyword}". Starting 5-min cooldown (Retry 1/1).\n`);
                    await interactiveBrowser.close();
                    
                    // COOLDOWN WAIT
                    await wait(5 * 60 * 1000); 
                    
                    console.log(`🔄 Cooldown finished. Retrying search for "${keyword}"...`);
                    return await scrapeGoogleRank(options, retryCount + 1);
                } else {
                    console.error(`❌ CAPTCHA solving timed out AGAIN for "${keyword}". Skipping to avoid potential IP ban.`);
                    fs.appendFileSync(ABS_LOG, `[Scraper-PUP] Final failure for "${keyword}" after retry.\n`);
                    await interactiveBrowser.close();
                    return { organicRank: 0, mapsRank: 0, foundUrl: '' };
                }
            }

            // Verify and process results for the current page
            const finalContent = await interactivePage.content();
            const $final = cheerio.load(finalContent);
            const res = await processOrganicResults($final, targetUrl, businessName, keyword, pageNum);
            
            if (res.organicRank > 0) {
                foundUrl = res.foundUrl;
                organicRank = res.organicRank;
                await interactiveBrowser.close();
                break;
            }
            
            await interactiveBrowser.close();
            continue; 
        }

        const res = await processOrganicResults($, targetUrl, businessName, keyword, pageNum);
        if (res.organicRank > 0) {
            finalResult = res;
            break;
        }
        
        if ($('div.g, .tF2Cxc').length === 0 && pageNum > 1) break;
    }

    return finalResult;

  } catch (error: any) {
    const ABS_LOG = path.join(process.cwd(), 'debug_scan_audit.log');
    fs.appendFileSync(ABS_LOG, `❌ [Scraper-PUP] CRITICAL ERROR for "${options.keyword}": ${error.message}\n${error.stack}\n`);
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('err_no_supported_proxies') || 
        msg.includes('err_tunnel_connection_failed') || 
        msg.includes('proxy authentication required') ||
        msg.includes('err_proxy_connection_failed')) {
        return { organicRank: 0, mapsRank: 0, foundUrl: '', error: 'PROXY_FAILURE' };
    }
    return { organicRank: 0, mapsRank: 0, foundUrl: '' };
  } finally {
    if (browser) await browser.close();
  }
};

// Helper to keep logic clean and robust
async function processOrganicResults($: any, targetUrl: string | undefined, businessName: string | undefined, keyword: string, pageNum: number = 1) {
    let organicRank = 0;
    let mapsRank = 0;
    let foundUrl = '';

    const organicResults: { link: string; title: string }[] = [];
    const ABS_LOG = path.join(process.cwd(), 'debug_scan_audit.log');
    
    // 1. DYNAMIC MATCHING CONFIG
    const cleanTarget = targetUrl ? targetUrl.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0] || '' : '';
    const brandFragment = cleanTarget.split('.')[0] || '';
    const formalBusinessName = businessName ? businessName.toLowerCase().trim() : '';

    // 2. GREEDY LINK EXTRACTION (Captures EVERYTHING that looks like an organic result)
    $('a').each((_i: any, el: any) => {
      let href = $(el).attr('href');
      if (!href) return;

      // Handle Relative Google Redirects
      if (href.startsWith('/url?q=')) {
        try {
          const urlObj = new URL('https://www.google.com' + href);
          const q = urlObj.searchParams.get('q');
          if (q) href = q;
        } catch (e) {}
      }

      if (!href.startsWith('http')) return;
      
      // Strict filter for system/social noise (but keep candidate links)
      if (href.includes('google.com') || href.includes('gstatic.com') || href.includes('youtube.com') || 
          href.includes('facebook.com') || href.includes('instagram.com') || href.includes('linkedin.com')) return;
      
      const title = $(el).find('h3, .lc20lb').text().trim() || $(el).text().trim();
      const inContainer = $(el).closest('div.g, .tF2Cxc, .MjjYud, .v55uic, .g.mnr-c, .kvH3mc').length > 0;
      
      // If it's in a container OR has a real title, it's a candidate
      if ((title || inContainer) && !organicResults.some(r => r.link === href)) {
        organicResults.push({ link: href, title });
      }
    });

    if (organicResults.length > 0) {
        fs.appendFileSync(ABS_LOG, `[Scraper-PUP] Page ${pageNum}: Extracted ${organicResults.length} candidate results.\n`);
    }

    // 3. MULTI-STAGE MATCHING (Mirroring human intelligence)
    if (cleanTarget) {
      const foundIdx = organicResults.findIndex(res => {
        const link = res.link.toLowerCase();
        const title = res.title.toLowerCase();

        // Stage A: Domain Match (Direct)
        const domainMatch = link.includes(cleanTarget);
        
        // Stage B: Brand Fragment Match (e.g., 'are-corp' in URL)
        const fragmentMatch = brandFragment.length > 3 && link.includes(brandFragment);

        // Stage C: Title-Level Brand Match (e.g., 'Are Corp' in result title)
        const titleMatch = formalBusinessName.length > 3 && title.includes(formalBusinessName);

        const isHit = domainMatch || fragmentMatch || titleMatch;

        if (isHit) {
            fs.appendFileSync(ABS_LOG, `[Parser-PUP] 🎯 HIT! Matched "${link}" (Title: "${title}")\n`);
            fs.appendFileSync(ABS_LOG, `   Rationale: Domain:${domainMatch}, Fragment:${fragmentMatch}, Title:${titleMatch}\n`);
        }
        return isHit;
      });

      if (foundIdx !== -1) {
          organicRank = (pageNum - 1) * 10 + (foundIdx + 1);
          foundUrl = organicResults[foundIdx].link || '';
      }
    }

    return { organicRank, mapsRank, foundUrl };
}

/**
 * Scrapingdog API Scraper
 */
export const scrapeScrapingdog = async (options: ScrapeOptions) => {
  if (!options.scrapingdogApiKey) return { organicRank: 0, mapsRank: 0, foundUrl: '' };

  const cleanTarget = (url: string) => {
    if (!url) return '';
    return url.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0] || '';
  };

  try {
    const targetDomain = cleanTarget(options.targetUrl);
    // Scrapingdog typically returns 10 results. For 100 results, we'd need to loop,
    // but for fallback, we'll check the first 10-20.
    const url = `https://api.scrapingdog.com/google?api_key=${options.scrapingdogApiKey}&query=${encodeURIComponent(options.keyword)}&gl=${options.region || 'au'}&num=20`;
    const res = await axios.get(url);
    const results = res.data.organic_results || [];

    for (const item of results) {
      if ((item.link || '').toLowerCase().includes(targetDomain)) {
        return { 
          organicRank: item.position || 0, 
          mapsRank: 0, 
          foundUrl: item.link, 
          source: 'Scrapingdog' 
        };
      }
    }
    return { organicRank: 0, mapsRank: 0, foundUrl: '' };
  } catch (error: any) {
    console.error('[Scrapingdog] Error:', error.message);
    const errStatus = error.response?.status;
    if (errStatus === 401 || errStatus === 403 || errStatus === 429) {
      return { organicRank: 0, mapsRank: 0, foundUrl: '', error: 'SDOG_QUOTA_EXCEEDED' };
    }
    return { organicRank: 0, mapsRank: 0, foundUrl: '' };
  }
};

/**
 * SerpApi Scraper
 */
export const scrapeSerpApi = async (options: ScrapeOptions) => {
  if (!options.serpapiKey) return { organicRank: 0, mapsRank: 0, foundUrl: '' };

  const cleanTarget = (url: string) => {
    if (!url) return '';
    return url.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0] || '';
  };

  try {
    const targetDomain = cleanTarget(options.targetUrl);
    const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(options.keyword)}&api_key=${options.serpapiKey}&gl=${options.region || 'au'}&num=20`;
    const res = await axios.get(url);
    const results = res.data.organic_results || [];

    for (const item of results) {
      if ((item.link || '').toLowerCase().includes(targetDomain)) {
        return { 
          organicRank: item.position || 0, 
          mapsRank: 0, 
          foundUrl: item.link, 
          source: 'SerpApi' 
        };
      }
    }
    return { organicRank: 0, mapsRank: 0, foundUrl: '' };
  } catch (error: any) {
    console.error('[SerpApi] Error:', error.message);
    const errStatus = error.response?.status;
    if (errStatus === 401 || errStatus === 403 || errStatus === 429) {
      return { organicRank: 0, mapsRank: 0, foundUrl: '', error: 'SERPAPI_QUOTA_EXCEEDED' };
    }
    return { organicRank: 0, mapsRank: 0, foundUrl: '' };
  }
};

/**
 * HYBRID SCRAPER: API Tiered Fallback → Puppeteer
 */
export const hybridScrape = async (options: ScrapeOptions & { strategy?: string, preferredApi?: string }) => {
    const ABS_LOG = path.join(process.cwd(), 'debug_scan_audit.log');
    fs.appendFileSync(ABS_LOG, `\n--- [HYBRID START] Keyword: "${options.keyword}" (Strategy: ${options.strategy || 'hybrid'}, Pref: ${options.preferredApi || 'hybrid'}) ---\n`);
    
    console.log(`\n🚀 [HYBRID] Starting scan for: "${options.keyword}" using Strategy: ${options.strategy || 'hybrid'} (Pref: ${options.preferredApi || 'hybrid'})`);

    const useApis = options.strategy !== 'browser_only';
    let accumulatedErrors: string[] = [];
    const pref = options.preferredApi || 'hybrid';

    // 1. Try Serper API
    if (useApis && options.apiKey && (pref === 'hybrid' || pref === 'serper')) {
      const serperRes: any = await scrapeSerperRank(options);
      if (serperRes.error) accumulatedErrors.push(serperRes.error);
      if (serperRes.organicRank > 0 || (serperRes.mapsRank > 0 && options.skipOrganic)) {
          console.log(`✅ [HYBRID] Found via Serper API.`);
          return { ...serperRes, source: 'Serper', errors: accumulatedErrors };
      }
      if (pref === 'serper') return { organicRank: 0, mapsRank: 0, foundUrl: '', source: 'Serper (Miss)', errors: accumulatedErrors };
    }
    
    // 2. Try Scrapingdog
    if (useApis && options.scrapingdogApiKey && (pref === 'hybrid' || pref === 'scrapingdog')) {
      console.log(`🔄 [HYBRID] Trying Scrapingdog...`);
      const sdogRes: any = await scrapeScrapingdog(options);
      if (sdogRes.error) accumulatedErrors.push(sdogRes.error);
      if (sdogRes.organicRank > 0) {
          console.log(`✅ [HYBRID] Found via Scrapingdog.`);
          return { ...sdogRes, errors: accumulatedErrors };
      }
      if (pref === 'scrapingdog') return { organicRank: 0, mapsRank: 0, foundUrl: '', source: 'Scrapingdog (Miss)', errors: accumulatedErrors };
    }

    // 3. Try SerpApi
    if (useApis && options.serpapiKey && (pref === 'hybrid' || pref === 'serpapi')) {
      console.log(`🔄 [HYBRID] Trying SerpApi...`);
      const serpRes: any = await scrapeSerpApi(options);
      if (serpRes.error) accumulatedErrors.push(serpRes.error);
      if (serpRes.organicRank > 0) {
          console.log(`✅ [HYBRID] Found via SerpApi.`);
          return { ...serpRes, errors: accumulatedErrors };
      }
      if (pref === 'serpapi') return { organicRank: 0, mapsRank: 0, foundUrl: '', source: 'SerpApi (Miss)', errors: accumulatedErrors };
    }
 
    // NEW: API Only Mode - Strictly skip browser fallback
    if (options.strategy === 'api_only') {
      console.log(`⏹️ [HYBRID] Strategy is 'API Only'. Skipping browser fallback.`);
      fs.appendFileSync(ABS_LOG, `⏹️ Strategy is 'API Only'. Skipping browser fallback.\n`);
      return { organicRank: 0, mapsRank: 0, foundUrl: '', source: 'API (None)', errors: accumulatedErrors };
    }
    
    // 4. Fallback to Puppeteer (Real Browser)
    console.log(`⚠️ [HYBRID] ${useApis ? 'All APIs missed' : 'API phase skipped'}. Falling back to Real Browser...`);
    fs.appendFileSync(ABS_LOG, `⚠️ FALLBACK to Puppeteer triggered...\n`);
    
    const pupResult: any = await scrapeGoogleRank(options);
    if (pupResult.error) accumulatedErrors.push(pupResult.error);
    
    if (pupResult.organicRank > 0 || pupResult.mapsRank > 0) {
        console.log(`🎯 [HYBRID] Found via Real Browser.`);
        return { ...pupResult, source: 'Browser', errors: accumulatedErrors };
    }
    
    console.log(`❌ [HYBRID] No rank found even in Real Browser.`);
    return { ...pupResult, source: '', errors: accumulatedErrors };
};
