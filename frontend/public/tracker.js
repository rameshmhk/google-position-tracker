(function() {
    // --- CONFIGURATION ---
    // Try to auto-detect the tracker server URL from the script src itself
    let detectedBase = 'https://rankinganywhere.com';
    const scripts = document.getElementsByTagName('script');
    for (let s of scripts) {
        if (s.src && s.src.includes('tracker.js')) {
            detectedBase = new URL(s.src).origin;
            break;
        }
    }

    const API_BASE = window.RA_TRACKER_URL ? window.RA_TRACKER_URL.replace('/api/track-click', '') : detectedBase;
    const TRACK_URL = `${API_BASE}/api/track-click`;
    const SYNC_URL = `${API_BASE}/api/session-events`;

    let currentClickId = null;
    let eventBuffer = [];
    let pagesVisited = [window.location.href];
    let startTime = Date.now();

    // --- DIGITAL DNA (FINGERPRINTING) ---
    function getFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const txt = 'RA-FORENSIC-1.0';
            ctx.textBaseline = "top";
            ctx.font = "14px 'Arial'";
            ctx.fillStyle = "#f60";
            ctx.fillRect(125,1,62,20);
            ctx.fillStyle = "#069";
            ctx.fillText(txt, 2, 15);
            
            const b64 = canvas.toDataURL();
            let hash = 0;
            for (let i = 0; i < b64.length; i++) {
                hash = (hash << 5) - hash + b64.charCodeAt(i);
                hash |= 0;
            }
            
            const fingerprint = [
                Math.abs(hash).toString(16),
                navigator.hardwareConcurrency || '4',
                window.screen.width + 'x' + window.screen.height,
                new Date().getTimezoneOffset(),
                navigator.language || 'en'
            ].join('-');
            
            console.log('>>> [RA] Digital DNA Generated:', fingerprint);
            return fingerprint;
        } catch (e) {
            console.warn('>>> [RA] Fingerprinting failed:', e);
            return 'fallback-' + Math.random().toString(36).substr(2, 9);
        }
    }

    // --- UTILS ---
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // --- CORE TRACKING ---
    async function startSession() {
        let clientIp = null;
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipRes.json();
            clientIp = ipData.ip;
        } catch (e) {}

        const payload = {
            websiteUrl: window.location.origin,
            source: determineSource(),
            userAgent: navigator.userAgent,
            exitPage: window.location.pathname,
            pagesVisited: pagesVisited,
            clientIp: clientIp, // Send discovered IP
            fingerprint: getFingerprint(), // Hardware Digital DNA
            sessionData: {
                resolution: `${window.screen.width}x${window.screen.height}`,
                viewport: `${window.innerWidth}x${window.innerHeight}`
            }
        };

        try {
            console.log('>>> [RA] Starting session...');
            const res = await fetch(TRACK_URL, {
                method: 'POST',
                mode: 'cors', // Explicitly request CORS
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                currentClickId = data.id;
                console.log('>>> [RA] Session started:', currentClickId);
            }
        } catch (e) { console.warn('>>> [RA] Failed to start session', e); }
    }

    async function syncEvents() {
        if (!currentClickId || eventBuffer.length === 0) return;
        const events = [...eventBuffer];
        eventBuffer = [];

        try {
            await fetch(SYNC_URL, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clickId: currentClickId, events }),
                keepalive: true
            });
        } catch (e) { 
            eventBuffer = [...events, ...eventBuffer]; // Put back on failure
        }
    }

    function determineSource() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('gclid')) return 'google_ads';
        if (document.referrer.includes('google.com')) return 'organic_google';
        return 'direct';
    }

    // --- LISTENERS ---
    function init() {
        startSession();
        setInterval(syncEvents, 3000);

        window.addEventListener('mousemove', throttle((e) => {
            eventBuffer.push({ type: 'move', x: e.pageX, y: e.pageY, ts: Date.now() });
        }, 200));

        window.addEventListener('scroll', throttle(() => {
            const scrollP = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
            eventBuffer.push({ type: 'scroll', scrollP, ts: Date.now() });
        }, 500));

        window.addEventListener('click', (e) => {
            const target = e.target;
            const clickInfo = {
                type: 'click',
                tag: target.tagName,
                text: target.innerText?.substring(0, 30),
                x: e.pageX,
                y: e.pageY,
                ts: Date.now()
            };
            eventBuffer.push(clickInfo);
            syncEvents(); // Sync immediately on click
        });

        window.addEventListener('submit', (e) => {
            eventBuffer.push({ type: 'submit', formId: e.target.id || 'unknown', ts: Date.now() });
            syncEvents();
        });
    }

    if (document.readyState === 'complete') init();
    else window.addEventListener('load', init);

})();
