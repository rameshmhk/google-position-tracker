import axios from 'axios';
import { REGION_TO_COUNTRY } from './scraperService.js';

export interface ScrapeOptions {
  keyword: string;
  targetUrl: string;
  region?: string;
  businessName?: string;
  location?: string;
  lat?: number;
  lng?: number;
  apiKey?: string;
  skipMaps?: boolean;
}

export const scrapeSerperRankDeep = async (options: ScrapeOptions) => {
  const { keyword, targetUrl, region, businessName, location, lat, lng, apiKey } = options;
  const result = { organicRank: 0, mapsRank: 0, foundUrl: '' };
  
  try {
    const cleanTargetDomain = (targetUrl || '').toString().toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .split('/')[0]
      ?.split('?')[0]
      ?.replace(/\/$/, '')
      ?.trim() || '';
      
    console.log(`[DeepScraper] Targeting: "${cleanTargetDomain}" for Keyword: "${keyword}"`);

    // UULE CALCULATION (Exact Sync with Browser)
    const UULE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    const getUULE = (loc: string) => {
      const country = REGION_TO_COUNTRY[region?.toLowerCase() || 'au'] || 'Australia';
      const canonical = loc.toLowerCase().includes(country.toLowerCase()) ? loc : `${loc}, ${country}`;
      const key = UULE_CHARS[canonical.length] || 'A';
      const encoded = Buffer.from(canonical).toString('base64').replace(/=/g, '');
      return `w+CAIQICI${key}${encoded}`;
    };

    // SMART LOCATION LOGIC
    const useLocation = (location || '').toLowerCase().trim();
    const country = REGION_TO_COUNTRY[region?.toLowerCase() || 'au'] || 'Australia';
    const finalLocation = (useLocation && !useLocation.includes(',')) ? `${location}, ${country}` : (location || '');
    const uule = finalLocation ? getUULE(finalLocation) : '';

    const useLocParam = (useLocation === country.toLowerCase()) ? '' : finalLocation;

    // 1. Organic Mapping (Pages 1-10)
    let foundOrganic = false;
    for (let page = 1; page <= 10; page++) {
      if (foundOrganic) break;
      
      console.log(`[DeepScraper] Scanning Page ${page} (num: 10)...`);
      const searchRes = await axios.post('https://google.serper.dev/search', {
        q: keyword,
        gl: region || 'au',
        location: useLocParam,
        uule: uule, // SYNC PRECISION
        num: 10,
        page: page
      }, {
        headers: { 'X-API-KEY': apiKey || '', 'Content-Type': 'application/json' }
      });

      const organic = searchRes.data.organic || [];
      for (let i = 0; i < organic.length; i++) {
        const item = organic[i];
        const itemLink = (item.link || '').toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
        
        const absoluteRank = item.position || (i + 1 + ((page - 1) * 100));

        // HYPER FLEXIBLE MATCHING (Synced with main scraper)
        const brandName = cleanTargetDomain.split('.')[0] || '';
        const isMatch = itemLink.includes(cleanTargetDomain) || (brandName.length > 4 && itemLink.includes(brandName));

        if (isMatch) {
          result.organicRank = absoluteRank;
          result.foundUrl = item.link; 
          foundOrganic = true;
          console.log(`[Serper] 🎯 ORGANIC HIT! Rank ${absoluteRank}`);
          break;
        }
      }
      if (organic.length === 0) break; 
    }

    // 2. Maps Mapping
    if (!options.skipMaps && (businessName || targetUrl)) {
      console.log(`[DeepScraper] Checking Maps...`);
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
        if (!p) continue;
        const pTitle = (p.title || '').toLowerCase();
        const pWeb = (p.website || '').toLowerCase();

        const match = (businessName && pTitle.includes(businessName.toLowerCase())) ||
                    (shortTitle && pTitle.includes(shortTitle)) ||
                    (cleanTargetDomain && pWeb.includes(cleanTargetDomain));

        if (match) {
          result.mapsRank = i + 1;
          if (!result.foundUrl) result.foundUrl = p.website;
          console.log(`[DeepScraper] 📍 FOUND MAPS: Rank ${result.mapsRank}`);
          break;
        }
      }
    }

    console.log(`[DeepScraper] Final Result:`, result);
    return result;
  } catch (err: any) {
    console.error('[DeepScraper] Error:', err.message);
    return result;
  }
};
