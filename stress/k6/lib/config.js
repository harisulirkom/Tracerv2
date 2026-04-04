const trimRightSlash = (value) => String(value || '').replace(/\/+$/, '')

const toNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback
  const normalized = String(value).trim().toLowerCase()
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false
  return fallback
}

const csvToList = (value = '') =>
  String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

export const BASE_URL = trimRightSlash(__ENV.BASE_URL || 'http://127.0.0.1:8000')
export const API_PREFIX = (() => {
  const raw = String(__ENV.API_PREFIX || '/api').trim()
  if (!raw) return '/api'
  return raw.startsWith('/') ? trimRightSlash(raw) : `/${trimRightSlash(raw)}`
})()
export const API_BASE = `${BASE_URL}${API_PREFIX}`
export const REQUEST_TIMEOUT = String(__ENV.REQUEST_TIMEOUT || '30s')
export const LOGIN_ENDPOINT_PATH = (() => {
  const raw = String(__ENV.LOGIN_ENDPOINT_PATH || '/login').trim()
  if (!raw) return '/login'
  return raw.startsWith('/') ? raw : `/${raw}`
})()
export const SUMMARY_ENDPOINT_PATH = (() => {
  const raw = String(__ENV.SUMMARY_ENDPOINT_PATH || '/dashboard/tracer/accreditation-summary').trim()
  if (!raw) return '/dashboard/tracer/accreditation-summary'
  return raw.startsWith('/') ? raw : `/${raw}`
})()

export const THINK_TIME_MIN = Math.max(0, toNumber(__ENV.THINK_TIME_MIN, 0.2))
export const THINK_TIME_MAX = Math.max(THINK_TIME_MIN, toNumber(__ENV.THINK_TIME_MAX, 1.2))

export const ACCREDITATION_YEAR = Math.trunc(
  toNumber(__ENV.ACCREDITATION_YEAR, new Date().getFullYear()),
)
export const TS_LABELS = csvToList(__ENV.TS_LABELS || 'TS-1,TS-2')
export const FAKULTAS_LIST = csvToList(__ENV.FAKULTAS_LIST || '')
export const PRODI_LIST = csvToList(__ENV.PRODI_LIST || '')

export const RESPONSES_PAGE_MAX = Math.max(1, Math.trunc(toNumber(__ENV.RESPONSES_PAGE_MAX, 10)))
export const RESPONSES_PER_PAGE = Math.max(1, Math.trunc(toNumber(__ENV.RESPONSES_PER_PAGE, 50)))
export const ENABLE_EXPORT = toBool(__ENV.ENABLE_EXPORT, false)
export const EXPORT_FORMAT = String(__ENV.EXPORT_FORMAT || 'xlsx').trim().toLowerCase()

export const SUMMARY_WEIGHT = Math.max(0, toNumber(__ENV.SUMMARY_WEIGHT, 0.7))
export const RESPONSES_WEIGHT = Math.max(0, toNumber(__ENV.RESPONSES_WEIGHT, 0.25))
export const EXPORT_WEIGHT = Math.max(0, toNumber(__ENV.EXPORT_WEIGHT, 0.05))

export const DEFAULT_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
}

export const pickRandom = (list = []) => {
  if (!Array.isArray(list) || !list.length) return null
  const idx = Math.floor(Math.random() * list.length)
  return list[idx]
}

export const randomThinkTime = () =>
  THINK_TIME_MIN + Math.random() * (THINK_TIME_MAX - THINK_TIME_MIN)
