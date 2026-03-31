import { computed, ref } from 'vue'

const supportedLocales = ['id', 'en', 'ar']
const runtimeTranslateEnabled =
  String(import.meta.env.VITE_ENABLE_RUNTIME_TRANSLATE || 'false').trim().toLowerCase() === 'true'
const runtimeTranslationCache = ref({})
const runtimeTranslationInFlight = new Set()

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const toText = (value) => (value === null || value === undefined ? '' : String(value).trim())
const containsLatinLetters = (value) => /[A-Za-z\u00C0-\u024F]/.test(String(value || ''))
const toUpperLocale = (value) => String(value || '').toUpperCase()

const readPath = (source, path) => {
  if (!source || !path) return undefined
  return String(path)
    .split('.')
    .reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), source)
}

const getLocalizedPathCandidates = (path, localeCode) => {
  const cleanPath = String(path || '').trim()
  if (!cleanPath) return []
  const parts = cleanPath.split('.')
  const leaf = parts[parts.length - 1]
  const parent = parts.slice(0, -1)
  const localeCap = localeCode.charAt(0).toUpperCase() + localeCode.slice(1)
  const leafSnake = `${leaf}_${localeCode}`
  const leafCamel = `${leaf}${localeCap}`

  if (!parent.length) {
    return [leafSnake, leafCamel]
  }

  const parentPath = parent.join('.')
  const nestedPath = `${parentPath}.${leaf}`
  return [`${parentPath}.${leafSnake}`, `${parentPath}.${leafCamel}`, `${nestedPath}_${localeCode}`]
}

const getFromTranslationBucket = (source, path, localeCode) => {
  const translations = source?.translations
  if (!isPlainObject(translations)) return null

  const bucket = translations[localeCode] || translations[toUpperLocale(localeCode)]
  const flatPath = String(path || '').replace(/\./g, '_')

  if (isPlainObject(bucket)) {
    const nested = readPath(bucket, path)
    if (nested !== undefined && nested !== null && nested !== '') return nested
    const flat = bucket[flatPath]
    if (flat !== undefined && flat !== null && flat !== '') return flat
  }

  const byField = translations[path] || translations[flatPath]
  if (isPlainObject(byField)) {
    const scoped = byField[localeCode] || byField[toUpperLocale(localeCode)]
    if (scoped !== undefined && scoped !== null && scoped !== '') return scoped
  }

  return null
}

const resolveLocaleValue = (source, path, localeCode) => {
  if (!source || !path) return null

  const direct = readPath(source, path)
  if (isPlainObject(direct)) {
    const localized = direct[localeCode] ?? direct[toUpperLocale(localeCode)]
    if (localized !== undefined && localized !== null && localized !== '') return localized
  }

  const candidatePaths = getLocalizedPathCandidates(path, localeCode)
  for (const candidatePath of candidatePaths) {
    const value = readPath(source, candidatePath)
    if (value !== undefined && value !== null && value !== '') return value
  }

  const bucketValue = getFromTranslationBucket(source, path, localeCode)
  if (bucketValue !== null && bucketValue !== undefined && bucketValue !== '') return bucketValue

  return null
}

