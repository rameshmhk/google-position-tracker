
import dns from 'dns';
import axios from 'axios';

async function testResolution(domain) {
    console.log(`Testing resolution for: ${domain}`);
    let targetIp = null;

    // Stage 1: Standard Lookup
    try {
        const lookup = await dns.promises.lookup(domain, { family: 4 });
        console.log(`Standard lookup success: ${lookup.address}`);
        targetIp = lookup.address;
    } catch (e) {
        console.log(`Standard lookup failed: ${e.message}`);
        
        // Stage 2: DNS Resolve4 Fallback
        try {
            console.log('Trying DNS Resolve4 Fallback...');
            const addresses = await dns.promises.resolve4(domain);
            if (addresses && addresses.length > 0) {
                targetIp = addresses[0];
                console.log(`Resolve4 success: ${targetIp}`);
            }
        } catch (e2) {
            console.log(`Resolve4 failed: ${e2.message}`);
            
            // Stage 3: Google DNS Fallback
            try {
                console.log('Trying Google DNS Fallback...');
                const gDns = await axios.get(`https://dns.google/resolve?name=${domain}&type=A`, { timeout: 4000 });
                const aRecord = gDns.data?.Answer?.find((ans) => ans.type === 1);
                if (aRecord) {
                    targetIp = aRecord.data;
                    console.log(`Google DNS success: ${targetIp}`);
                }
            } catch (e3) {
                console.log(`Google DNS failed: ${e3.message}`);
            }
        }
    }

    if (targetIp) {
        console.log(`IP found: ${targetIp}. Fetching Geo info...`);
        
        // Try Primary Geo API: ipwho.is
        try {
            console.log(`Testing ipwho.is for: ${targetIp}`);
            const ipRes = await axios.get(`https://ipwho.is/${targetIp}`, { timeout: 6000 });
            if (ipRes.data && ipRes.data.success !== false) {
                console.log('ipwho.is Success:', ipRes.data.connection?.isp);
            } else {
                console.log('ipwho.is returned failure. Trying fallback...');
                throw new Error('ipwho.is failure');
            }
        } catch (e) {
            // Try Fallback Geo API: ip-api.com
            try {
                console.log(`Testing ip-api.com for: ${targetIp}`);
                const fallbackRes = await axios.get(`http://ip-api.com/json/${targetIp}`, { timeout: 6000 });
                if (fallbackRes.data && fallbackRes.data.status === 'success') {
                    console.log('ip-api.com Success:', fallbackRes.data.isp);
                } else {
                    console.log('ip-api.com returned failure.');
                }
            } catch (e2) {
                console.log(`ip-api.com failed: ${e2.message}`);
            }
        }
    } else {
        console.log('Could not determine IP address.');
    }
}

testResolution('rankinganywhere.com');
