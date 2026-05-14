const axios = require('axios');
const fs = require('fs');
const path = require('path');

const apiKey = '2eea1fe244ac36c3e615255abf212f88857385cd';
const keyword = 'sell business sydney';

async function testIterativePages() {
  console.log(`\n--- TESTING ITERATIVE PAGES FOR "${keyword}" ---`);

  for (let p = 1; p <= 5; p++) {
    console.log(`\nChecking Page ${p}...`);
    try {
      const res = await axios.post('https://google.serper.dev/search', {
        q: keyword,
        gl: 'au',
        num: 10,
        page: p
      }, {
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' }
      });

      const organic = res.data.organic || [];
      console.log(`Found ${organic.length} results on Page ${p}`);
      
      organic.forEach((item, i) => {
        const pos = (p - 1) * 10 + (i + 1);
        const match = item.link.includes('abbagroup') ? '🎯 MATCH!!!' : '';
        console.log(`  [${pos}] ${item.title.substring(0, 50)}... (${item.link}) ${match}`);
      });

      if (organic.length === 0) break;

    } catch (err) {
      console.error(`Error on Page ${p}: ${err.message}`);
    }
  }
}

testIterativePages();
