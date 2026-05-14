const { hybridScrape } = require('./src/services/scraperService.js');
const fs = require('fs');

async function test() {
    console.log("--- STARTING HYBRID TEST ---");
    const options = {
        keyword: 'sell business sydney',
        targetUrl: 'abbagroup.com.au',
        region: 'au',
        location: 'sydney',
        apiKey: '2eea1fe244ac36c3e615255abf212f88857385cd'
    };

    try {
        const res = await hybridScrape(options);
        console.log("FINAL RESULT:", res);
    } catch (e) {
        console.error("TEST FAILED:", e);
    }
}

test();
