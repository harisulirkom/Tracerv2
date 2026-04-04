import { chromium } from 'playwright'
import { writeFile } from 'node:fs/promises'

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4173'
const locales = ['id', 'en', 'ar']

const routeConfigs = [
  {
    name: 'home',
    path: '/',
    action: async () => ({ ok: true, note: 'home rendered' }),
  },
  {
    name: 'lowongan',
    path: '/lowongan',
    action: async (page) => {
      const cardCount = await page.locator('#lowongan-terbaru article').count()
      if (!cardCount) return { ok: false, note: 'no vacancy cards found' }

      const detailButton = page.locator('#lowongan-terbaru article button').first()
      await detailButton.click({ timeout: 10_000 })
      await page.waitForTimeout(450)
      const modalHeading = (await page.locator('div.fixed h3').first().textContent().catch(() => ''))?.trim() || ''

      const closeButton = page.locator('div.fixed button').first()
      if (await closeButton.count()) {
        await closeButton.click().catch(() => {})
      } else {
        await page.keyboard.press('Escape').catch(() => {})
      }

      return {
        ok: true,
        note: modalHeading ? `opened modal: ${modalHeading}` : 'opened modal',
      }
    },
  },
  {
    name: 'berita',
    path: '/berita',
    action: async (page) => {
      const detailLink = page.locator('main a[href^="/berita/"]').first()
      const hasDetail = (await detailLink.count()) > 0
      if (!hasDetail) {
        const cards = await page.locator('main article').count()
        return { ok: cards > 0, note: cards ? 'list rendered without route detail link' : 'no news card found' }
      }

      await detailLink.click({ timeout: 10_000 })
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(350)
      const detailTitle = (await page.locator('main article h2').first().textContent().catch(() => ''))?.trim() || ''
      await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => page.goto(`${baseUrl}/berita`, { waitUntil: 'domcontentloaded' }))
      await page.waitForTimeout(200)

      return {
        ok: true,
        note: detailTitle ? `opened detail: ${detailTitle}` : 'opened detail page',
      }
    },
  },
  {
    name: 'artikel',
    path: '/artikel',
    action: async (page) => {
      const detailButton = page
        .locator('main article button')
        .filter({ hasText: /Lihat rincian|View details|عرض التفاصيل/i })
        .first()

      const hasButton = (await detailButton.count()) > 0
      if (!hasButton) {
        const cards = await page.locator('main article').count()
        return { ok: cards > 0, note: cards ? 'list rendered without detail button match' : 'no article card found' }
      }

      await detailButton.click({ timeout: 10_000 })
      await page.waitForTimeout(450)
      const modalHeading = (await page.locator('div.fixed h3').first().textContent().catch(() => ''))?.trim() || ''

      const closeButton = page.locator('div.fixed button').first()
      if (await closeButton.count()) {
        await closeButton.click().catch(() => {})
      } else {
        await page.keyboard.press('Escape').catch(() => {})
      }

      return {
        ok: true,
        note: modalHeading ? `opened modal: ${modalHeading}` : 'opened modal',
      }
    },
  },
]

const idWordPatterns = [
  /\blowongan\b/i,
  /\bberita\b/i,
  /\bartikel\b/i,
  /\bkuisioner\b/i,
  /\bkualifikasi\b/i,
  /\bpengalaman\b/i,
  /\btanggung jawab\b/i,
  /\bcara melamar\b/i,
  /\blokasi\b/i,
  /\bjenis pekerjaan\b/i,
  /\btidak ada\b/i,
  /\bbelum ada\b/i,
  /\bdipublikasikan\b/i,
  /\bselengkapnya\b/i,
]

const snippetAround = (text, index, radius = 48) => {
  const start = Math.max(0, index - radius)
  const end = Math.min(text.length, index + radius)
  return text.slice(start, end).replace(/\s+/g, ' ').trim()
}

const findSuspicious = (locale, text) => {
  if (!text || locale === 'id') return []
  const lowered = text.toLowerCase()
  const findings = []

  for (const pattern of idWordPatterns) {
    const match = pattern.exec(lowered)
    if (!match) continue
    findings.push({
      type: 'id_word',
      token: match[0],
      snippet: snippetAround(text, match.index),
    })
  }

  if (locale === 'ar') {
    const latinCount = (text.match(/[A-Za-z]/g) || []).length
    const arabicCount = (text.match(/[\u0600-\u06FF]/g) || []).length
    const total = latinCount + arabicCount
    if (total > 120 && arabicCount > 0) {
      const latinRatio = latinCount / total
      if (latinRatio > 0.42) {
        findings.push({
          type: 'latin_ratio_high',
          token: latinRatio.toFixed(2),
          snippet: `latin ratio ${latinRatio.toFixed(2)} with arabic chars ${arabicCount}`,
        })
      }
    }
  }

  return findings
}

const switchLocale = async (page, targetLocale) => {
  const target = targetLocale.toUpperCase()
  const switcher = page.locator('.lang-shine-wrap').first()
  try {
    await switcher.waitFor({ state: 'visible', timeout: 12_000 })
  } catch (error) {
    const sample = ((await page.locator('body').innerText().catch(() => '')) || '').replace(/\s+/g, ' ').slice(0, 260)
    const currentUrl = page.url()
    throw new Error(`Language switcher not visible at ${currentUrl}. Body sample: ${sample}`)
  }

  const activeButton = switcher.locator('button').first()
  const activeText = ((await activeButton.textContent()) || '').trim().toUpperCase()
  if (activeText === target) return

  await switcher.hover()
  const option = switcher.locator('button.bg-slate-100', { hasText: target }).first()
  await option.waitFor({ state: 'visible', timeout: 8_000 })
  await option.click()
  await page.waitForTimeout(900)
}

const collectMainText = async (page) => {
  const text = (await page.locator('main').innerText().catch(() => '')) || ''
  return text.replace(/\s+/g, ' ').trim()
}

const run = async () => {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  const results = []

  for (const locale of locales) {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' })
    await switchLocale(page, locale)

    for (const route of routeConfigs) {
      const url = `${baseUrl}${route.path}`
      const entry = {
        locale,
        route: route.name,
        url,
        actionOk: false,
        actionNote: '',
        suspicious: [],
        sampleText: '',
        error: '',
      }

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(550)
        await switchLocale(page, locale)
        await page.waitForTimeout(locale === 'id' ? 350 : 2200)

        const actionResult = await route.action(page)
        entry.actionOk = !!actionResult?.ok
        entry.actionNote = actionResult?.note || ''

        if (locale !== 'id') {
          await page.waitForTimeout(1600)
        }

        const text = await collectMainText(page)
        entry.sampleText = text.slice(0, 700)
        entry.suspicious = findSuspicious(locale, text)
      } catch (error) {
        entry.error = error?.message || String(error)
      }

      results.push(entry)
    }
  }

  await browser.close()

  const summary = {
    baseUrl,
    testedAt: new Date().toISOString(),
    totalChecks: results.length,
    failedChecks: results.filter((item) => item.error || !item.actionOk).length,
    suspiciousCount: results.reduce((acc, item) => acc + item.suspicious.length, 0),
    results,
  }

  await writeFile('tmp/smoke-i18n-report.json', JSON.stringify(summary, null, 2), 'utf8')
  console.log(JSON.stringify(summary, null, 2))
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
