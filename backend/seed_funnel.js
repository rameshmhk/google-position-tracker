import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '.env') });
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
  { city: 'Delhi', country: 'India', lat: 28.6139, lon: 77.2090, isp: 'Airtel India' }
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
  console.log('🚀 Starting Funnel-Optimized Data Injection...');
  
  const records = [];
  const now = new Date();

  const adContents = ['Search_Top_Ad', 'Side_Banner_Sales', 'FB_Retargeting_V1', 'Insta_Story_Promo', 'Google_Maps_Promoted'];
  const keywords = ['plumber in mumbai', 'emergency repair', 'best home services', 'professional plumbing'];
  const repeatIps = ['1.2.3.4', '5.6.7.8', '9.10.11.12'];

  for (let i = 0; i < 75; i++) {
    const loc = locations[Math.floor(Math.random() * locations.length)];
    const device = devices[Math.floor(Math.random() * devices.length)];
    const browser = device.browsers[Math.floor(Math.random() * device.browsers.length)];
    const os = device.os[Math.floor(Math.random() * device.os.length)];
    
    const isSuspicious = Math.random() > 0.94;
    const isConversion = !isSuspicious && Math.random() > 0.75;
    const addedToCart = !isSuspicious && (isConversion || Math.random() > 0.65);
    const highInterest = !isSuspicious && (addedToCart || Math.random() > 0.55);
    
    const timeOnSite = isSuspicious ? Math.floor(Math.random() * 5) : Math.floor(Math.random() * 600) + 45;
    const clickedAt = new Date(now.getTime() - Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000));
    
    const pages = ['/'];
    if (highInterest) {
      pages.push(paths[1], paths[2], paths[Math.floor(Math.random() * 3) + 3]);
    } else {
      pages.push(paths[Math.floor(Math.random() * 2) + 1]);
    }
    
    const actions = [];
    if (addedToCart) actions.push('Added to Cart');
    if (isConversion) {
      actions.push('Submitted Contact Form');
      actions.push('Verified Payment');
    }

    let ipAddress = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    let isReturning = false;
    let visitCount = 1;

    if (Math.random() > 0.7) {
      ipAddress = repeatIps[Math.floor(Math.random() * repeatIps.length)];
      isReturning = true;
      visitCount = Math.floor(Math.random() * 10) + 2;
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
      revenue: isConversion ? Math.floor(Math.random() * 500) + 100 : 0,
      orderId: isConversion ? `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : null,
      timeOnSite,
      pageLoadTime: Math.floor(Math.random() * 1000) + 100,
      isp: loc.isp,
      city: loc.city,
      country: loc.country,
      lat: loc.lat,
      lon: loc.lon,
      pagesVisited: JSON.stringify(pages),
      exitPage: pages[pages.length - 1],
      actions: JSON.stringify(actions),
      adContent: adContents[Math.floor(Math.random() * adContents.length)],
      keyword: keywords[Math.floor(Math.random() * keywords.length)],
      isReturning,
      visitCount
    });
  }

  await prisma.adClick.createMany({
    data: records
  });

  console.log(`✅ Successfully injected ${records.length} deep funnel records!`);
}

seed()
  .catch(e => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
