<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import AdminShell from '../components/AdminShell.vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import alumniHubService from '../services/alumniHubService'

const defaultContent = {
  gallery: {
    eyebrow: 'Kegiatan Alumni',
    title: 'Galeri Kegiatan Alumni',
    buttonLabel: 'Lihat Semua Galeri',
    buttonUrl: '/coming-soon/galeri-alumni',
    items: [],
  },
  agenda: {
    eyebrow: 'Agenda Komunitas',
    title: 'Agenda & Acara Alumni',
    subtitle: 'Ikuti agenda terbaru untuk memperluas jejaring, mengembangkan diri, dan berkontribusi untuk kampus.',
    buttonLabel: 'Lihat Semua Acara',
    buttonUrl: '/coming-soon/acara-alumni',
    items: [],
  },
}

const content = reactive(JSON.parse(JSON.stringify(defaultContent)))
const loading = ref(false)
const saving = ref(false)
const message = ref('')
const error = ref('')
const activeTab = ref('gallery')
const gallerySearch = ref('')
const eventSearch = ref('')
const galleryPage = ref(1)
const eventPage = ref(1)
const galleryPerPage = 5
const eventPerPage = 4

const modal = reactive({
  open: false,
  type: 'gallery',
  mode: 'create',
  index: -1,
})

const deleteDialog = reactive({
  open: false,
  type: 'gallery',
  index: -1,
  title: '',
})

const form = reactive({
  title: '',
  date: '',
  time: '',
  place: '',
  category: '',
  description: '',
  imageUrl: '',
  moreLabel: '',
})

const galleryCategories = ['Seminar', 'Talkshow', 'Workshop', 'Diskusi', 'Komunitas']
const eventCategories = ['Sharing Session', 'Pengembangan Diri', 'Pengabdian', 'Networking']

const clonePlain = (value) => JSON.parse(JSON.stringify(value))

const applyContent = (incoming = {}) => {
  content.gallery = {
    ...defaultContent.gallery,
    ...(incoming.gallery || {}),
    items: Array.isArray(incoming.gallery?.items) ? incoming.gallery.items : [],
  }
  content.agenda = {
    ...defaultContent.agenda,
    ...(incoming.agenda || {}),
    items: Array.isArray(incoming.agenda?.items) ? incoming.agenda.items : [],
  }
}

const resetForm = () => {
  form.title = ''
  form.date = ''
  form.time = ''
  form.place = ''
  form.category = ''
  form.description = ''
  form.imageUrl = ''
  form.moreLabel = ''
}

const loadContent = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await alumniHubService.getAdminAlumniHubContent()
    applyContent(response?.content || response || {})
  } catch (err) {
    error.value = err?.response?.data?.message || err?.message || 'Gagal memuat konten alumni.'
  } finally {
    loading.value = false
  }
}

const persistContent = async (successMessage) => {
  saving.value = true
  message.value = ''
  error.value = ''
  try {
    await alumniHubService.updateAdminAlumniHubContent({
      gallery: clonePlain(content.gallery),
      agenda: clonePlain(content.agenda),
    })
    message.value = successMessage
    await loadContent()
    return true
  } catch (err) {
    const validation = err?.response?.data?.errors
    error.value =
      validation ? Object.values(validation).flat().join(' ') : err?.response?.data?.message || err?.message || 'Gagal menyimpan konten alumni.'
    await loadContent()
    return false
  } finally {
    saving.value = false
  }
}

const filteredGallery = computed(() => {
  const keyword = gallerySearch.value.trim().toLowerCase()
  if (!keyword) return content.gallery.items
  return content.gallery.items.filter((item) =>
    [item.title, item.category, item.label, item.description].some((value) => String(value || '').toLowerCase().includes(keyword)),
  )
})

const filteredEvents = computed(() => {
  const keyword = eventSearch.value.trim().toLowerCase()
  if (!keyword) return content.agenda.items
  return content.agenda.items.filter((item) =>
    [item.title, item.tag, item.place, item.time, item.date].some((value) => String(value || '').toLowerCase().includes(keyword)),
  )
})

