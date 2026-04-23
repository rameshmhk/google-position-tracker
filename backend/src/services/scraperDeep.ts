import axios from 'axios';
import { REGION_TO_COUNTRY } from './scraperService.js';

export interface ScrapeOptions {
  keyword: string;
  targetUrl: string;
  region?: string;
  businessName?: string;
  location?: string;
  apiKey?: string;
  skipMaps?: boolean;
}

export const scrapeSerperRankDeep = async (options: ScrapeOptions) => {
  const { keyword, targetUrl, region, businessName, location, apiKey } = options;
  const result = { organicRank: 0, mapsRank: 0, foundUrl: '' };
  
  try {
    const cleanTargetDomain = (targetUrl || '').toString().toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .split('/')[0]
      ?.split('?')[0]
      ?.trim() || '';
      
    console.log(`[DeepScraper] Targeting: "${cleanTargetDomain}" for Keyword: "${keyword}"`);

    // SMART LOCATION LOGIC: Skip country name (case-insensitive) for organic broad searches 
    const rawLoc = (location || '').toLowerCase().trim();
    const country = REGION_TO_COUNTRY[region?.toLowerCase() || 'au'] || 'Australia';
    const useLocation = (rawLoc === country.toLowerCase()) ? '' : (location || '');

    // 1. Organic Mapping (Pages 1-3)
    let foundOrganic = false;
    for (let page = 1; page <= 3; page++) {
      if (foundOrganic) break;
      
      console.log(`[DeepScraper] Scanning Page ${page}...`);
      const searchRes = await axios.post('https://google.serper.dev/search', {
        q: keyword,
        gl: region || 'au',
        location: useLocation,
        num: 100,
        page: page
      }, {
        headers: { 'X-API-KEY': apiKey || '', 'Content-Type': 'application/json' }
      });

      const organic = searchRes.data.organic || [];
      for (let i = 0; i < organic.length; i++) {
        const item = organic[i];
        const itemLink = (item.link || '').toLowerCase();
        
        const absoluteRank = item.position || (i + 1 + ((page - 1) * 10));

        // HYPER FLEXIBLE MATCHING
        if (itemLink.includes(cleanTargetDomain)) {
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
        location: location || ''
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
