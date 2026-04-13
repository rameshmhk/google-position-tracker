const axios = require('axios');
const fs = require('fs');
const path = require('path');

const apiKey = '2eea1fe244ac36c3e615255abf212f88857385cd';
const keyword = 'sell business sydney';
const location = 'sydney';

async function debugSerper() {
  console.log(`\n--- DEBUGGING SERPER RAW DATA ---`);
  console.log(`Keyword: ${keyword}`);
  console.log(`Location: ${location}`);

  try {
    const response = await axios.post('https://google.serper.dev/search', {
      q: keyword,
      gl: 'au',
      location: location,
      num: 100
    }, {
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' }
    });

    const filePath = path.join(__dirname, 'serper_raw_response.json');
    fs.writeFileSync(filePath, JSON.stringify(response.data, null, 2));
    console.log(`✅ Raw data saved to: ${filePath}`);

    const organic = response.data.organic || [];
    console.log(`Total Organic Results: ${organic.length}`);

    const match = organic.find(item => item.link.includes('abbagroup'));
    if (match) {
      console.log(`🎯 MATCH FOUND in API!`);
      console.log(`Link: ${match.link}`);
      console.log(`Position: ${match.position}`);
    } else {
      console.log(`❌ NO MATCH FOUND in first 100 organic results from API.`);
      
      // Look in other arrays just in case
      ['peopleAlsoAsk', 'relatedSearches', 'sitelinks'].forEach(key => {
        if (response.data[key]) {
           console.log(`Checking ${key}...`);
           const subMatch = JSON.stringify(response.data[key]).includes('abbagroup');
           if (subMatch) console.log(`!!! Found mention in ${key}`);
        }
      });
    }

  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

debugSerper();
