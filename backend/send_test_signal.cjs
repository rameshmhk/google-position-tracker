const axios = require('axios');

async function sendTestSignal() {
    try {
        const payload = {
            websiteUrl: 'https://rankinganywhere.com',
            exitPage: '/test-live-page',
            clientIp: '1.2.3.4',
            source: 'direct',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            sessionData: {
                resolution: '1920x1080',
                viewport: '1920x900'
            },
            pagesVisited: ['https://rankinganywhere.com/test-live-page']
        };

        console.log('Sending payload to http://localhost:5000/api/track-click...');
        const res = await axios.post('http://localhost:5000/api/track-click', payload);
        console.log('Response:', res.data);
    } catch (err) {
        console.error('Error:', err.response?.data || err.message);
    }
}

sendTestSignal();
