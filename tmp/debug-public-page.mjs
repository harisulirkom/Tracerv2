import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
const page = await context.newPage()

page.on('console', (msg) => {
  console.log('[console]', msg.type(), msg.text())
})
page.on('pageerror', (err) => {
  console.log('[pageerror]', err.message)
})

await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(8000)

console.log('url:', page.url())
console.log('content-size:', (await page.content()).length)
console.log('switcher count:', await page.locator('.lang-shine-wrap').count())
console.log('main count:', await page.locator('main').count())
console.log('body text len:', ((await page.locator('body').innerText().catch(() => '')) || '').length)

await page.screenshot({ path: 'tmp/debug-home.png', fullPage: true })
await browser.close()
