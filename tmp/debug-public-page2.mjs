import { chromium } from 'playwright'

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4173'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

page.on('console', (msg) => {
  console.log('[console]', msg.type(), msg.text())
})
page.on('pageerror', (err) => {
  console.log('[pageerror]', err.message)
})
page.on('requestfailed', (req) => {
  console.log('[requestfailed]', req.url(), req.failure()?.errorText)
})
page.on('response', (res) => {
  if (res.status() >= 400) {
    console.log('[response]', res.status(), res.url())
  }
})

await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' })
await page.waitForTimeout(3500)

const rootHtml = await page.locator('#app').innerHTML().catch(() => '<no-app>')
const bodyText = await page.locator('body').innerText().catch(() => '')

console.log('url:', page.url())
console.log('app-html-len:', rootHtml.length)
console.log('body-text-len:', bodyText.length)
console.log('switcher:', await page.locator('.lang-shine-wrap').count())
console.log('main:', await page.locator('main').count())

await page.screenshot({ path: 'tmp/debug-home-2.png', fullPage: true })
await browser.close()
