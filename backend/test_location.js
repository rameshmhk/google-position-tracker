import { scrapeSerperBatch } from './src/services/scraperService.js';
import fs from 'fs';

const db = JSON.parse(fs.readFileSync('./local_db.json', 'utf8'));

async function testLocation() {
  const optionsNoLocation = {
    keyword: 'business brokers australia',
    targetUrl: 'abbagroup.com.au',
    region: 'au',
    apiKey: db.settings.globalSerperApiKey
  };

  const optionsWithLocation = {
    keyword: 'business brokers australia',
    targetUrl: 'abbagroup.com.au',
    region: 'au',
    location: 'Australia',
    apiKey: db.settings.globalSerperApiKey
  };

  console.log('--- TESTING LOCATION SENSITIVITY ---');
  
  try {
    console.log('Scan 1: No Location...');
    const res1 = await scrapeSerperBatch([optionsNoLocation]);
    console.log(`Result: Rank ${res1[0].organicRank}`);

    console.log('Scan 2: Location "Australia"...');
    const res2 = await scrapeSerperBatch([optionsWithLocation]);
    console.log(`Result: Rank ${res2[0].organicRank}`);
  } catch (err) {
    console.error('Test Error:', err.message);
  }
}

testLocation().catch(console.error);
