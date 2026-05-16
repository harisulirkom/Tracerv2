<script setup>
import { onMounted, reactive, ref } from 'vue'
import AdminShell from '../components/AdminShell.vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import alumniHubService from '../services/alumniHubService'

const defaultContent = {
  hero: {
    badge: 'Pojok Alumni',
    headlinePrefix: 'Bersama',
    headlineHighlight: 'Alumni',
    headlineSuffix: 'Membangun Masa Depan yang Lebih Baik',
    description: '',
    imageUrl: '',
    testimonial: '',
    testimonialLabel: 'Alumni Community Hub',
  },
  features: [],
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
    subtitle: '',
    buttonLabel: 'Lihat Semua Acara',
    buttonUrl: '/coming-soon/acara-alumni',
    items: [],
  },
  cta: {
    title: '',
    description: '',
    buttonLabel: 'Perbarui Data Alumni',
    buttonUrl: '/kuisioner/alumni',
  },
}

const content = reactive(structuredClone(defaultContent))
const loading = ref(false)
const saving = ref(false)
const message = ref('')
const error = ref('')

const mergeContent = (incoming = {}) => ({
  ...defaultContent,
  ...incoming,
  hero: { ...defaultContent.hero, ...(incoming.hero || {}) },
  gallery: { ...defaultContent.gallery, ...(incoming.gallery || {}) },
  agenda: { ...defaultContent.agenda, ...(incoming.agenda || {}) },
  cta: { ...defaultContent.cta, ...(incoming.cta || {}) },
  features: Array.isArray(incoming.features) ? incoming.features : [],
})

const applyContent = (incoming) => {
  const next = mergeContent(incoming)
  content.hero = next.hero
  content.features = next.features
  content.gallery = next.gallery
  content.agenda = next.agenda
  content.cta = next.cta
}

const addFeature = () => {
  content.features.push({
    title: '',
    description: '',
    icon: 'network',
  })
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
    await alumniHubService.updateAdminAlumniHubContent(structuredClone(content))
    message.value = 'Konten halaman alumni berhasil disimpan.'
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
          <h1 class="mt-1 text-2xl font-semibold text-slate-900">Kelola halaman Pojok Alumni</h1>
          <p class="mt-1 text-sm text-slate-500">Atur konten hero, fitur, galeri, agenda, dan CTA pada halaman publik /alumni.</p>
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
          <h2 class="text-base font-semibold text-slate-900">Hero</h2>
          <div class="mt-4 grid gap-4 lg:grid-cols-2">
            <label class="grid gap-1 text-sm font-semibold text-slate-700">
              Badge
              <input v-model="content.hero.badge" class="rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-slate-400" />
            </label>
            <label class="grid gap-1 text-sm font-semibold text-slate-700">
              Kata highlight
              <input v-model="content.hero.headlineHighlight" class="rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-slate-400" />
            </label>
            <label class="grid gap-1 text-sm font-semibold text-slate-700">
              Headline awal
              <input v-model="content.hero.headlinePrefix" class="rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-slate-400" />
            </label>
            <label class="grid gap-1 text-sm font-semibold text-slate-700">
              Headline lanjutan
              <input v-model="content.hero.headlineSuffix" class="rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-slate-400" />
            </label>
            <label class="grid gap-1 text-sm font-semibold text-slate-700 lg:col-span-2">
              Deskripsi
              <textarea v-model="content.hero.description" rows="3" class="rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-slate-400"></textarea>
            </label>
            <label class="grid gap-1 text-sm font-semibold text-slate-700 lg:col-span-2">
              URL gambar hero
              <input v-model="content.hero.imageUrl" placeholder="https://..." class="rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-slate-400" />
            </label>
            <label class="grid gap-1 text-sm font-semibold text-slate-700">
              Testimonial floating
              <input v-model="content.hero.testimonial" class="rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-slate-400" />
            </label>
            <label class="grid gap-1 text-sm font-semibold text-slate-700">
              Label testimonial
              <input v-model="content.hero.testimonialLabel" class="rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-slate-400" />
            </label>
          </div>
        </section>

        <section class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-slate-900">Fitur mini hero</h2>
            <button type="button" class="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800" @click="addFeature">
              Tambah fitur
            </button>
          </div>
          <div class="mt-4 grid gap-4 lg:grid-cols-3">
            <article v-for="(item, index) in content.features" :key="index" class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div class="flex justify-end">
                <button type="button" class="text-xs font-semibold text-rose-600" @click="removeAt(content.features, index)">Hapus</button>
              </div>
              <label class="mt-2 grid gap-1 text-sm font-semibold text-slate-700">
                Judul
                <input v-model="item.title" class="rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-slate-400" />
              </label>
              <label class="mt-3 grid gap-1 text-sm font-semibold text-slate-700">
                Deskripsi
                <textarea v-model="item.description" rows="3" class="rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-slate-400"></textarea>
              </label>
              <label class="mt-3 grid gap-1 text-sm font-semibold text-slate-700">
                Icon
                <select v-model="item.icon" class="rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-slate-400">
                  <option value="network">Network</option>
                  <option value="story">Story</option>
                  <option value="impact">Impact</option>
                </select>
              </label>
            </article>
          </div>
        </section>

        <section class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-slate-900">Galeri kegiatan</h2>
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
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-slate-900">Agenda & acara</h2>
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

        <section class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 class="text-base font-semibold text-slate-900">CTA bawah</h2>
          <div class="mt-4 grid gap-4 lg:grid-cols-2">
            <input v-model="content.cta.title" placeholder="Judul CTA" class="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400 lg:col-span-2" />
            <textarea v-model="content.cta.description" rows="2" placeholder="Deskripsi CTA" class="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400 lg:col-span-2"></textarea>
            <input v-model="content.cta.buttonLabel" placeholder="Label tombol" class="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400" />
            <input v-model="content.cta.buttonUrl" placeholder="Link tombol" class="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400" />
          </div>
        </section>

        <div class="sticky bottom-4 z-10 flex justify-end">
          <button
            type="submit"
            class="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="saving"
          >
            {{ saving ? 'Menyimpan...' : 'Simpan konten alumni' }}
          </button>
        </div>
      </form>
    </div>
  </AdminShell>
</template>
