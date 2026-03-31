import { computed, reactive } from 'vue'
import contentService from '@/services/contentService'

const STORAGE_KEY = 'tracer_admin_cta_slides'
const canUseApi = !!import.meta.env.VITE_API_BASE_URL

const state = reactive({
  slides: [],
  loading: false,
  error: '',
})

const defaultSlides = [
  {
    id: 'cta-cdc',
    tag: 'CDC UIN Kediri',
    title: 'Selamat Datang di Career Development Center',
    highlight: 'UIN Syekh Wasil Kediri',
    subtitle: 'Wadah Pengembangan Karier, Tracer Study & Kemitraan Industri.',
    chips: ['Konseling & coaching karier', 'Tracer study terintegrasi', 'Kemitraan industri kampus'],
    primary: { label: 'Masuk Portal CDC', to: '/layanan' },
    secondary: { label: 'Lihat layanan ->', to: '/layanan' },
    stats: {
      labelLeft: 'Program aktif',
      valueLeft: '12',
      labelRight: 'Mitra industri',
      valueRight: '34',
      progress: 78,
      remark: 'Kolaborasi kampus x industri untuk kesiapan karier.',
      badge: 'Live',
    },
    order: 0,
  },
  {
    id: 'cta-tracer',
    tag: 'Tracer Study 2025 - Kuisioner sudah dibuka',
    title: 'Lengkapi tracer study',
    highlight: 'lebih cepat dan akurat',
    subtitle: 'Sebar kuisioner, pantau respon, dan publikasikan laporan tracer study dalam satu platform terpadu.',
    chips: ['Tanpa batas responden', 'Ekspor PDF/Excel', 'Keamanan terjaga'],
    primary: { label: 'Isi Kuisioner Alumni', to: '/kuisioner/alumni' },
    secondary: { label: 'Lihat layanan ->', to: '/layanan' },
    stats: {
      labelLeft: 'Respon diterima',
      valueLeft: '1.258',
      labelRight: 'Kuisioner terkirim',
      valueRight: '1.720',
      progress: 70,
      remark: 'Tingkat respon naik 40% setelah pengingat otomatis berjalan.',
      badge: 'Live',
    },
    order: 1,
  },
]

const toArray = (value, fallback = []) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length)
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length)
  }
  return [...fallback]
}

const normalizeStats = (payload = {}, current = {}) => {
  const progressValue = Number.isFinite(Number(payload.progress))
    ? Number(payload.progress)
    : Number(current.progress) || 0

  return {
    labelLeft: payload.labelLeft?.trim() || current.labelLeft || 'Program aktif',
    valueLeft: payload.valueLeft?.toString().trim() || current.valueLeft || '0',
    labelRight: payload.labelRight?.trim() || current.labelRight || 'Mitra industri',
    valueRight: payload.valueRight?.toString().trim() || current.valueRight || '0',
    progress: Math.min(100, Math.max(0, progressValue)),
    remark: payload.remark?.trim() || current.remark || '',
    badge: payload.badge?.trim() || current.badge || 'Live',
  }
}

const normalizeSlide = (payload = {}, current = {}) => {
  const normalizedChips = toArray(payload.chips ?? current.chips ?? [], current.chips || [])
  const primary = {
    label: payload.primary?.label?.trim() || current.primary?.label || 'Aksi utama',
    to: payload.primary?.to?.trim() || current.primary?.to || '/',
  }
  const secondary = {
    label: payload.secondary?.label?.trim() || current.secondary?.label || 'Lihat layanan ->',
    to: payload.secondary?.to?.trim() || current.secondary?.to || '/',
  }

  return {
    id: payload.id || current.id || `cta-${Date.now()}`,
    tag: payload.tag?.trim() || current.tag || 'CTA',
    title: payload.title?.trim() || current.title || 'Judul CTA',
    highlight: payload.highlight?.trim() || current.highlight || '',
    subtitle: payload.subtitle?.trim() || current.subtitle || '',
    chips: normalizedChips,
    primary,
    secondary,
    stats: normalizeStats(payload.stats ?? {}, current.stats ?? {}),
    order: Number.isFinite(payload.order) ? payload.order : current.order ?? state.slides.length,
  }
}

const saveSlides = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.slides))
}

const loadSlides = () => {
  // Default awal supaya UI tidak kosong saat API belum dipanggil
  if (canUseApi) {
    state.slides = defaultSlides.map((item, idx) => normalizeSlide({ ...item, order: item.order ?? idx }, item))
    return
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        state.slides = parsed.map((item, idx) => normalizeSlide({ ...item, order: item.order ?? idx }))
        return
      }
    }
  } catch (err) {
    // ignore parse error and fallback to default
  }

  state.slides = defaultSlides.map((item, idx) => normalizeSlide({ ...item, order: item.order ?? idx }, item))
  saveSlides()
}

loadSlides()

export const useCtaSlides = () => {
  const slides = computed(() =>
    [...state.slides].sort((a, b) => {
      const orderA = Number.isFinite(a.order) ? a.order : 0
      const orderB = Number.isFinite(b.order) ? b.order : 0
      return orderA - orderB
    }),
  )

  const addSlide = (payload) => {
    const slide = normalizeSlide(payload)
    state.slides.push(slide)
    saveSlides()
    return slide.id
  }

  const updateSlide = (id, updates) => {
    const index = state.slides.findIndex((item) => item.id === id)
    if (index === -1) return false

    const current = state.slides[index]
    const updated = normalizeSlide({ ...current, ...updates, id, order: updates.order ?? current.order }, current)
    state.slides.splice(index, 1, updated)
    saveSlides()
    return true
  }

  const deleteSlide = (id) => {
    const index = state.slides.findIndex((item) => item.id === id)
    if (index === -1) return false
    state.slides.splice(index, 1)
    saveSlides()
    return true
  }

  const reorderSlides = (sourceIndex, targetIndex) => {
    if (sourceIndex === targetIndex) return
    const ordered = [...slides.value]
    const [moved] = ordered.splice(sourceIndex, 1)
    ordered.splice(targetIndex, 0, moved)
    state.slides = ordered.map((item, idx) => ({ ...item, order: idx }))
    saveSlides()
  }

  const resetToDefault = () => {
    state.slides = defaultSlides.map((item, idx) => normalizeSlide({ ...item, order: item.order ?? idx }, item))
    saveSlides()
  }

  return {
    slides,
    addSlide,
    updateSlide,
    deleteSlide,
    reorderSlides,
    resetToDefault,
    loading: computed(() => state.loading),
    error: computed(() => state.error),
    fetchSlides: async () => {
      state.loading = true
      state.error = ''
      try {
        if (canUseApi) {
          const resp = await contentService.getCtas()
          const list = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : []
          state.slides =
            list.length > 0
              ? list.map((item, idx) => normalizeSlide({ ...item, order: item.order ?? idx }, item))
              : defaultSlides.map((item, idx) => normalizeSlide({ ...item, order: item.order ?? idx }, item))
          saveSlides()
        }
      } catch (err) {
        state.error = err?.message || 'Gagal memuat CTA'
        if (!state.slides.length) {
          state.slides = defaultSlides.map((item, idx) =>
            normalizeSlide({ ...item, order: item.order ?? idx }, item),
          )
          saveSlides()
        }
      } finally {
        state.loading = false
      }
    },
    syncSlides: async () => {
      if (!canUseApi) return
      state.loading = true
      state.error = ''
      try {
        await contentService.updateCta(state.slides)
      } catch (err) {
        state.error = err?.message || 'Gagal mengirim CTA ke server'
      } finally {
        state.loading = false
      }
    },
  }
}
