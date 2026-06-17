import { chromium } from 'playwright';
import fs from 'fs';
const outDir = '/tmp/nedcloud-qa';
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });

const capture = async (name, url, selector) => {
  const page = await context.newPage();
  const logs = [];
  page.on('console', msg => logs.push({ level: msg.type(), text: msg.text() }));
  page.on('pageerror', err => logs.push({ level: 'pageerror', text: err.message }));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  if (selector) {
    const el = await page.locator(selector).first();
    await el.scrollIntoViewIfNeeded();
    await el.screenshot({ path: `${outDir}/${name}.png` });
  } else {
    await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
  }
  fs.writeFileSync(`${outDir}/${name}-console.json`, JSON.stringify(logs, null, 2));
  await page.close();
};

await capture('homepage', 'http://localhost:3000/');
await capture('admin-login', 'http://localhost:3000/admin/login');
await capture('footer', 'http://localhost:3000/', 'footer');

await browser.close();
console.log(`Screenshots saved to ${outDir}`);
