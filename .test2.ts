import { chromium } from 'playwright';

(async () => {
  // If the user's dev server is running on 3000
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:3000/billing');
    console.log("Page title:", await page.title());
  } catch(e) {
    console.log("Error:", e);
  }
  await browser.close();
})();
