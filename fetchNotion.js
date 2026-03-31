const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Wait until network is idle so Notion has time to render
  await page.goto('https://heliotrope-cushion-5f6.notion.site/Privacy-and-Data-Protection-Policy-32bcd346d10e805fab86cb00b1069e1d', {
    waitUntil: 'networkidle0',
  });
  
  // Extract all text content
  const content = await page.evaluate(() => document.body.innerText);
  
  console.log("=== NOTION CONTENT START ===");
  console.log(content);
  console.log("=== NOTION CONTENT END ===");
  
  await browser.close();
})();
