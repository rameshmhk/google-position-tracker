
import axios from 'axios';

async function testWhois(domain) {
    console.log(`Testing RDAP for: ${domain}`);
    const servers = [
        `https://rdap.verisign.com/v1/domain/${domain}`,
        `https://rdap.org/domain/${domain}`
    ];

    for (const url of servers) {
        try {
            console.log(`Trying: ${url}`);
            const start = Date.now();
            const response = await axios.get(url, { 
                timeout: 5000,
                headers: { 'Accept': 'application/rdap+json' }
            });
            console.log(`Success from ${url} in ${Date.now() - start}ms`);
            return;
        } catch (err) {
            console.log(`Error from ${url}: ${err.message}`);
        }
    }
}

testWhois('rankinganywhere.com');
