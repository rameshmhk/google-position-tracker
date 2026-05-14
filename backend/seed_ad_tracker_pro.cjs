require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const websites = ['rankinganywhere.com', 'localhost'];
const sources = ['google_ads', 'facebook_ads', 'direct', 'bing_ads'];
const devices = [
  { type: 'Mobile', browsers: ['Chrome', 'Safari'], os: ['Android', 'iOS'] },
  { type: 'Desktop', browsers: ['Chrome', 'Firefox', 'Edge', 'Safari'], os: ['Windows', 'Mac OS', 'Linux'] },
  { type: 'Tablet', browsers: ['Safari', 'Chrome'], os: ['iOS', 'Android'] }
];

const locations = [
  { city: 'Mumbai', country: 'India', lat: 19.0760, lon: 72.8777, isp: 'Reliance Jio' },
  { city: 'New York', country: 'United States', lat: 40.7128, lon: -74.0060, isp: 'Verizon Business' },
  { city: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278, isp: 'British Telecommunications' },
  { city: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093, isp: 'Telstra' },
  { city: 'Dubai', country: 'UAE', lat: 25.2048, lon: 55.2708, isp: 'Emirates Telecommunications' },
  { city: 'Frankfurt', country: 'Germany', lat: 50.1109, lon: 8.6821, isp: 'DigitalOcean' },
  { city: 'Delhi', country: 'India', lat: 28.6139, lon: 77.2090, isp: 'Airtel India' },
  { city: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198, isp: 'Singtel' }
];

const paths = ['/', '/services', '/pricing', '/contact', '/about', '/blog', '/free-check'];
const interactionActions = [
  'Clicked WhatsApp Button',
  'Submitted Contact Form',
  'Focused on Email Field',
  'Clicked Call Now',
  'Downloaded Guide',
  'Started Free Audit',
  'Added to Cart'
];

async function seed() {
  console.log('🚀 Starting Professional Data Injection...');
  
  const records = [];
  const now = new Date();

  const adContents = ['Search_Top_Ad', 'Side_Banner_Sales', 'FB_Retargeting_V1', 'Insta_Story_Promo', 'Google_Maps_Promoted'];
  const keywords = ['plumber in mumbai', 'emergency repair', 'best home services', 'professional plumbing'];
  const repeatIps = ['1.2.3.4', '5.6.7.8', '9.10.11.12'];

  for (let i = 0; i < 60; i++) {
    const loc = locations[Math.floor(Math.random() * locations.length)];
    const device = devices[Math.floor(Math.random() * devices.length)];
    const browser = device.browsers[Math.floor(Math.random() * device.browsers.length)];
    const os = device.os[Math.floor(Math.random() * device.os.length)];
    
    const isSuspicious = Math.random() > 0.92;
    const isConversion = !isSuspicious && Math.random() > 0.7;
    const addedToCart = !isSuspicious && (isConversion || Math.random() > 0.6);
    const highInterest = !isSuspicious && (addedToCart || Math.random() > 0.5);
    
    const timeOnSite = isSuspicious ? Math.floor(Math.random() * 5) : Math.floor(Math.random() * 600) + 30;
    const clickedAt = new Date(now.getTime() - Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000));
    
    const pages = ['/'];
    if (highInterest) {
      pages.push(paths[1], paths[2], paths[3]);
    } else {
      pages.push(paths[Math.floor(Math.random() * 2) + 1]);
    }
    
    const actions = [];
    if (addedToCart) actions.push('Added to Cart');
    if (isConversion) {
      actions.push('Submitted Contact Form');
      actions.push('Verified Payment');
    }

    // Simulate some repeat visitors (Gold Users)
    let ipAddress = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    let isReturning = false;
    let visitCount = 1;

    if (Math.random() > 0.75) {
      ipAddress = repeatIps[Math.floor(Math.random() * repeatIps.length)];
      isReturning = true;
      visitCount = Math.floor(Math.random() * 8) + 2;
    }

    records.push({
      websiteUrl: 'localhost',
      ipAddress,
      userAgent: `Mozilla/5.0 (${os}; ${browser})`,
      deviceType: device.type,
      browser,
      os,
      source: Math.random() > 0.4 ? 'google_ads' : sources[Math.floor(Math.random() * sources.length)],
      isSuspicious,
      suspicionReason: isSuspicious ? 'Bot Behavior Detected' : null,
      clickedAt,
      formInteracted: isConversion,
      revenue: isConversion ? Math.floor(Math.random() * 400) + 50 : 0,
      orderId: isConversion ? `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : null,
      timeOnSite,
      pageLoadTime: Math.floor(Math.random() * 1200) + 200,
      isp: loc.isp,
      city: loc.city,
      country: loc.country,
      lat: loc.lat,
      lon: loc.lon,
      pagesVisited: JSON.stringify(pages),
      exitPage: pages[pages.length - 1],
      actions: actions.length > 0 ? JSON.stringify(actions) : null,
      adContent: adContents[Math.floor(Math.random() * adContents.length)],
      keyword: keywords[Math.floor(Math.random() * keywords.length)],
      isReturning,
      visitCount
    });
  }

  // Insert in batch
  await prisma.adClick.createMany({
    data: records
  });

  console.log(`✅ Successfully injected ${records.length} professional demo records!`);
}

seed()
  .catch(e => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
