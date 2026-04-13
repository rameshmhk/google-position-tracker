import { scrapeSerperRankDeep } from './src/services/scraperDeep.ts';
import fs from 'fs';

const db = JSON.parse(fs.readFileSync('./local_db.json', 'utf8'));

async function test() {
  console.log('--- STARTING CLEAN DEEP SCAN ---');
  const result = await scrapeSerperRankDeep({
    keyword: 'business brokers australia',
    targetUrl: 'abbagroup.com.au',
    region: 'au',
    businessName: 'Abba Group Business Brokers',
    apiKey: db.settings.globalSerperApiKey,
    skipMaps: true
  });
  
  console.log('--- FINAL CLEAN RESULT ---');
  console.log(JSON.stringify(result, null, 2));
}

test().catch(console.error);
