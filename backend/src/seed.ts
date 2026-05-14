// @ts-nocheck
import 'dotenv/config';

async function seed() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  console.log('🚀 Seeding professional Ad Intelligence data...');

  const adContents = ['Search_Top_Ad', 'Side_Banner_Sales', 'FB_Retargeting_V1', 'Insta_Story_Promo', 'Google_Maps_Promoted'];
  const keywords = ['plumber in mumbai', 'emergency repair', 'best home services', 'professional plumbing'];
  const repeatIps = ['1.2.3.4', '5.6.7.8', '9.10.11.12'];
  const locations = [
    { city: 'Mumbai', country: 'India', lat: 19.0760, lon: 72.8777, isp: 'Reliance Jio' },
    { city: 'Delhi', country: 'India', lat: 28.6139, lon: 77.2090, isp: 'Airtel India' },
    { city: 'London', country: 'UK', lat: 51.5074, lon: -0.1278, isp: 'BT' }
  ];

  for (let i = 0; i < 50; i++) {
    const loc = locations[Math.floor(Math.random() * locations.length)];
    const isReturning = Math.random() > 0.7;
    const ipAddress = isReturning ? repeatIps[Math.floor(Math.random() * repeatIps.length)] : `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.1.1`;
    const visitCount = isReturning ? Math.floor(Math.random() * 5) + 2 : 1;

    await prisma.adClick.create({
      data: {
        websiteUrl: 'localhost',
        ipAddress,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0',
        deviceType: 'Desktop',
        browser: 'Chrome',
        os: 'Windows',
        source: 'google_ads',
        adContent: adContents[Math.floor(Math.random() * adContents.length)],
        keyword: keywords[Math.floor(Math.random() * keywords.length)],
        isReturning,
        visitCount,
        formInteracted: Math.random() > 0.6,
        timeOnSite: Math.floor(Math.random() * 300),
        isp: loc.isp,
        city: loc.city,
        country: loc.country,
        lat: loc.lat,
        lon: loc.lon,
        clickedAt: new Date(Date.now() - Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000)),
        pagesVisited: JSON.stringify(['/']),
        actions: JSON.stringify(['Landed on Site'])
      }
    });
  }

  console.log('✅ Success! 50 professional Ad Intelligence records seeded.');
  await prisma.$disconnect();
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
