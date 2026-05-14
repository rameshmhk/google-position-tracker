import axios from 'axios';
import { scrapeSerperRank } from '../src/services/scraperService.js';
import dotenv from 'dotenv';
dotenv.config();
const test = async () => {
    const options = {
        keyword: 'velux skylight installation melbourne',
        targetUrl: 'challengebricksandroofing.com.au',
        region: 'au',
        location: 'Clyde North, Victoria, Australia',
        apiKey: 'b5f48f7b8ca694c9dcf87e79c8a6dac8a4b1a334'
    };
    console.log('Running test with options:', options);
    const country = 'Australia';
    const finalLocation = 'Clyde North, Victoria, Australia';
    const UULE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    const key = UULE_CHARS[finalLocation.length] || 'A';
    const encoded = Buffer.from(finalLocation).toString('base64').replace(/=/g, '');
    const uule = `w+CAIQICI${key}${encoded}`;
    const check = async (label, payload) => {
        console.log(`\n--- ${label} ---`);
        try {
            const res = await axios.post('https://google.serper.dev/search', payload, {
                headers: { 'X-API-KEY': options.apiKey, 'Content-Type': 'application/json' }
            });
            const organic = res.data.organic || [];
            console.log(`Found ${organic.length} results.`);
            for (const item of organic) {
                if (item.link.includes('challengebricks')) {
                    console.log(`[MATCH] ${label} - Pos: ${item.position}, Link: ${item.link}`);
                }
            }
            if (organic.length > 0) {
                console.log(`Top link: ${organic[0].link}`);
            }
        }
        catch (e) {
            console.log(`Error: ${e.message}`);
        }
    };
    await check('WITH UULE', { q: options.keyword, gl: 'au', location: finalLocation, uule, num: 100 });
    await check('NO UULE', { q: options.keyword, gl: 'au', location: finalLocation, num: 100 });
    await check('NO LOCATION', { q: options.keyword, gl: 'au', num: 100 });
};
test();
//# sourceMappingURL=debug_scraper.js.map