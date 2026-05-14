import https from 'https';

const data = JSON.stringify({
  q: 'business brokers australia',
  gl: 'au',
  num: 100
});

const options = {
  hostname: 'google.serper.dev',
  port: 443,
  path: '/search',
  method: 'POST',
  headers: {
    'X-API-KEY': '2eea1fe244ac36c3e615255abf212f88857385cd',
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (d) => body += d);
  res.on('end', () => {
    try {
      const json = JSON.parse(body);
      console.log('--- SERPER SEARCH RESULTS ---');
      console.log('Organic Results Count:', json.organic ? json.organic.length : 0);
      
      if (json.organic) {
        json.organic.forEach((r, i) => {
          if (r.link.includes('abbagroup.com.au')) {
            console.log(`FOUND at Rank ${i + 1}: ${r.link}`);
          } else if (i < 30) {
            console.log(`${i + 1}: ${r.link}`);
          }
        });
      }
    } catch (e) {
      console.error('Failed to parse:', e.message);
    }
  });
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
