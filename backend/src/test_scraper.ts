import { scrapeGoogleRank } from './services/scraperService.js';
import { formatFullRank } from './utils/rankUtils.js';

const test = async () => {
  const keyword = 'business brokers australia';
  const targetUrl = 'abbagroup.com.au';
  const businessName = 'Abba Group';
  
  console.log(`Testing scraper for: ${keyword}`);
  try {
    const result = await scrapeGoogleRank({
      keyword,
      targetUrl,
      region: 'au',
      businessName
    });
    console.log('Scraper Result:', result);
    console.log('Formatted Rank:', formatFullRank(result.organicRank, result.mapsRank));
  } catch (err) {
    console.error('Test failed:', err);
  }
};

test();
