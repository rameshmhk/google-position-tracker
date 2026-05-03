chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.type === 'PERFORM_HIDDEN_SCRAPE') {
        const { url, targetDomain } = message;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // 1. Detect Organic Rank
            const organicRank = findOrganicRank(doc, targetDomain);
            
            // 2. Detect Maps Rank (Local Pack)
            const mapsRank = findMapsRank(doc, targetDomain);
            
            const isCaptcha = html.includes('system/captcha') || html.includes('google.com/sorry');
            
            chrome.runtime.sendMessage({
                type: 'SCRAPE_RESULT',
                rank: organicRank,
                mapsRank: mapsRank,
                status: isCaptcha ? 'CAPTCHA' : 'SUCCESS'
            });
        } catch (error) {
            chrome.runtime.sendMessage({ type: 'SCRAPE_RESULT', error: error.message });
        }
    }
});

function findOrganicRank(doc, targetDomain) {
    const cleanDomain = targetDomain.replace(/https?:\/\//, '').replace('www.', '').split('/')[0].toLowerCase();
    const results = doc.querySelectorAll('.g'); // Standard Google organic result class
    
    for (let i = 0; i < results.length; i++) {
        if (results[i].textContent.toLowerCase().includes(cleanDomain)) {
            return i + 1;
        }
    }
    return 0;
}

function findMapsRank(doc, targetDomain) {
    const cleanDomain = targetDomain.replace(/https?:\/\//, '').replace('www.', '').split('/')[0].toLowerCase();
    // Maps results usually have specific classes like .Vkpbee or link to the domain
    const mapBlocks = doc.querySelectorAll('.Vkpbee, .dbg0pd, [data-cid]');
    
    for (let i = 0; i < mapBlocks.length; i++) {
        if (mapBlocks[i].textContent.toLowerCase().includes(cleanDomain)) {
            return i + 1;
        }
    }
    return 0;
}
