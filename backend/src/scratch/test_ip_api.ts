
import axios from 'axios';

async function testIpApi(domain) {
    console.log(`Testing ip-api.com for: ${domain}`);
    try {
        const res = await axios.get(`http://ip-api.com/json/${domain}`, { timeout: 5000 });
        console.log('Response:', JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.log('Error:', e.message);
    }
}

testIpApi('rankinganywhere.com');
testIpApi('google.com');
