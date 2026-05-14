import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function seed() {
  console.log('🚀 Seeding dummy tracking data...');

  try {
    // 1. Mobile Bouncer
    await prisma.adClick.create({
      data: {
        websiteUrl: 'localhost',
        ipAddress: '114.143.195.1', 
        userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
        deviceType: 'Mobile',
        browser: 'Chrome',
        os: 'Android',
        source: 'google_ads',
        campaignId: 'mumbai-local',
        gclid: 'gclid-bouncer-123',
        isSuspicious: false,
        formInteracted: false,
        timeOnSite: 4, 
        pageLoadTime: 2200,
        isp: 'Reliance Jio',
        city: 'Mumbai',
        country: 'India',
        lat: 19.0760,
        lon: 72.8777,
        pagesVisited: JSON.stringify(['/']),
        exitPage: '/',
        actions: JSON.stringify(['Landed on Home'])
      }
    });

    // 2. Desktop Lead
    await prisma.adClick.create({
      data: {
        websiteUrl: 'localhost',
        ipAddress: '106.192.0.1', 
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        deviceType: 'Desktop',
        browser: 'Chrome',
        os: 'Windows',
        source: 'google_ads',
        gclid: 'gclid-lead-456',
        isSuspicious: false,
        formInteracted: true,
        timeOnSite: 210, 
        pageLoadTime: 850,
        isp: 'Airtel India',
        city: 'Delhi',
        country: 'India',
        lat: 28.6139,
        lon: 77.2090,
        pagesVisited: JSON.stringify(['/', '/services', '/contact']),
        exitPage: '/contact',
        actions: JSON.stringify(['Landed on Home', 'Visited Services', 'Clicked WhatsApp Button', 'Submitted Contact Form'])
      }
    });

    console.log('✅ Seed successful!');
  } catch (err) {
    console.error('❌ Seed failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