const pageCount = (total, perPage) => Math.max(1, Math.ceil(total / perPage))
const galleryPageCount = computed(() => pageCount(filteredGallery.value.length, galleryPerPage))
const eventPageCount = computed(() => pageCount(filteredEvents.value.length, eventPerPage))
const paginatedGallery = computed(() => filteredGallery.value.slice((galleryPage.value - 1) * galleryPerPage, galleryPage.value * galleryPerPage))
const paginatedEvents = computed(() => filteredEvents.value.slice((eventPage.value - 1) * eventPerPage, eventPage.value * eventPerPage))

const setPage = (type, page) => {
  if (type === 'gallery') {
    galleryPage.value = Math.min(Math.max(1, page), galleryPageCount.value)
  } else {
    eventPage.value = Math.min(Math.max(1, page), eventPageCount.value)
  }
}

const openCreateModal = (type) => {
  resetForm()
  modal.open = true
  modal.type = type
  modal.mode = 'create'
  modal.index = -1
  form.category = type === 'gallery' ? 'Seminar' : 'Networking'
}

const openEditModal = (type, item) => {
  resetForm()
  const source = type === 'gallery' ? content.gallery.items : content.agenda.items
  const index = source.indexOf(item)
  modal.open = true
  modal.type = type
  modal.mode = 'edit'
  modal.index = index
  form.title = item.title || ''
  form.date = type === 'gallery' ? item.label || '' : item.date || ''
  form.time = item.time || ''
  form.place = item.place || ''
  form.category = type === 'gallery' ? item.category || 'Seminar' : item.tag || 'Networking'
  form.description = item.description || ''
  form.imageUrl = item.imageUrl || ''
  form.moreLabel = item.moreLabel || ''
}

const closeModal = () => {
  modal.open = false
  modal.index = -1
}

const eventColor = (category) => {
  const map = {
    'Sharing Session': 'from-blue-500 to-sky-400',
    'Pengembangan Diri': 'from-orange-500 to-amber-400',
    Pengabdian: 'from-violet-500 to-purple-400',
    Networking: 'from-emerald-500 to-teal-400',
  }
  return map[category] || 'from-sky-500 to-cyan-400'
}

const saveModal = async () => {
  if (!form.title.trim()) {
    error.value = modal.type === 'gallery' ? 'Judul galeri wajib diisi.' : 'Judul event wajib diisi.'
    return
  }

  const nextItem =
    modal.type === 'gallery'
      ? {
          title: form.title.trim(),
          label: form.date.trim(),
          category: form.category.trim(),
          description: form.description.trim(),
          imageUrl: form.imageUrl.trim(),
          moreLabel: form.moreLabel.trim(),
        }
      : {
          title: form.title.trim(),
          date: form.date.trim(),
          time: form.time.trim(),
          place: form.place.trim(),
          tag: form.category.trim(),
          color: eventColor(form.category.trim()),
          description: form.description.trim(),
          imageUrl: form.imageUrl.trim(),
        }

  const target = modal.type === 'gallery' ? content.gallery.items : content.agenda.items
  if (modal.mode === 'edit' && modal.index >= 0) {
    target.splice(modal.index, 1, nextItem)
  } else {
    target.unshift(nextItem)
  }

  const ok = await persistContent(modal.type === 'gallery' ? 'Data galeri berhasil disimpan.' : 'Data event berhasil disimpan.')
  if (ok) closeModal()
}

const openDeleteDialog = (type, item) => {
  const source = type === 'gallery' ? content.gallery.items : content.agenda.items
  deleteDialog.open = true
  deleteDialog.type = type
  deleteDialog.index = source.indexOf(item)
  deleteDialog.title = item.title || 'Konten'
}

const closeDeleteDialog = () => {
  deleteDialog.open = false
  deleteDialog.index = -1
}

const confirmDelete = async () => {
  const target = deleteDialog.type === 'gallery' ? content.gallery.items : content.agenda.items
  if (deleteDialog.index >= 0) target.splice(deleteDialog.index, 1)
  const ok = await persistContent(deleteDialog.type === 'gallery' ? 'Galeri berhasil dihapus.' : 'Event berhasil dihapus.')
  if (ok) closeDeleteDialog()
}

