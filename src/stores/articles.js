import { computed, reactive } from 'vue'
import contentService from '@/services/contentService'

const STORAGE_ARTICLES = 'cdc_articles'
const canUseApi = !!import.meta.env.VITE_API_BASE_URL

const DEFAULT_ARTICLES = [
  {
    id: 'tips-cv',
    title: 'Tips membuat CV',
    summary: 'Struktur CV singkat, poin prestasi, dan contoh kata kerja aktif agar lolos screening ATS.',
    content:
      'Gunakan struktur singkat: ringkasan profil, pengalaman relevan, pendidikan, dan skill. Sorot prestasi terukur (contoh: meningkatkan efisiensi 20%). Pakai kata kerja aktif seperti "mengelola", "mengoptimalkan", "merancang". Sesuaikan dengan deskripsi lowongan. Tambahkan tautan portofolio bila ada.',
    imageUrl: 'https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=800&q=60',
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tips-interview',
    title: 'Persiapan interview',
    summary: 'Checklist riset perusahaan, jawaban STAR, dan etika komunikasi di sesi daring maupun onsite.',
    content:
      'Siapkan riset perusahaan (produk, model bisnis, kompetitor). Latih jawaban STAR untuk pengalaman kerja. Pastikan koneksi/studio online rapi. Siapkan pertanyaan balik tentang peran. Jaga kontak mata, bahasa tubuh, dan follow-up email singkat setelah wawancara.',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tips-etika',
    title: 'Etika kerja',
    summary: 'Kebiasaan profesional, manajemen waktu, dan komunikasi efektif di tempat kerja.',
    content:
      'Datang tepat waktu, komunikasikan progres secara proaktif, dan gunakan kanal resmi. Dokumentasikan keputusan, hormati jadwal rapat, dan kelola prioritas dengan to-do list. Jaga etika digital: pesan singkat, sopan, dan jelas.',
    imageUrl: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=800&q=80',
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tips-pasar',
    title: 'Analisis pasar kerja',
    summary: 'Cara membaca tren industri, gaji, dan skill yang paling dicari untuk memetakan peluang.',
    content:
      'Gunakan sumber data seperti laporan gaji, portal lowongan, dan indeks keterampilan. Catat peran yang naik daun dan sertifikasi yang dibutuhkan. Bandingkan rentang gaji per lokasi dan skema kerja (remote/hybrid). Susun rencana upskilling berdasar gap skill.',
    imageUrl: 'https://images.unsplash.com/photo-1454165205744-3b78555e5572?auto=format&fit=crop&w=800&q=80',
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const state = reactive({
  items: [],
  loading: false,
  error: '',
})

const saveArticles = () => {
  localStorage.setItem(STORAGE_ARTICLES, JSON.stringify(state.items))
}

const loadArticles = () => {
  if (canUseApi) {
    state.items = []
    return
  }
  try {
    const raw = localStorage.getItem(STORAGE_ARTICLES)
    if (raw) {
      state.items = JSON.parse(raw)
    }
  } catch (e) {
    state.items = []
  }

  if (!Array.isArray(state.items) || !state.items.length) {
    state.items = [...DEFAULT_ARTICLES]
    saveArticles()
  }
}

loadArticles()

export const useArticles = () => {
  const items = computed(() =>
    [...state.items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  )

  const fetchArticles = async (params = {}) => {
    state.loading = true
    state.error = ''
    try {
      if (canUseApi) {
        const resp = await contentService.getNews(params) // reuse news endpoint for artikel/berita
        const list = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : []
        state.items = list
        saveArticles()
        return
      }
      if (!state.items.length) loadArticles()
    } catch (err) {
      state.error = err?.message || 'Gagal memuat artikel'
      if (!state.items.length) loadArticles()
    } finally {
      state.loading = false
    }
  }

  const addArticle = async (payload) => {
    if (canUseApi) {
      try {
        const resp = await contentService.createNews(payload)
        const item = resp?.data || resp
        if (item) {
          state.items.unshift(item)
          saveArticles()
          return item.id
        }
      } catch (err) {
        state.error = err?.message || 'Gagal menambah artikel'
      }
    }
    const id = payload.id || (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString())
    const now = new Date().toISOString()
    state.items.unshift({
      id,
      title: payload.title?.trim() || 'Artikel tanpa judul',
      summary: payload.summary?.trim() || '',
      content: payload.content?.trim() || '',
      imageUrl: payload.imageUrl?.trim() || '',
      published: payload.published ?? true,
      createdAt: now,
      updatedAt: now,
    })
    saveArticles()
    return id
  }

  const updateArticle = async (id, updates) => {
    const index = state.items.findIndex((item) => item.id === id)
    if (index === -1) return false
    if (canUseApi) {
      try {
        const resp = await contentService.updateNews(id, updates)
        const item = resp?.data || resp
        if (item) {
          state.items.splice(index, 1, item)
          saveArticles()
          return true
        }
      } catch (err) {
        state.error = err?.message || 'Gagal memperbarui artikel'
      }
    }
    const current = state.items[index]
    state.items[index] = {
      ...current,
      ...updates,
      id,
      title: updates.title?.trim() || current.title,
      summary: updates.summary?.trim() ?? current.summary,
      content: updates.content?.trim() ?? current.content,
      imageUrl: updates.imageUrl?.trim() ?? current.imageUrl,
      published: updates.published ?? current.published,
      updatedAt: new Date().toISOString(),
    }
    saveArticles()
    return true
  }

  const deleteArticle = async (id) => {
    const index = state.items.findIndex((item) => item.id === id)
    if (index === -1) return false
    if (canUseApi) {
      try {
        await contentService.deleteNews(id)
      } catch (err) {
        state.error = err?.message || 'Gagal menghapus artikel'
      }
    }
    state.items.splice(index, 1)
    saveArticles()
    return true
  }

  return {
    articles: items,
    addArticle,
    updateArticle,
    deleteArticle,
    fetchArticles,
    loading: computed(() => state.loading),
    error: computed(() => state.error),
  }
}
