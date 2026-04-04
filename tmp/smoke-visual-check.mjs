import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, devices } from 'playwright';

const baseURL = 'http://127.0.0.1:5173';
const routes = [
  { slug: 'home', path: '/' },
  { slug: 'lowongan', path: '/lowongan' },
  { slug: 'berita', path: '/berita' },
  { slug: 'artikel', path: '/artikel' },
  { slug: 'daftar-kuisioner', path: '/daftar-kuisioner' },
  { slug: 'tentang', path: '/tentang' },
  { slug: 'layanan', path: '/layanan' },
];

const viewportConfigs = [
  {
    slug: 'desktop',
    contextOptions: {
      viewport: { width: 1440, height: 900 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    },
  },
  {
    slug: 'mobile',
    contextOptions: {
      ...devices['iPhone 12'],
    },
  },
];

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.join(process.cwd(), 'tmp', 'smoke-visual', stamp);
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

const results = [];

async function autoScroll(page) {
  const totalHeight = await page.evaluate(() => Math.max(0, document.body.scrollHeight - window.innerHeight));
  const steps = Math.max(1, Math.ceil(totalHeight / 420));

  for (let i = 0; i <= steps; i += 1) {
    const y = Math.round((totalHeight * i) / steps);
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
    await page.waitForTimeout(220);
  }
}

for (const viewportConfig of viewportConfigs) {
  const context = await browser.newContext({
    ...viewportConfig.contextOptions,
    baseURL,
  });

  for (const route of routes) {
    const page = await context.newPage();
    const target = `${baseURL}${route.path}`;

    try {
      await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(650);

      await autoScroll(page);
      await page.waitForTimeout(520);

      const revealStats = await page.evaluate(() => {
        const all = Array.from(document.querySelectorAll('.scroll-reveal-init'));
        const visible = all.filter((el) => el.classList.contains('scroll-reveal-in')).length;
        return {
          totalTargets: all.length,
          visibleTargets: visible,
          hiddenTargets: all.length - visible,
          pageHeight: document.body.scrollHeight,
        };
      });

      const fileName = `${viewportConfig.slug}-${route.slug}.png`;
      const outputPath = path.join(outDir, fileName);
      await page.screenshot({ path: outputPath, fullPage: true });

      results.push({
        viewport: viewportConfig.slug,
        route: route.path,
        screenshot: outputPath,
        ...revealStats,
      });

      console.log(
        `${viewportConfig.slug} ${route.path} -> hidden ${revealStats.hiddenTargets}/${revealStats.totalTargets} | ${fileName}`,
      );
    } catch (error) {
      console.log(`${viewportConfig.slug} ${route.path} -> ERROR: ${error?.message || error}`);
    } finally {
      await page.close();
    }
  }

  await context.close();
}

await browser.close();

const reportPath = path.join(outDir, 'report.json');
await fs.writeFile(reportPath, JSON.stringify(results, null, 2), 'utf8');
console.log(`Report: ${reportPath}`);
console.log(`Output dir: ${outDir}`);
