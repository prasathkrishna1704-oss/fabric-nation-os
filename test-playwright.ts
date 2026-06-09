import { chromium } from 'playwright';
import { prisma } from './src/lib/prisma';

(async () => {
  const inv = await prisma.invoice.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!inv) return console.log("No invoice");

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'svy123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  
  await page.goto(`http://localhost:3000/billing/${inv.id}/edit`);
  
  console.log("On edit page:", page.url());
  
  // Wait for button
  await page.waitForSelector('button:has-text("Save Changes")');
  await page.click('button:has-text("Save Changes")');
  
  await page.waitForTimeout(4000);
  
  console.log("Current URL after save:", page.url());
  
  const hasError = await page.evaluate(() => !!document.querySelector('nextjs-portal'));
  console.log("Has Next.js error overlay:", hasError);
  
  if (hasError) {
    const errorText = await page.evaluate(() => document.querySelector('nextjs-portal')?.shadowRoot?.querySelector('#nextjs__container_errors_desc')?.textContent || document.querySelector('nextjs-portal')?.shadowRoot?.textContent);
    console.log("Error text:", errorText);
  }

  await browser.close();
})();
