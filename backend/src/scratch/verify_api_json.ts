

import axios from 'axios';

async function testApi() {
    try {
        console.log('Fetching from localhost:5000...');
        const res = await axios.get('http://localhost:5000/api/whois/rankinganywhere.com');
        console.log('Keys in response:', Object.keys(res.data));
        console.log('Hosting object:', JSON.stringify(res.data.hosting, null, 2));
    } catch (e) {
        console.log('Error:', e.message);
    }
}

testApi();
