import { createI18n } from 'vue-i18n'
import { messages } from './messages'

export const SUPPORTED_LOCALES = ['id', 'en', 'ar']
const STORAGE_KEY = 'tracer_locale'
const RTL_LOCALES = ['ar']

const normalizeLocale = (locale) => {
  if (!locale) return null
  const base = String(locale).trim().toLowerCase().split('-')[0]
  return SUPPORTED_LOCALES.includes(base) ? base : null
}

const getStoredLocale = () => {
  if (typeof window === 'undefined') return null
  try {
    return normalizeLocale(window.localStorage.getItem(STORAGE_KEY))
  } catch (error) {
    return null
  }
}

const resolveInitialLocale = () => getStoredLocale() || 'id'

const applyDocumentLocale = (locale) => {
  if (typeof document === 'undefined') return
  const next = normalizeLocale(locale) || 'id'
  const isRtl = RTL_LOCALES.includes(next)
  document.documentElement.setAttribute('lang', next)
  document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr')
}

const initialLocale = resolveInitialLocale()

const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'id',
  messages,
})

applyDocumentLocale(initialLocale)

export const setAppLocale = (locale) => {
  const next = normalizeLocale(locale) || 'id'
  i18n.global.locale.value = next
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch (error) {
    }
  }
  applyDocumentLocale(next)
}

export default i18n