const processFile = (file) => {
  if (!file) return
  if (!file.type.startsWith('image/')) {
    error.value = 'File harus berupa gambar.'
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    error.value = 'Ukuran gambar maksimal 2 MB.'
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    form.imageUrl = String(reader.result || '')
  }
  reader.readAsDataURL(file)
}

const handleUpload = (event) => {
  processFile(event.target.files?.[0])
}

const handleDrop = (event) => {
  processFile(event.dataTransfer?.files?.[0])
}

const categoryClass = (category) => {
  const map = {
    Seminar: 'bg-blue-50 text-blue-700 ring-blue-100',
    Talkshow: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    Workshop: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
    Diskusi: 'bg-violet-50 text-violet-700 ring-violet-100',
    Komunitas: 'bg-orange-50 text-orange-700 ring-orange-100',
    'Sharing Session': 'bg-blue-50 text-blue-700 ring-blue-100',
    'Pengembangan Diri': 'bg-orange-50 text-orange-700 ring-orange-100',
    Pengabdian: 'bg-violet-50 text-violet-700 ring-violet-100',
    Networking: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  }
  return map[category] || 'bg-slate-50 text-slate-700 ring-slate-100'
}

const dateBadgeClass = (index) => {
  const classes = [
    'from-emerald-500 to-teal-400',
    'from-blue-600 to-sky-400',
    'from-orange-500 to-amber-400',
    'from-violet-600 to-purple-400',
  ]
  return classes[index % classes.length]
}

const splitDate = (value) => {
  const parts = String(value || '-').split(' ').filter(Boolean)
  return {
    day: parts[0] || '-',
    month: parts[1] || '',
    year: parts[2] || '',
  }
}

const rowNumber = (page, perPage, index) => (page - 1) * perPage + index + 1

onMounted(loadContent)
</script>

