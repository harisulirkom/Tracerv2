import { chromium, devices } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ...devices['iPhone 12'] });
const page = await context.newPage();
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
await page.waitForLoadState('networkidle').catch(() => {});
await page.waitForTimeout(700);

const total = await page.evaluate(() => Math.max(0, document.body.scrollHeight - window.innerHeight));
const steps = Math.max(1, Math.ceil(total / 420));
for (let i = 0; i <= steps; i += 1) {
  const y = Math.round((total * i) / steps);
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
  await page.waitForTimeout(220);
}
await page.waitForTimeout(450);

const hidden = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.scroll-reveal-init'))
    .filter((el) => !el.classList.contains('scroll-reveal-in'))
    .map((el, idx) => {
      const cls = Array.from(el.classList).join('.');
      const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120);
      const rect = el.getBoundingClientRect();
      return {
        idx,
        tag: el.tagName,
        cls,
        text,
        top: Math.round(rect.top),
        height: Math.round(rect.height),
      };
    });
});

console.log(JSON.stringify(hidden, null, 2));
await context.close();
await browser.close();
