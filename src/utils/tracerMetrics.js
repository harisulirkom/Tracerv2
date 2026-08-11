export const normalizeWaitingMonths = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return null
  const matches = String(value).match(/-?\d+(?:[.,]\d+)?/g) || []
  if (matches.length !== 1) return null
  const number = Number(matches[0].replace(',', '.'))
  return Number.isFinite(number) && number >= 0 && number <= 120 ? number : null
}

export const normalizeSalaryMillion = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return null
  const compact = String(value).toLowerCase().replace(/rp|rupiah|\s+/g, '')
  if (/^(<|kurangdari)1(juta|jt)?$/.test(compact)) return 0.5
  if (/^(antara)?1[-–]3(juta|jt)?$/.test(compact)) return 2
  if (/^(antara)?3[-–]5(juta|jt)?$/.test(compact)) return 4
  if (/^(>|diatas|lebihdari)5(juta|jt)?$/.test(compact)) return 5

  const hasMillionUnit = compact.includes('juta') || /jt\b/.test(compact)
  const numeric = compact.replace(/[^0-9.,-]/g, '')
  if (!numeric || numeric.includes('-')) return null
  const isDecimalMillion = /^\d+[.,]\d{1,2}$/.test(numeric)
  const raw = hasMillionUnit || isDecimalMillion
    ? Number(numeric.replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.'))
    : Number(numeric.replace(/[.,]/g, ''))
  if (!Number.isFinite(raw) || raw <= 0) return null
  const million = hasMillionUnit || raw <= 1000 ? raw : raw / 1_000_000
  return Math.round(million * 10) / 10
}