const decodeHtmlEntities = (value) =>
  String(value || '')
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCharCode(Number(decimal)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')

const splitForTranslation = (value, maxLength = 800) => {
  const text = String(value || '')
  if (!text) return []
  if (text.length <= maxLength) return [text]

  const chunks = []
  let start = 0

  while (start < text.length) {
    let end = Math.min(text.length, start + maxLength)
    if (end < text.length) {
      const part = text.slice(start, end)
      const breakAt = Math.max(part.lastIndexOf('\n'), part.lastIndexOf('. '), part.lastIndexOf(', '))
      if (breakAt > Math.floor(maxLength * 0.45)) {
        end = start + breakAt + 1
      }
    }
    chunks.push(text.slice(start, end))
    start = end
  }

  return chunks
}

const hashText = (value) => {
  let hash = 0
  const input = String(value || '')
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}

const translateChunk = async (text, targetLocale) => {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'auto',
    tl: targetLocale,
    dt: 't',
    q: text,
  })

  const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`)
  if (!response.ok) throw new Error('Failed to translate text')

  const payload = await response.json()
  const translated = Array.isArray(payload?.[0]) ? payload[0].map((segment) => segment?.[0] || '').join('') : ''
  return decodeHtmlEntities(translated).trim()
}

const translateTextRuntime = async (text, targetLocale) => {
  const chunks = splitForTranslation(text)
  if (!chunks.length) return ''

  const translatedChunks = []
  for (const chunk of chunks) {
    if (!toText(chunk)) {
      translatedChunks.push(chunk)
      continue
    }
    const translated = await translateChunk(chunk, targetLocale)
    translatedChunks.push(translated || chunk)
  }

  return translatedChunks.join('').trim()
}

const normalizeTextArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => toText(entry)).filter(Boolean)
  }

  const text = toText(value)
  if (!text) return []

  if (text.includes('\n')) {
    return text
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  if (text.includes(',')) {
    return text
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  return [text]
}

export const useLocalizedDynamicContent = (localeRef) => {
  const activeLocale = computed(() => {
    const current = toText(localeRef?.value || localeRef)
    return supportedLocales.includes(current) ? current : 'id'
  })

  const getRuntimeTranslation = (text, targetLocale) => {
    const clean = toText(text)
    if (!clean) return ''
    if (!runtimeTranslateEnabled || targetLocale === 'id' || !containsLatinLetters(clean)) return clean

    const cacheKey = `${targetLocale}:${clean.length}:${hashText(clean)}`
    const cached = runtimeTranslationCache.value[cacheKey]
    if (cached) return cached

    if (!runtimeTranslationInFlight.has(cacheKey)) {
      runtimeTranslationInFlight.add(cacheKey)
      translateTextRuntime(clean, targetLocale)
        .then((translated) => {
          runtimeTranslationCache.value[cacheKey] = toText(translated) || clean
        })
        .catch(() => {
          runtimeTranslationCache.value[cacheKey] = clean
        })
        .finally(() => {
          runtimeTranslationInFlight.delete(cacheKey)
        })
    }

    return clean
  }

  const resolveLocalizedString = (source, path, options = {}) => {
    const targetLocale = activeLocale.value
    const fallbackLocale = options?.fallbackLocale || 'id'
    const shouldAutoTranslate = options?.autoTranslate !== false && runtimeTranslateEnabled

    const localized = toText(resolveLocaleValue(source, path, targetLocale))
    if (localized) return localized

    const base = toText(resolveLocaleValue(source, path, fallbackLocale) ?? readPath(source, path))
    if (!base) return ''
    if (!shouldAutoTranslate || targetLocale === fallbackLocale) return base
    return getRuntimeTranslation(base, targetLocale)
  }

  const resolveLocalizedArray = (source, path, options = {}) => {
    const targetLocale = activeLocale.value
    const fallbackLocale = options?.fallbackLocale || 'id'
    const shouldAutoTranslate = options?.autoTranslate !== false && runtimeTranslateEnabled
    const max = Number.isFinite(Number(options?.max)) ? Number(options.max) : null

    const localized = normalizeTextArray(resolveLocaleValue(source, path, targetLocale))
    if (localized.length) return max ? localized.slice(0, max) : localized

    const base = normalizeTextArray(resolveLocaleValue(source, path, fallbackLocale) ?? readPath(source, path))
    const mapped =
      !shouldAutoTranslate || targetLocale === fallbackLocale
        ? base
        : base.map((entry) => getRuntimeTranslation(entry, targetLocale)).filter(Boolean)

    return max ? mapped.slice(0, max) : mapped
  }

  const resolvePublishedStatus = (value) => {
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value === 1
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      return ['1', 'true', 'publish', 'published', 'aktif', 'active'].includes(normalized)
    }
    return !!value
  }

  const resolveSummary = (item, fallback = '') => {
    const summary = resolveLocalizedString(item, 'summary')
    if (summary) return summary
    const content = resolveLocalizedString(item, 'content')
    if (!content) return toText(fallback)
    return content.length > 160 ? `${content.slice(0, 157)}...` : content
  }

  const resolveLocalizedTags = (item, fallbackTag = '') => {
    const paths = ['tags', 'tag', 'kategori', 'category']
    for (const path of paths) {
      const values = resolveLocalizedArray(item, path, { max: 4 })
      if (values.length) return values
    }
    return fallbackTag ? [fallbackTag] : []
  }

  const resolveDateValue = (item) => item?.createdAt || item?.created_at || item?.date || ''

  return {
    activeLocale,
    readPath,
    toText,
    resolveLocaleValue,
    resolveLocalizedString,
    resolveLocalizedArray,
    resolveLocalizedTags,
    resolveSummary,
    resolvePublishedStatus,
    resolveDateValue,
  }
}
