require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function seed() {
  console.log('Seeding dummy tracking data...');

  // 1. Mobile Bouncer
  await prisma.adClick.create({
    data: {
      websiteUrl: 'localhost',
      ipAddress: '114.143.195.1', // Example Indian IP
      userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
      deviceType: 'Mobile',
      browser: 'Chrome',
      os: 'Android',
      source: 'google_ads',
      campaignId: 'camp-101',
      gclid: 'Cj0KCQjwho-lBhC_ARIsAMixQeO1...',
      isSuspicious: false,
      formInteracted: false,
      timeOnSite: 2, // Bouncer
      pageLoadTime: 1200,
      isp: 'Reliance Jio Infocomm Limited',
      city: 'Mumbai',
      country: 'India',
      lat: 19.0760,
      lon: 72.8777,
      pagesVisited: JSON.stringify(['/']),
      exitPage: '/',
      actions: null
    }
  });

  // 2. Desktop Converter
  await prisma.adClick.create({
    data: {
      websiteUrl: 'localhost',
      ipAddress: '69.162.81.155', // US IP
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      deviceType: 'Desktop',
      browser: 'Chrome',
      os: 'Windows',
      source: 'google_ads',
      gclid: 'Cj0KCQjwho-lBhC_ARIsA...',
      isSuspicious: false,
      formInteracted: true,
      timeOnSite: 145, // Good engagement
      pageLoadTime: 850,
      isp: 'Comcast Cable Communications',
      city: 'New York',
      country: 'United States',
      lat: 40.7128,
      lon: -74.0060,
      pagesVisited: JSON.stringify(['/', '/services', '/contact']),
      exitPage: '/contact',
      actions: JSON.stringify(['Focused on field: name', 'Focused on field: email', 'Clicked Submit Button'])
    }
  });

  // 3. Suspicious Bot / WhatsApp Clicker
  await prisma.adClick.create({
    data: {
      websiteUrl: 'localhost',
      ipAddress: '45.132.226.111', // Datacenter IP
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
      deviceType: 'Desktop',
      browser: 'Safari',
      os: 'Mac OS',
      source: 'google_ads',
      isSuspicious: true,
      suspicionReason: 'High Frequency IP (Multiple clicks today)',
      formInteracted: false,
      timeOnSite: 45, 
      pageLoadTime: 3200, // Slow load
      isp: 'DigitalOcean, LLC',
      city: 'Frankfurt',
      country: 'Germany',
      lat: 50.1109,
      lon: 8.6821,
      pagesVisited: JSON.stringify(['/', '/pricing']),
      exitPage: '/pricing',
      actions: JSON.stringify(['Clicked WhatsApp Button'])
    }
  });

  console.log('Dummy data seeded successfully!');
}

seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
