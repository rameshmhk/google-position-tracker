import axios from 'axios';
import fs from 'fs';

const apiKey = '2eea1fe244ac36c3e615255abf212f88857385cd';

async function test() {
  const keyword = 'sell business sydney';
  console.log(`Searching for "${keyword}"...`);
  
  try {
    const res = await axios.post('https://google.serper.dev/search', {
      q: keyword,
      gl: 'au',
      num: 100
    }, {
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' }
    });

    const organic = res.data.organic || [];
    console.log(`Found ${organic.length} results.`);
    
    const links = organic.map((r, i) => `${i + 1}: ${r.link}`);
    fs.writeFileSync('C:\\Users\\natas\\OneDrive\\Desktop\\Google Position Tracter\\backend\\all_links.txt', links.join('\n'));
    
    const match = organic.find(r => r.link.includes('abbagroup.com.au'));
    if (match) {
      console.log(`🎯 FOUND at Rank ${match.position || '?'}: ${match.link}`);
    } else {
      console.log('❌ NOT FOUND in top 100');
    }
  } catch (err) {
    console.error(err.message);
  }
}

test();
