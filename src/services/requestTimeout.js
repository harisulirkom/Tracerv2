const DEFAULT_API_TIMEOUT_MS = 10_000
const DEFAULT_DASHBOARD_TIMEOUT_MS = 20_000

const parsePositiveTimeout = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const API_TIMEOUT_MS = parsePositiveTimeout(
  import.meta.env.VITE_API_TIMEOUT_MS,
  DEFAULT_API_TIMEOUT_MS,
)

export const DASHBOARD_TIMEOUT_MS = parsePositiveTimeout(
  import.meta.env.VITE_DASHBOARD_TIMEOUT_MS,
  Math.max(API_TIMEOUT_MS, DEFAULT_DASHBOARD_TIMEOUT_MS),
)

export const isTimeoutError = (error) => {
  const message = String(error?.message || '').toLowerCase()
  return error?.code === 'ECONNABORTED' || message.includes('timeout')
}

export const buildTimeoutMessage = (timeoutMs) => {
  const parsed = Number(timeoutMs)
  if (Number.isFinite(parsed) && parsed > 0) {
    return `Permintaan melebihi batas waktu ${parsed}ms. Coba lagi atau periksa performa server.`
  }
  return 'Permintaan melebihi batas waktu. Coba lagi atau periksa performa server.'
}
