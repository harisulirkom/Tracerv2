import { computed, reactive } from 'vue'
import contentService from '@/services/contentService'

const STORAGE_NEWS = 'tracer_admin_news'
const canUseApi = !!import.meta.env.VITE_API_BASE_URL

const state = reactive({
  items: [],
  loading: false,
  error: '',
})

const saveNews = () => {
  localStorage.setItem(STORAGE_NEWS, JSON.stringify(state.items))
}

const loadNews = () => {
  if (canUseApi) {
    state.items = []
    return
  }
  try {
    const raw = localStorage.getItem(STORAGE_NEWS)
    if (raw) {
      state.items = JSON.parse(raw)
    }
  } catch (e) {
    state.items = []
  }

  if (!state.items.length) {
    const baseTime = Date.now()
    state.items = [
      {
        id: baseTime,
        title: 'Tracer Study 2025 resmi diluncurkan',
        summary: 'Pengisian kuisioner tracer study 2025 dibuka untuk seluruh alumni lintas angkatan.',
        content:
          'Kampus membuka tracer study 2025 guna memetakan outcome karier alumni. Partisipasi alumni akan membantu pengembangan kurikulum, akreditasi, dan pemetaan kebutuhan industri. Silakan isi kuisioner melalui portal tracer.',
        imageUrl:
          'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=800&q=60',
        createdAt: new Date(baseTime).toISOString(),
        updatedAt: new Date(baseTime).toISOString(),
        published: true,
      },
      {
        id: baseTime - 1,
        title: 'Career Fair & Campus Hiring 2025',
        summary: 'Lebih dari 30 perusahaan mitra membuka booth rekrutmen di aula kampus minggu depan.',
        content:
          'CDC menggandeng 30+ perusahaan nasional untuk career fair. Alumni dapat membawa CV terbaru, mengikuti sesi coaching singkat, dan melamar langsung di booth. Tersedia jalur magang hingga full-time.',
        imageUrl:
          'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=60',
        createdAt: new Date(baseTime - 1_800_000).toISOString(),
        updatedAt: new Date(baseTime - 1_800_000).toISOString(),
        published: true,
      },
      {
        id: baseTime - 2,
        title: 'Bootcamp Softskill Digital Batch 2',
        summary: 'Program intensif 2 minggu untuk public speaking, presentasi, dan branding profesional.',
        content:
          'CDC membuka pendaftaran Bootcamp Softskill Digital Batch 2. Peserta akan belajar storytelling, presentasi efektif, dan membangun personal brand di LinkedIn. Kuota terbatas, prioritas untuk alumni 2020-2024.',
        imageUrl:
          'https://images.unsplash.com/photo-1529333166433-6761d1b9c83d?auto=format&fit=crop&w=800&q=60',
        createdAt: new Date(baseTime - 3_600_000).toISOString(),
        updatedAt: new Date(baseTime - 3_600_000).toISOString(),
        published: true,
      },
      {
        id: baseTime - 3,
        title: 'Rilis dashboard baru untuk pelacakan alumni',
        summary: 'Dashboard tracer terbaru menampilkan visualisasi serapan kerja, gaji awal, dan sebaran wilayah.',
        content:
          'Tim CDC merilis dashboard interaktif untuk memonitor hasil tracer study secara real-time. Data agregat menampilkan tren serapan kerja, gaji awal, hingga peta sebaran alumni per provinsi. Fitur ini membantu program studi mengambil keputusan berbasis data.',
        imageUrl:
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=60',
        createdAt: new Date(baseTime - 5_400_000).toISOString(),
        updatedAt: new Date(baseTime - 5_400_000).toISOString(),
        published: true,
      },
    ]
    saveNews()
  }
}

loadNews()

export const useNews = () => {
  const items = computed(() =>
    [...state.items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  )

  const addNews = (payload) => {
    const timestamp = Date.now()
    const item = {
      id: timestamp,
      title: payload.title?.trim() || 'Berita tanpa judul',
      summary: payload.summary?.trim() || '',
      content: payload.content?.trim() || '',
      imageUrl: payload.imageUrl?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      published: payload.published ?? true,
    }
    state.items.unshift(item)
    saveNews()
  }

  const updateNews = (id, updates) => {
    const index = state.items.findIndex((item) => item.id === id)
    if (index === -1) return false

    const current = state.items[index]
    const updated = {
      ...current,
      ...updates,
      title: updates.title?.trim() || current.title,
      summary: updates.summary?.trim() ?? current.summary,
      content: updates.content?.trim() ?? current.content,
      imageUrl: updates.imageUrl?.trim() ?? current.imageUrl,
      updatedAt: new Date().toISOString(),
    }

    state.items.splice(index, 1, updated)
    saveNews()
    return true
  }

  const deleteNews = (id) => {
    const index = state.items.findIndex((item) => item.id === id)
    if (index === -1) return false
    state.items.splice(index, 1)
    saveNews()
    return true
  }

  const fetchNews = async (params = {}) => {
    state.loading = true
    state.error = ''
    try {
      if (canUseApi) {
        const resp = await contentService.getNews(params)
        const list =
          Array.isArray(resp) ? resp : Array.isArray(resp?.data) ? resp.data : Array.isArray(resp?.items) ? resp.items : []
        state.items = list
        saveNews()
      }
    } catch (err) {
      state.error = err?.message || 'Gagal memuat berita'
    } finally {
      state.loading = false
    }
  }

  const createNews = async (payload) => {
    if (canUseApi) {
      const resp = await contentService.createNews(payload)
      const item = resp?.data || resp
      if (item) {
        state.items.unshift(item)
        saveNews()
        return item
      }
    }
    addNews(payload)
    return null
  }

  const updateNewsApi = async (id, updates) => {
    if (canUseApi) {
      const resp = await contentService.updateNews(id, updates)
      const item = resp?.data || resp
      if (item) {
        const index = state.items.findIndex((n) => n.id === id)
        if (index !== -1) state.items.splice(index, 1, item)
        saveNews()
        return true
      }
    }
    return updateNews(id, updates)
  }

  const deleteNewsApi = async (id) => {
    if (canUseApi) {
      await contentService.deleteNews(id)
    }
    return deleteNews(id)
  }

  return {
    news: items,
    addNews,
    updateNews,
    deleteNews,
    fetchNews,
    createNews,
    updateNewsApi,
    deleteNewsApi,
    loading: computed(() => state.loading),
    error: computed(() => state.error),
  }
}
