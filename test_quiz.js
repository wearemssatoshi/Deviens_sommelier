const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err));
  
  await page.goto('http://localhost:8765/app/');
  
  // click quiz FAB
  await page.locator('#quizFab').click();
  // wait for it to open
  await page.waitForTimeout(500);
  
  // click start
  await page.locator('#quizStartBtn').click();
  
  await page.waitForTimeout(2000);
  await browser.close();
})();
