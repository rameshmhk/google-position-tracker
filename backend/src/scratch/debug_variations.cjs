const axios = require('axios');
const fs = require('fs');
const path = require('path');

const apiKey = '2eea1fe244ac36c3e615255abf212f88857385cd';
const keywords = [
  { text: 'sell business sydney', loc: 'sydney' },
  { text: 'sell your business', loc: 'Australia' }
];

async function testVariations() {
  console.log(`\n--- TESTING LOCATION VARIATIONS ---`);

  for (const kw of keywords) {
    console.log(`\nKeyword: "${kw.text}"`);
    
    // Test 1: With Location
    console.log(`1. With Location "${kw.loc}":`);
    const res1 = await axios.post('https://google.serper.dev/search', {
      q: kw.text, gl: 'au', location: kw.loc, num: 100
    }, { headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' } });
    console.log(`   Results: ${res1.data.organic?.length || 0}`);
    const match1 = (res1.data.organic || []).find(it => it.link.includes('abbagroup'));
    if (match1) console.log(`   🎯 FOUND at Pos ${match1.position}`); else console.log(`   ❌ NOT FOUND`);

    // Test 2: Without Location (Global AU)
    console.log(`2. Without Location (Global AU):`);
    const res2 = await axios.post('https://google.serper.dev/search', {
      q: kw.text, gl: 'au', num: 100
    }, { headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' } });
    console.log(`   Results: ${res2.data.organic?.length || 0}`);
    const match2 = (res2.data.organic || []).find(it => it.link.includes('abbagroup'));
    if (match2) console.log(`   🎯 FOUND at Pos ${match2.position}`); else console.log(`   ❌ NOT FOUND`);
    
    // Save the global results for inspection
    const fn = kw.text.replace(/ /g, '_') + '_global.json';
    fs.writeFileSync(path.join(__dirname, fn), JSON.stringify(res2.data, null, 2));
  }
}

testVariations();
