import { addExtra } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import puppeteer from 'puppeteer';
import fs from 'fs';

const puppeteerExtra = addExtra(puppeteer as any);
puppeteerExtra.use(StealthPlugin());

const debugScrape = async () => {
  const keyword = 'business brokers australia';
  const browser = await (puppeteer as any).launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
    
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&num=100`;
    console.log(`Navigating to: ${searchUrl}`);
    
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });
    
    // Take a screenshot to see what Google shows
    await page.screenshot({ path: 'google_search.png', fullPage: true });
    
    const content = await page.content();
    fs.writeFileSync('google_content.html', content);
    console.log('Saved content to google_content.html and screenshot to google_search.png');

  } catch (error) {
    console.error('Debug Scraping Error:', error);
  } finally {
    await browser.close();
  }
};

debugScrape();
