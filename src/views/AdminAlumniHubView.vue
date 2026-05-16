<script setup>
import { onMounted, reactive, ref } from 'vue'
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

const addGalleryItem = () => {
  content.gallery.items.push({
    title: '',
    label: '',
    description: '',
    imageUrl: '',
    moreLabel: '',
  })
}

const addAgendaItem = () => {
  content.agenda.items.push({
    title: '',
    date: '',
    time: '',
    place: '',
    tag: '',
    color: 'from-sky-500 to-cyan-400',
    imageUrl: '',
  })
}

const removeAt = (items, index) => {
  items.splice(index, 1)
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

const saveContent = async () => {
  saving.value = true
  message.value = ''
  error.value = ''
  try {
    await alumniHubService.updateAdminAlumniHubContent({
      gallery: clonePlain(content.gallery),
      agenda: clonePlain(content.agenda),
    })
    message.value = 'Konten galeri dan agenda alumni berhasil disimpan.'
    await loadContent()
  } catch (err) {
    const validation = err?.response?.data?.errors
    error.value =
      validation ? Object.values(validation).flat().join(' ') : err?.response?.data?.message || err?.message || 'Gagal menyimpan konten alumni.'
  } finally {
    saving.value = false
  }
}

onMounted(loadContent)
</script>

<template>
  <AdminShell>
    <div class="relative max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-10">
      <LoadingOverlay :show="loading" label="Memuat konten alumni..." />

      <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Konten Alumni</p>
          <h1 class="mt-1 text-2xl font-semibold text-slate-900">Kelola galeri dan kegiatan alumni</h1>
          <p class="mt-1 text-sm text-slate-500">Admin hanya mengatur konten galeri dan agenda pada halaman publik /alumni.</p>
        </div>
        <a
          href="/alumni"
          target="_blank"
          rel="noreferrer"
          class="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Preview halaman
        </a>
      </header>

      <div v-if="message" class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
        {{ message }}
      </div>
      <div v-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
        {{ error }}
      </div>

      <form class="space-y-6" @submit.prevent="saveContent">
        <section class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-base font-semibold text-slate-900">Galeri kegiatan alumni</h2>
              <p class="mt-1 text-xs text-slate-500">Foto pertama akan tampil sebagai foto utama besar.</p>
            </div>
            <button type="button" class="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800" @click="addGalleryItem">
              Tambah foto
            </button>
          </div>

          <div class="mt-4 grid gap-4 lg:grid-cols-2">
            <label class="grid gap-1 text-sm font-semibold text-slate-700">
              Eyebrow
              <input v-model="content.gallery.eyebrow" class="rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-slate-400" />
            </label>
            <label class="grid gap-1 text-sm font-semibold text-slate-700">
              Judul section
              <input v-model="content.gallery.title" class="rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-slate-400" />
            </label>
            <label class="grid gap-1 text-sm font-semibold text-slate-700">
              Label tombol
              <input v-model="content.gallery.buttonLabel" class="rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-slate-400" />
            </label>
            <label class="grid gap-1 text-sm font-semibold text-slate-700">
              Link tombol
              <input v-model="content.gallery.buttonUrl" class="rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-slate-400" />
            </label>
          </div>

          <div class="mt-5 space-y-4">
            <article v-for="(item, index) in content.gallery.items" :key="index" class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div class="mb-3 flex items-center justify-between">
                <p class="text-sm font-semibold text-slate-700">Foto galeri {{ index + 1 }}</p>
                <button type="button" class="text-xs font-semibold text-rose-600" @click="removeAt(content.gallery.items, index)">Hapus</button>
              </div>
              <div class="grid gap-3 lg:grid-cols-2">
                <input v-model="item.title" placeholder="Judul foto" class="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400" />
                <input v-model="item.label" placeholder="Badge tanggal, opsional" class="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400" />
                <input v-model="item.moreLabel" placeholder="Label + foto lainnya, opsional" class="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400" />
                <input v-model="item.imageUrl" placeholder="URL gambar" class="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400" />
                <textarea v-model="item.description" rows="2" placeholder="Deskripsi singkat" class="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400 lg:col-span-2"></textarea>
              </div>
            </article>
          </div>
        </section>

        <section class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-base font-semibold text-slate-900">Agenda & acara alumni</h2>
              <p class="mt-1 text-xs text-slate-500">Konten ini tampil sebagai carousel kegiatan pada halaman alumni.</p>
            </div>
            <button type="button" class="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800" @click="addAgendaItem">
              Tambah agenda
            </button>
          </div>

          <div class="mt-4 grid gap-4 lg:grid-cols-2">
            <input v-model="content.agenda.eyebrow" placeholder="Eyebrow" class="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400" />
            <input v-model="content.agenda.title" placeholder="Judul section" class="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400" />
            <input v-model="content.agenda.buttonLabel" placeholder="Label tombol" class="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400" />
            <input v-model="content.agenda.buttonUrl" placeholder="Link tombol" class="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400" />
            <textarea v-model="content.agenda.subtitle" rows="2" placeholder="Subtitle" class="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400 lg:col-span-2"></textarea>
          </div>

          <div class="mt-5 space-y-4">
            <article v-for="(item, index) in content.agenda.items" :key="index" class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div class="mb-3 flex items-center justify-between">
                <p class="text-sm font-semibold text-slate-700">Agenda {{ index + 1 }}</p>
                <button type="button" class="text-xs font-semibold text-rose-600" @click="removeAt(content.agenda.items, index)">Hapus</button>
              </div>
              <div class="grid gap-3 lg:grid-cols-2">
                <input v-model="item.title" placeholder="Nama acara" class="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400" />
                <input v-model="item.date" placeholder="Tanggal badge" class="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400" />
                <input v-model="item.time" placeholder="Jam kegiatan" class="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400" />
                <input v-model="item.place" placeholder="Lokasi" class="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400" />
                <input v-model="item.tag" placeholder="Kategori" class="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400" />
                <input v-model="item.color" placeholder="Class gradient warna" class="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400" />
                <input v-model="item.imageUrl" placeholder="URL gambar" class="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400 lg:col-span-2" />
              </div>
            </article>
          </div>
        </section>

        <div class="sticky bottom-4 z-10 flex justify-end">
          <button
            type="submit"
            class="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="saving"
          >
            {{ saving ? 'Menyimpan...' : 'Simpan galeri & kegiatan' }}
          </button>
        </div>
      </form>
    </div>
  </AdminShell>
</template>
