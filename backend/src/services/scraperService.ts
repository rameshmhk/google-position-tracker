import { addExtra } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const puppeteerExtra = addExtra(puppeteer as any);
puppeteerExtra.use(StealthPlugin());

interface ScrapeOptions {
  keyword: string;
  targetUrl: string;
  region?: string;
  businessName?: string;
  location?: string; // City name or area
  lat?: number;
  lng?: number;
  proxy?: string;
  apiKey?: string; // Serper.dev API Key
  scrapingdogApiKey?: string;
  serpapiKey?: string;
  skipMaps?: boolean;
  skipOrganic?: boolean;
}

const BROWSER_DATA_DIR = path.join(process.cwd(), 'browser_data');

const UULE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

const getUULE = (location: string): string => {
  // Use location as provided, assume it's a valid city/regin in Australia
  const canonical = location.toLowerCase().includes('australia') ? location : `${location},Australia`;
  const length = canonical.length;
  const key = UULE_CHARS[length] || 'A';
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
      const rawLocation = (r.options.location || '').toLowerCase().trim();
      const useLocation = (rawLocation === 'australia') ? '' : (r.options.location || '');
      
      // LOG COORDINATES IF PRESENT
      if (r.options.lat || r.options.lng) {
        console.log(`[Batch-GPS] Keyword "${r.keyword}" has coordinates: ${r.options.lat}, ${r.options.lng}. These will be used in Browser Fallback if needed.`);
      }

      return {
        q: r.keyword,
        gl: r.options.region || 'au',
        location: useLocation,
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
          const resLink = (res.link || '').toLowerCase();
          const isMatch = resLink.includes(targetDomain) || (targetDomain.includes('.') && resLink.includes(targetDomain.split('.')[0] || ''));

          if (isMatch) {
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

      // 2. Deep Recovery Loop (Pages 2 to 10)
      // If Page 1 returned exactly 10 but we asked for 100, or if not found, we scan iteratively
      if (!item.found) {
        console.log(`\n⚠️ [DASHBOARD] NO MATCH for "${item.keyword}" in first wave. Retrying iterative Deep Scan...`);
        
        // Start from page 2. Since Page 1 might have only given 10 results, we check 11 onwards.
        for (let p = 2; p <= 10; p++) {
          if (item.found) break;
          try {
            const rawLoc = (item.options.location || '').toLowerCase().trim();
            const useLoc = (rawLoc === 'australia') ? '' : item.options.location;

            // Use num: 10 for iterative scan to be safe and consistent
            const deepRes = await axios.post('https://google.serper.dev/search', {
              q: item.keyword,
              gl: item.options?.region || 'au',
              location: useLoc || '',
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
              const drLink = (dr.link || '').toLowerCase();
              
              // DEBUG: Log every link checked in deep scan
              console.log(`[DeepScan-Debug] Page ${p} Pos ${di + 1}: Checking "${drLink}" against "${targetDomain}"`);
              
              const drMatch = drLink.includes(targetDomain) || (targetDomain.includes('.') && drLink.includes(targetDomain.split('.')[0] || ''));

              if (drMatch) {
                // FORCE ABSOLUTE CALCULATION: (Position on page) + (Previous pages * 10)
                item.organicRank = (di + 1 + ((p - 1) * 10));
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
        fs.appendFileSync(ABS_LOG, `⚠ NO MATCH FOUND in Top 100 results for "${item.keyword}"\n`);
      }
    }

    // Phase 2: Maps Wave (No change needed)
    const pendingMaps = results.filter(r => !r.options.skipMaps && (r.options.businessName || r.options.targetUrl));
    if (pendingMaps.length > 0) {
      console.log(`[Batch] Maps Wave: Scanning ${pendingMaps.length} keywords...`);
      const mapsPayload = pendingMaps.map(r => ({
        q: r.keyword,
        gl: r.options.region || 'au',
        location: r.options.location || ''
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
      foundUrl: r.foundUrl
    }));

  } catch (err: any) {
    console.error('[Batch Scraper] Error:', err.message);
    return results.map(r => ({
      keyword: r.keyword,
      organicRank: r.organicRank,
      mapsRank: r.mapsRank,
      foundUrl: r.foundUrl
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
    
    console.log(`[Serper] Analyzing: "${cleanTargetDomain}" for Keyword: "${keyword}"`);

    // 1. Organic Mapping (Pages 1-3)
    let foundOrganic = false;
    for (let page = 1; page <= 3; page++) {
      if (foundOrganic) break;
      
      console.log(`[Serper] Scanning Page ${page}...`);
      const searchRes = await axios.post('https://google.serper.dev/search', {
        q: keyword,
        gl: region || 'au',
        location: location || '',
        num: 100,
        page: page
      }, {
        headers: { 'X-API-KEY': apiKey || '', 'Content-Type': 'application/json' }
      });

      const organic = searchRes.data.organic || [];
      for (let i = 0; i < organic.length; i++) {
        const item = organic[i];
        const itemLink = (item.link || '').toLowerCase();
        
        const itemPos = item.position || (i + 1);
        const absoluteRank = itemPos + ((page - 1) * 10);

        // HYPER FLEXIBLE MATCHING
        if (itemLink.includes(cleanTargetDomain)) {
          result.organicRank = absoluteRank;
          result.foundUrl = item.link; // CAPTURE THE FULL EXACT URL
          foundOrganic = true;
          console.log(`[Serper] 🎯 ORGANIC HIT! Rank ${absoluteRank}`);
          break;
        }
      }
      if (organic.length < 5) break; 
    }

    // 2. Maps Mapping
    if (!options.skipMaps && (businessName || targetUrl)) {
      console.log(`[Serper] Checking Maps...`);
      const placesRes = await axios.post('https://google.serper.dev/places', {
        q: keyword,
        gl: region || 'au',
        location: location || ''
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
    console.error('[Serper] Error:', err.message);
    return result;
  }
};

/**
 * Main Scraper Function (Dual-Mode)
 */
export const scrapeGoogleRank = async (options: ScrapeOptions) => {
  // If API Key is provided, use Serper.dev (Much more reliable & faster)
  if (options.apiKey) {
    try {
      return await scrapeSerperRank(options);
    } catch (err) {
      console.warn('[Scraper] Serper API failed, falling back to Puppeteer...');
    }
  }

  const { keyword, targetUrl, region, businessName, location, lat, lng, proxy } = options;
  
  const browser = await (puppeteerExtra as any).launch({
    headless: true,
    userDataDir: BROWSER_DATA_DIR,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      proxy ? `--proxy-server=${proxy}` : ''
    ].filter(Boolean)
  });

  try {
    const page = await browser.newPage();
    
    await page.setViewport({
      width: 1280 + Math.floor(Math.random() * 100),
      height: 800 + Math.floor(Math.random() * 100),
      deviceScaleFactor: 1,
    });

    const ua = (USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)] || USER_AGENTS[0]) as string;
    await page.setUserAgent(ua);

    const tld = region === 'au' ? 'google.com.au' : 'google.com';
    const regionParam = region ? `&gl=${region}` : '';
    let uuleParam = '';
    if (location) {
      const uule = getUULE(location);
      uuleParam = `&uule=${uule}`;
    }

    if (lat && lng) {
      console.log(`[Puppeteer] Setting Geolocation: ${lat}, ${lng}`);
      await page.setGeolocation({ latitude: Number(lat), longitude: Number(lng) });
      const context = browser.defaultBrowserContext();
      await context.overridePermissions(`https://www.${tld}`, ['geolocation']);
    }

    let finalResult = { organicRank: 0, mapsRank: 0, foundUrl: '' };

    // PAGE LOOP FOR PUPPETEER
    for (let pageNum = 1; pageNum <= 10; pageNum++) {
        if (finalResult.organicRank > 0) break;

        const start = (pageNum - 1) * 10;
        const searchUrl = `https://www.${tld}/search?q=${encodeURIComponent(keyword)}&start=${start}${regionParam}${uuleParam}`;
        
        console.log(`[Puppeteer] Scanning Page ${pageNum}...`);
        console.log(`[Puppeteer] URL: ${searchUrl}`);
        
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
                console.error('❌ CAPTCHA solving timed out after 5 minutes.');
                await interactiveBrowser.close();
                return { organicRank: 0, mapsRank: 0, foundUrl: '' };
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

  } catch (error) {
    console.error('Scraping Error:', error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
};

// Helper to keep logic clean and robust
async function processOrganicResults($: any, targetUrl: string | undefined, businessName: string | undefined, keyword: string, pageNum: number = 1) {
    let organicRank = 0;
    let mapsRank = 0;
    let foundUrl = '';

    const organicResults: string[] = [];
    
    // Broadest possible selector to avoid missing items
    $('a[href^="http"]').each((_i: any, el: any) => {
      const href = $(el).attr('href');
      if (!href) return;
      
      if (href.includes('google.com') || href.includes('gstatic.com') || href.includes('youtube.com') || href.includes('facebook.com')) return;
      
      const hasTitle = $(el).find('h3').length > 0 || $(el).closest('div.g, .tF2Cxc, .BYM6Wc').length > 0;
      
      if (hasTitle && !organicResults.includes(href)) {
        organicResults.push(href);
      }
    });

    if (targetUrl) {
      const cleanTarget = targetUrl.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0] || '';
      const brandName = cleanTarget.split('.')[0] || '';

      const foundIdx = organicResults.findIndex(link => {
        const cleanLink = link.toLowerCase();
        return cleanLink.includes(cleanTarget) || (brandName.length > 3 && cleanLink.includes(brandName));
      });

      if (foundIdx !== -1) {
          organicRank = (pageNum - 1) * 10 + (foundIdx + 1);
          foundUrl = organicResults[foundIdx] || '';
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
  } catch (error) {
    console.error('[Scrapingdog] Error:', error);
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
  } catch (error) {
    console.error('[SerpApi] Error:', error);
    return { organicRank: 0, mapsRank: 0, foundUrl: '' };
  }
};

/**
 * HYBRID SCRAPER: API Tiered Fallback → Puppeteer
 */
export const hybridScrape = async (options: ScrapeOptions & { strategy?: string }) => {
    const ABS_LOG = 'C:\\Users\\natas\\OneDrive\\Desktop\\Google Position Tracter\\backend\\debug_scan_audit.log';
    fs.appendFileSync(ABS_LOG, `\n--- [HYBRID START] Keyword: "${options.keyword}" ---\n`);
    
    console.log(`\n🚀 [HYBRID] Starting scan for: "${options.keyword}"`);

    // 1. Try Serper API (Primary)
    if (options.apiKey) {
      const serperRes = await scrapeSerperRank(options);
      if (serperRes.organicRank > 0 || (serperRes.mapsRank > 0 && options.skipOrganic)) {
          console.log(`✅ [HYBRID] Found via Serper API.`);
          return { ...serperRes, source: 'Serper' };
      }
    }
    
    // 2. Try Scrapingdog (Secondary)
    if (options.scrapingdogApiKey) {
      console.log(`🔄 [HYBRID] Serper missed. Trying Scrapingdog...`);
      const sdogRes = await scrapeScrapingdog(options);
      if (sdogRes.organicRank > 0) {
          console.log(`✅ [HYBRID] Found via Scrapingdog.`);
          return sdogRes;
      }
    }

    // 3. Try SerpApi (Tertiary)
    if (options.serpapiKey) {
      console.log(`🔄 [HYBRID] Scrapingdog missed. Trying SerpApi...`);
      const serpRes = await scrapeSerpApi(options);
      if (serpRes.organicRank > 0) {
          console.log(`✅ [HYBRID] Found via SerpApi.`);
          return serpRes;
      }
    }
    
    // 4. Fallback to Puppeteer (Real Browser)
    console.log(`⚠️ [HYBRID] All APIs missed. Falling back to Real Browser...`);
    fs.appendFileSync(ABS_LOG, `⚠️ FALLBACK to Puppeteer triggered...\n`);
    
    const pupResult = await scrapeGoogleRank(options);
    
    if (pupResult.organicRank > 0 || pupResult.mapsRank > 0) {
        console.log(`🎯 [HYBRID] Found via Real Browser.`);
        return { ...pupResult, source: 'Browser' };
    }
    
    console.log(`❌ [HYBRID] No rank found even in Real Browser.`);
    return { ...pupResult, source: 'None' };
};
