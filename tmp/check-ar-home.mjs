import { chromium } from 'playwright'
import { writeFile } from 'node:fs/promises'

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5173'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

const switchTo = async (target) => {
  const switcher = page.locator('.lang-shine-wrap').first()
  await switcher.waitFor({ state: 'visible', timeout: 12000 })
  const active = (((await switcher.locator('button').first().textContent()) || '').trim().toUpperCase())
  if (active === target) return
  await switcher.hover()
  const option = switcher.locator('button.bg-slate-100', { hasText: target }).first()
  await option.waitFor({ state: 'visible', timeout: 8000 })
  await option.click()
}

await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(500)
await switchTo('AR')
await page.waitForTimeout(6000)
const text = ((await page.locator('main').innerText()) || '').replace(/\s+/g, ' ')
const payload = {
  containsKuisioner: /kuisioner/i.test(text),
  containsLowongan: /lowongan/i.test(text),
  sample: text.slice(0, 1100),
}
await writeFile('tmp/check-ar-home.json', JSON.stringify(payload, null, 2), 'utf8')
await page.screenshot({ path: 'tmp/check-ar-home.png', fullPage: true })
await browser.close()