<template>
  <AdminShell>
    <div class="relative min-h-screen bg-[#f7fbff] px-4 py-5 sm:px-6 lg:px-8">
      <LoadingOverlay :show="loading" label="Memuat konten alumni..." />

      <div class="mx-auto max-w-7xl space-y-6">
        <header class="rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-[0_20px_60px_rgba(37,99,235,0.08)] backdrop-blur-xl">
          <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex items-start gap-4">
              <button type="button" class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-100 transition hover:bg-blue-50 hover:text-blue-700">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                  <path d="M4 7h16M4 12h16M4 17h10" />
                </svg>
              </button>
              <div>
                <div class="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                  <span>Dashboard</span>
                  <span>></span>
                  <span class="text-blue-700">Pojok Alumni</span>
                </div>
                <h1 class="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">Pojok Alumni</h1>
                <p class="mt-1 text-sm text-slate-500">Kelola konten galeri dan event pada halaman Pojok Alumni</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button type="button" class="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-100 transition hover:bg-blue-50 hover:text-blue-700">
                <span class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">3</span>
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>
              <a href="/alumni" target="_blank" rel="noreferrer" class="hidden rounded-2xl border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 sm:inline-flex">
                Preview halaman
              </a>
            </div>
          </div>

          <nav class="mt-6 flex gap-8 border-b border-slate-100">
            <button
              type="button"
              class="relative pb-4 text-sm font-semibold transition"
              :class="activeTab === 'gallery' ? 'text-blue-700' : 'text-slate-500 hover:text-slate-900'"
              @click="activeTab = 'gallery'"
            >
              Galeri
              <span v-if="activeTab === 'gallery'" class="absolute inset-x-0 -bottom-px h-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"></span>
            </button>
            <button
              type="button"
              class="relative pb-4 text-sm font-semibold transition"
              :class="activeTab === 'event' ? 'text-blue-700' : 'text-slate-500 hover:text-slate-900'"
              @click="activeTab = 'event'"
            >
              Event
              <span v-if="activeTab === 'event'" class="absolute inset-x-0 -bottom-px h-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"></span>
            </button>
          </nav>
        </header>

        <div v-if="message" class="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
          {{ message }}
        </div>
        <div v-if="error" class="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
          {{ error }}
        </div>

        <section v-show="activeTab === 'gallery'" class="rounded-[28px] border border-slate-100 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-5">
          <div class="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 class="text-lg font-semibold text-slate-950">Manajemen Galeri</h2>
              <p class="mt-1 text-sm text-slate-500">Kelola foto kegiatan alumni yang ditampilkan pada halaman Pojok Alumni.</p>
            </div>
            <div class="flex flex-col gap-3 sm:flex-row">
              <label class="flex h-11 min-w-[260px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-500 shadow-sm focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50">
                <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input v-model="gallerySearch" class="w-full bg-transparent outline-none" placeholder="Cari galeri..." @input="galleryPage = 1" />
              </label>
              <button type="button" class="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:shadow-blue-300" @click="openCreateModal('gallery')">
                <span class="text-xl leading-none">+</span>
                Tambah Galeri
              </button>
            </div>
          </div>

          <div class="overflow-hidden rounded-3xl border border-slate-100">
            <div class="overflow-x-auto">
              <table class="min-w-[900px] w-full text-left text-sm">
                <thead class="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th class="w-16 px-5 py-4">No</th>
                    <th class="w-44 px-5 py-4">Preview Foto</th>
                    <th class="px-5 py-4">Judul</th>
                    <th class="w-44 px-5 py-4">Tanggal</th>
                    <th class="w-40 px-5 py-4">Kategori</th>
                    <th class="w-36 px-5 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-700">
                  <tr v-for="(item, index) in paginatedGallery" :key="`${item.title}-${index}`" class="transition hover:bg-blue-50/40">
                    <td class="px-5 py-4 font-medium text-slate-500">{{ rowNumber(galleryPage, galleryPerPage, index) }}</td>
                    <td class="px-5 py-4">
                      <img v-if="item.imageUrl" :src="item.imageUrl" alt="" class="h-14 w-28 rounded-xl object-cover shadow-sm ring-1 ring-slate-100" />
                      <div v-else class="flex h-14 w-28 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400">No image</div>
                    </td>
                    <td class="px-5 py-4 font-semibold text-slate-800">{{ item.title || '-' }}</td>
                    <td class="px-5 py-4">{{ item.label || '-' }}</td>
                    <td class="px-5 py-4">
                      <span class="rounded-full px-3 py-1 text-xs font-semibold ring-1" :class="categoryClass(item.category)">
                        {{ item.category || 'Seminar' }}
                      </span>
                    </td>
                    <td class="px-5 py-4">
                      <div class="flex justify-center gap-2">
                        <button type="button" class="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600 transition hover:bg-blue-50" aria-label="Edit galeri" @click="openEditModal('gallery', item)">
                          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </svg>
                        </button>
                        <button type="button" class="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 bg-white text-rose-600 transition hover:bg-rose-50" aria-label="Hapus galeri" @click="openDeleteDialog('gallery', item)">
                          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 14H6L5 6" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="!paginatedGallery.length">
                    <td colspan="6" class="px-5 py-12 text-center text-sm text-slate-500">Belum ada data galeri.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p class="text-sm text-slate-500">
                Menampilkan {{ paginatedGallery.length ? rowNumber(galleryPage, galleryPerPage, 0) : 0 }}-{{ Math.min(galleryPage * galleryPerPage, filteredGallery.length) }} dari {{ filteredGallery.length }} data
              </p>
              <div class="flex items-center gap-2">
                <button type="button" class="h-9 w-9 rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50" @click="setPage('gallery', galleryPage - 1)">&lt;</button>
                <button v-for="page in galleryPageCount" :key="page" type="button" class="h-9 w-9 rounded-xl text-sm font-semibold transition" :class="page === galleryPage ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'" @click="setPage('gallery', page)">
                  {{ page }}
                </button>
                <button type="button" class="h-9 w-9 rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50" @click="setPage('gallery', galleryPage + 1)">&gt;</button>
              </div>
            </div>
          </div>
        </section>

        <section v-show="activeTab === 'event'" class="rounded-[28px] border border-slate-100 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-5">
          <div class="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 class="text-lg font-semibold text-slate-950">Manajemen Event</h2>
              <p class="mt-1 text-sm text-slate-500">Kelola agenda dan acara alumni yang ditampilkan pada halaman Pojok Alumni.</p>
            </div>
            <div class="flex flex-col gap-3 sm:flex-row">
              <label class="flex h-11 min-w-[260px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-500 shadow-sm focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50">
                <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input v-model="eventSearch" class="w-full bg-transparent outline-none" placeholder="Cari event..." @input="eventPage = 1" />
              </label>
              <button type="button" class="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:shadow-blue-300" @click="openCreateModal('event')">
                <span class="text-xl leading-none">+</span>
                Tambah Event
              </button>
            </div>
          </div>

          <div class="overflow-hidden rounded-3xl border border-slate-100">
            <div class="overflow-x-auto">
              <table class="min-w-[980px] w-full text-left text-sm">
                <thead class="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th class="w-16 px-5 py-4">No</th>
                    <th class="w-36 px-5 py-4">Tanggal</th>
                    <th class="px-5 py-4">Judul Event</th>
                    <th class="w-44 px-5 py-4">Waktu</th>
                    <th class="w-64 px-5 py-4">Lokasi</th>
                    <th class="w-44 px-5 py-4">Kategori</th>
                    <th class="w-36 px-5 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-700">
                  <tr v-for="(item, index) in paginatedEvents" :key="`${item.title}-${index}`" class="transition hover:bg-blue-50/40">
                    <td class="px-5 py-4 font-medium text-slate-500">{{ rowNumber(eventPage, eventPerPage, index) }}</td>
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-3">
                        <div :class="['flex h-12 w-12 flex-col items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm', dateBadgeClass(index)]">
                          <span class="text-base font-bold leading-none">{{ splitDate(item.date).day }}</span>
                          <span class="mt-1 text-[9px] font-semibold uppercase leading-none">{{ splitDate(item.date).month }}</span>
                        </div>
                        <span class="text-xs font-medium text-slate-500">{{ splitDate(item.date).year }}</span>
                      </div>
                    </td>
                    <td class="px-5 py-4 font-semibold text-slate-800">{{ item.title || '-' }}</td>
                    <td class="px-5 py-4">{{ item.time || '-' }}</td>
                    <td class="px-5 py-4">
                      <p>{{ item.place || '-' }}</p>
                      <p v-if="item.description" class="mt-1 line-clamp-1 text-xs text-slate-400">{{ item.description }}</p>
                    </td>
                    <td class="px-5 py-4">
                      <span class="rounded-full px-3 py-1 text-xs font-semibold ring-1" :class="categoryClass(item.tag)">
                        {{ item.tag || 'Networking' }}
                      </span>
                    </td>
                    <td class="px-5 py-4">
                      <div class="flex justify-center gap-2">
                        <button type="button" class="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600 transition hover:bg-blue-50" aria-label="Edit event" @click="openEditModal('event', item)">
                          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </svg>
                        </button>
                        <button type="button" class="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 bg-white text-rose-600 transition hover:bg-rose-50" aria-label="Hapus event" @click="openDeleteDialog('event', item)">
                          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 14H6L5 6" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="!paginatedEvents.length">
                    <td colspan="7" class="px-5 py-12 text-center text-sm text-slate-500">Belum ada data event.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p class="text-sm text-slate-500">
                Menampilkan {{ paginatedEvents.length ? rowNumber(eventPage, eventPerPage, 0) : 0 }}-{{ Math.min(eventPage * eventPerPage, filteredEvents.length) }} dari {{ filteredEvents.length }} data
              </p>
              <div class="flex items-center gap-2">
                <button type="button" class="h-9 w-9 rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50" @click="setPage('event', eventPage - 1)">&lt;</button>
                <button v-for="page in eventPageCount" :key="page" type="button" class="h-9 w-9 rounded-xl text-sm font-semibold transition" :class="page === eventPage ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'" @click="setPage('event', page)">
                  {{ page }}
                </button>
                <button type="button" class="h-9 w-9 rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50" @click="setPage('event', eventPage + 1)">&gt;</button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div v-if="modal.open" class="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm" @click.self="closeModal">
        <div class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/80 bg-white/92 p-5 shadow-2xl shadow-slate-900/20 backdrop-blur-xl sm:p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">{{ modal.type === 'gallery' ? 'Galeri' : 'Event' }}</p>
              <h3 class="mt-1 text-xl font-semibold text-slate-950">{{ modal.mode === 'edit' ? 'Edit data' : 'Tambah data baru' }}</h3>
            </div>
            <button type="button" class="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200" @click="closeModal">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <div
            class="mt-5 flex min-h-36 flex-col items-center justify-center rounded-[24px] border border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-5 text-center transition hover:border-blue-300"
            @drop.prevent="handleDrop"
            @dragover.prevent
          >
            <img v-if="form.imageUrl" :src="form.imageUrl" alt="" class="mb-4 max-h-40 rounded-2xl object-cover shadow-sm" />
            <svg v-else class="mb-3 h-9 w-9 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M12 16V4" />
              <path d="M7 9l5-5 5 5" />
              <path d="M20 16.5V20H4v-3.5" />
            </svg>
            <p class="text-sm font-semibold text-slate-800">Drag & drop gambar atau pilih file</p>
            <p class="mt-1 text-xs text-slate-500">PNG, JPG, WEBP maksimal 2 MB. Bisa juga isi URL gambar di bawah.</p>
            <label class="mt-4 inline-flex cursor-pointer rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50">
              Pilih gambar
              <input type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="handleUpload" />
            </label>
          </div>

          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <label class="grid gap-1 text-sm font-semibold text-slate-700 sm:col-span-2">
              {{ modal.type === 'gallery' ? 'Judul kegiatan' : 'Judul event' }}
              <input v-model="form.title" class="rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
            </label>
            <label class="grid gap-1 text-sm font-semibold text-slate-700">
              Tanggal
              <input v-model="form.date" placeholder="20 April 2026" class="rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
            </label>
            <label class="grid gap-1 text-sm font-semibold text-slate-700">
              Kategori
              <select v-model="form.category" class="rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50">
                <option v-for="category in modal.type === 'gallery' ? galleryCategories : eventCategories" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </label>
            <label v-if="modal.type === 'event'" class="grid gap-1 text-sm font-semibold text-slate-700">
              Waktu
              <input v-model="form.time" placeholder="08.00 - 12.00 WIB" class="rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
            </label>
            <label v-if="modal.type === 'event'" class="grid gap-1 text-sm font-semibold text-slate-700">
              Lokasi
              <input v-model="form.place" placeholder="Auditorium Lt. 4" class="rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
            </label>
            <label class="grid gap-1 text-sm font-semibold text-slate-700 sm:col-span-2">
              URL gambar
              <input v-model="form.imageUrl" placeholder="https://..." class="rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
            </label>
            <label v-if="modal.type === 'gallery'" class="grid gap-1 text-sm font-semibold text-slate-700 sm:col-span-2">
              Label tambahan
              <input v-model="form.moreLabel" placeholder="+12 Foto Lainnya, opsional" class="rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
            </label>
            <label class="grid gap-1 text-sm font-semibold text-slate-700 sm:col-span-2">
              Deskripsi singkat
              <textarea v-model="form.description" rows="3" class="rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"></textarea>
            </label>
          </div>

          <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" @click="closeModal">
              Batal
            </button>
            <button type="button" class="rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60" :disabled="saving" @click="saveModal">
              {{ saving ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="deleteDialog.open" class="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm" @click.self="closeDeleteDialog">
        <div class="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl shadow-slate-900/20">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="M19 6l-1 14H6L5 6" />
            </svg>
          </div>
          <h3 class="mt-4 text-lg font-semibold text-slate-950">Hapus data ini?</h3>
          <p class="mt-2 text-sm leading-6 text-slate-500">Data "{{ deleteDialog.title }}" akan dihapus dari halaman Pojok Alumni.</p>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" @click="closeDeleteDialog">
              Batal
            </button>
            <button type="button" class="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60" :disabled="saving" @click="confirmDelete">
              {{ saving ? 'Menghapus...' : 'Hapus' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </AdminShell>
</template>
