
import axios from 'axios';

async function testDetectTech(domain) {
    console.log(`Testing detectTechStack for: ${domain}`);
    try {
        const url = `http://${domain}`;
        const start = Date.now();
        const response = await axios.get(url, { 
            timeout: 8000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        console.log(`Success in ${Date.now() - start}ms`);
    } catch (err) {
        console.log(`Error: ${err.message}`);
    }
}

testDetectTech('rankinganywhere.com');
