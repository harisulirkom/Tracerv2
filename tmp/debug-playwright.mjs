import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)
console.log('url', page.url())
console.log('title', await page.title())
const body = await page.locator('body').innerText()
console.log('body-sample', body.slice(0, 500))
console.log('switcher-count', await page.locator('.lang-shine-wrap').count())
await page.screenshot({ path: 'tmp/debug-home.png', fullPage: true })
await browser.close()
