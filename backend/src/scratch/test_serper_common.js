import axios from 'axios';

const apiKey = '2eea1fe244ac36c3e615255abf212f88857385cd';

async function test() {
  const keyword = 'coffee';
  console.log(`Searching for "${keyword}"...`);
  
  try {
    const res = await axios.post('https://google.serper.dev/search', {
      q: keyword,
      gl: 'us',
      num: 100
    }, {
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' }
    });

    console.log(`Found ${res.data.organic ? res.data.organic.length : 0} results.`);
  } catch (err) {
    console.error(err.message);
  }
}

test();
