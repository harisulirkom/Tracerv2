<script setup>
import { computed, onMounted, ref } from 'vue'
import alumniHubService from '../services/alumniHubService'

const defaultContent = {
  hero: {
    badge: 'Pojok Alumni',
    headlinePrefix: 'Bersama',
    headlineHighlight: 'Alumni',
    headlineSuffix: 'Membangun Masa Depan yang Lebih Baik',
    description:
      'Alumni Community Hub menjadi ruang digital untuk mempertemukan lulusan, kampus, dan mitra dalam ekosistem kolaborasi yang hangat, produktif, dan berdampak bagi generasi berikutnya.',
    imageUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1200&q=80',
    testimonial: 'Alumni hebat adalah inspirasi bagi generasi selanjutnya.',
    testimonialLabel: 'Alumni Community Hub',
  },
  features: [
  {
    title: 'Terhubung & Berkolaborasi',
      description: 'Bangun jejaring lintas angkatan, prodi, dan profesi.',
      icon: 'network',
  },
  {
    title: 'Berbagi Pengalaman',
      description: 'Ruang cerita karier, studi lanjut, dan pembelajaran alumni.',
      icon: 'story',
  },
  {
    title: 'Memberi Dampak',
      description: 'Kolaborasi kontribusi untuk mahasiswa dan kampus.',
      icon: 'impact',
  },
  ],
  gallery: {
    eyebrow: 'Kegiatan Alumni',
    title: 'Galeri Kegiatan Alumni',
    buttonLabel: 'Lihat Semua Galeri',
    buttonUrl: '/coming-soon/galeri-alumni',
    items: [
  {
    title: 'Seminar alumni lintas profesi',
    label: '16 Mei 2026',
          description: 'Dokumentasi kegiatan alumni dan kampus.',
          imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Sharing session karier',
          imageUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Foto bersama alumni',
          imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Diskusi komunitas',
          imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Workshop alumni',
          moreLabel: '+12 Foto Lainnya',
          description: 'Buka arsip dokumentasi alumni',
          imageUrl: 'https://images.unsplash.com/photo-1558403194-611308249627?auto=format&fit=crop&w=900&q=80',
  },
    ],
  },
  agenda: {
    eyebrow: 'Agenda Komunitas',
    title: 'Agenda & Acara Alumni',
    subtitle: 'Ikuti agenda terbaru untuk memperluas jejaring, mengembangkan diri, dan berkontribusi untuk kampus.',
    buttonLabel: 'Lihat Semua Acara',
    buttonUrl: '/coming-soon/acara-alumni',
    items: [
  {
    title: 'Temu Alumni UIN Syekh Wasil Kediri',
    date: '16 Mei',
    time: '08.00 WIB - Selesai',
    place: 'Auditorium Lantai 4 Perpustakaan',
    tag: 'Networking',
    color: 'from-sky-500 to-cyan-400',
          imageUrl: 'https://images.unsplash.com/photo-1540317580384-e5d43867caa6?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Career Sharing: Dari Kampus ke Industri',
    date: '24 Mei',
    time: '09.00 - 11.30 WIB',
    place: 'Ruang Kolaborasi CDC',
    tag: 'Sharing Session',
    color: 'from-indigo-500 to-blue-400',
          imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Workshop Personal Branding Alumni',
    date: '31 Mei',
    time: '13.00 - 15.30 WIB',
    place: 'Hybrid Zoom & Aula Kampus',
    tag: 'Pengembangan Diri',
    color: 'from-emerald-500 to-teal-400',
          imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Gerakan Alumni Mengabdi',
    date: '08 Jun',
    time: '07.30 - 12.00 WIB',
    place: 'Kediri Raya',
    tag: 'Pengabdian Masyarakat',
    color: 'from-cyan-500 to-blue-500',
          imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=900&q=80',
  },
    ],
  },
  cta: {
    title: 'Jadilah bagian dari komunitas alumni UIN Syekh Wasil Kediri',
    description: 'Perbarui data diri Anda dan dapatkan informasi terbaru seputar kegiatan alumni.',
    buttonLabel: 'Perbarui Data Alumni',
    buttonUrl: '/kuisioner/alumni',
  },
}

const content = ref(defaultContent)
const galleryPage = ref(0)
const previewImage = ref(null)
const selectedAgenda = ref(null)

const mergeContent = (base, incoming) => ({
  ...base,
  ...(incoming || {}),
  hero: { ...base.hero, ...(incoming?.hero || {}) },
  gallery: { ...base.gallery, ...(incoming?.gallery || {}) },
  agenda: { ...base.agenda, ...(incoming?.agenda || {}) },
  cta: { ...base.cta, ...(incoming?.cta || {}) },
  features: Array.isArray(incoming?.features) && incoming.features.length ? incoming.features : base.features,
})

const iconPaths = {
  network: 'M7 11a4 4 0 1 1 4-4M13 17a4 4 0 1 0 4-4M8 17h8M12 7v4',
  story: 'M5 6h14M5 10h10M5 14h8M5 18h12',
  impact: 'M12 21s-7-4.35-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.65-7 10-7 10z',
}

const hero = computed(() => content.value.hero || defaultContent.hero)
const heroFeatures = computed(() => {
  const items = content.value.features || []
  return items.length ? items : defaultContent.features
})
const gallery = computed(() => content.value.gallery || defaultContent.gallery)
const allGalleryImages = computed(() => {
  const items = gallery.value.items || []
  return items.length ? items : defaultContent.gallery.items
})
const galleryPageSize = 5
const galleryPageCount = computed(() => Math.max(1, Math.ceil(allGalleryImages.value.length / galleryPageSize)))
const galleryImages = computed(() => {
  const start = galleryPage.value * galleryPageSize
  return allGalleryImages.value.slice(start, start + galleryPageSize)
})
const agenda = computed(() => content.value.agenda || defaultContent.agenda)
const agendaItems = computed(() => {
  const items = agenda.value.items || []
  return items.length ? items : defaultContent.agenda.items
})
const cta = computed(() => content.value.cta || defaultContent.cta)
const iconPath = (icon) => iconPaths[icon] || icon || iconPaths.network
const canNavigateGallery = computed(() => allGalleryImages.value.length > galleryPageSize)

const setGalleryPage = (page) => {
  if (!galleryPageCount.value) {
    galleryPage.value = 0
    return
  }
  galleryPage.value = (page + galleryPageCount.value) % galleryPageCount.value
}

const openPreview = (item) => {
  if (!item?.imageUrl) return
  previewImage.value = item
}

const closePreview = () => {
  previewImage.value = null
}

const openAgenda = (item) => {
  selectedAgenda.value = item
}

const closeAgenda = () => {
  selectedAgenda.value = null
}

onMounted(async () => {
  try {
    const response = await alumniHubService.getAlumniHubContent()
    content.value = mergeContent(defaultContent, response?.content || response)
    galleryPage.value = 0
  } catch (error) {
    content.value = defaultContent
  }
})
</script>

<template>
  <div class="relative overflow-hidden pb-16 pt-5 text-slate-900">
    <div class="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-200/45 blur-3xl"></div>
    <div class="pointer-events-none absolute right-0 top-80 h-80 w-80 rounded-full bg-emerald-200/35 blur-3xl"></div>

    <section class="relative grid items-center gap-12 py-10 lg:grid-cols-[1.02fr_0.98fr] lg:py-16">
      <div>
        <div class="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-sky-700 shadow-sm shadow-sky-100/80 backdrop-blur">
          <span class="h-2 w-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"></span>
          {{ hero.badge }}
        </div>
        <h1 class="mt-6 max-w-4xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
          {{ hero.headlinePrefix }}
          <span class="bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">{{ hero.headlineHighlight }}</span>,
          {{ hero.headlineSuffix }}
        </h1>
        <div class="mt-5 h-1.5 w-28 rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"></div>
        <p class="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
          {{ hero.description }}
        </p>

        <div class="mt-8 grid gap-3 sm:grid-cols-3">
          <article
            v-for="feature in heroFeatures"
            :key="feature.title"
            class="group rounded-[24px] border border-white/70 bg-white/75 p-4 shadow-sm shadow-sky-100/70 backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-100"
          >
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-400 text-white shadow-lg shadow-sky-200">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path :d="iconPath(feature.icon)" />
              </svg>
            </div>
            <h3 class="mt-4 text-sm font-semibold text-slate-950">{{ feature.title }}</h3>
            <p class="mt-2 text-xs leading-5 text-slate-500">{{ feature.description }}</p>
          </article>
        </div>
      </div>

      <div class="relative min-h-[460px]">
        <div class="absolute inset-8 rounded-[42%_58%_53%_47%/48%_35%_65%_52%] bg-gradient-to-br from-sky-200 via-cyan-100 to-emerald-100 blur-sm"></div>
        <div class="absolute -right-5 top-10 h-24 w-24 rounded-full border border-white/70 bg-white/50 shadow-xl shadow-sky-100 backdrop-blur"></div>
        <div class="absolute bottom-20 left-0 h-14 w-14 rounded-full bg-gradient-to-br from-emerald-300 to-sky-400 opacity-80 shadow-lg shadow-sky-200"></div>
        <div class="relative mx-auto h-[440px] max-w-[520px] overflow-hidden rounded-[34%_66%_58%_42%/40%_36%_64%_60%] border border-white/80 bg-white p-3 shadow-2xl shadow-sky-200/70">
          <img
            :src="hero.imageUrl"
            alt="Alumni kampus sedang berdiskusi santai"
            class="h-full w-full rounded-[32%_68%_56%_44%/38%_34%_66%_62%] object-cover"
          />
        </div>
        <div class="absolute bottom-8 right-2 max-w-xs rounded-[28px] border border-white/75 bg-white/75 p-4 shadow-2xl shadow-sky-200/70 backdrop-blur-xl">
          <p class="text-sm font-semibold leading-6 text-slate-800">
            "{{ hero.testimonial }}"
          </p>
          <div class="mt-3 flex items-center gap-2 text-xs font-semibold text-sky-700">
            <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
            {{ hero.testimonialLabel }}
          </div>
        </div>
      </div>
    </section>

    <section class="relative mt-8 rounded-[32px] border border-white/75 bg-white/80 p-5 shadow-xl shadow-sky-100/70 backdrop-blur-xl sm:p-7">
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.24em] text-sky-600">{{ gallery.eyebrow }}</p>
          <h2 class="mt-2 text-3xl font-semibold text-slate-950">{{ gallery.title }}</h2>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <div v-if="canNavigateGallery" class="flex items-center gap-2 rounded-full border border-sky-100 bg-white/80 p-1 shadow-sm shadow-sky-100">
            <button
              type="button"
              class="flex h-10 w-10 items-center justify-center rounded-full text-sky-700 transition hover:bg-sky-50"
              aria-label="Galeri sebelumnya"
              @click="setGalleryPage(galleryPage - 1)"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span class="min-w-12 text-center text-xs font-bold text-slate-500">{{ galleryPage + 1 }} / {{ galleryPageCount }}</span>
            <button
              type="button"
              class="flex h-10 w-10 items-center justify-center rounded-full text-sky-700 transition hover:bg-sky-50"
              aria-label="Galeri berikutnya"
              @click="setGalleryPage(galleryPage + 1)"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article class="group relative min-h-[430px] overflow-hidden rounded-[28px] focus-within:ring-4 focus-within:ring-sky-100">
          <button
            type="button"
            class="absolute inset-0 z-10"
            :aria-label="`Preview ${galleryImages[0]?.title || 'foto galeri'}`"
            @click="openPreview(galleryImages[0])"
          ></button>
          <img :src="galleryImages[0].imageUrl" :alt="galleryImages[0].title" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          <div class="absolute left-5 top-5 rounded-full bg-white/80 px-4 py-2 text-xs font-bold text-sky-700 shadow-lg backdrop-blur">
            {{ galleryImages[0].label }}
          </div>
          <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-6 text-white">
            <p class="text-xl font-semibold">{{ galleryImages[0].title }}</p>
            <p class="mt-1 text-sm text-white/75">{{ galleryImages[0].description }}</p>
          </div>
        </article>

        <div class="grid grid-cols-2 gap-4">
          <article
            v-for="item in galleryImages.slice(1)"
            :key="item.title"
            class="group relative min-h-[205px] overflow-hidden rounded-[26px] bg-slate-100 focus-within:ring-4 focus-within:ring-sky-100"
          >
            <button
              type="button"
              class="absolute inset-0 z-10"
              :aria-label="`Preview ${item.title || 'foto galeri'}`"
              @click="openPreview(item)"
            ></button>
            <img :src="item.imageUrl" :alt="item.title" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent opacity-80 transition group-hover:opacity-95"></div>
            <div class="absolute inset-x-0 bottom-0 p-4 text-white">
              <p class="text-sm font-semibold">{{ item.moreLabel || item.title }}</p>
              <p v-if="item.moreLabel" class="mt-1 text-xs text-white/75">{{ item.description }}</p>
            </div>
          </article>
        </div>
      </div>

      <div v-if="canNavigateGallery" class="mt-5 flex items-center justify-center gap-2">
        <button
          v-for="page in galleryPageCount"
          :key="page"
          type="button"
          class="h-2.5 rounded-full transition-all"
          :class="page - 1 === galleryPage ? 'w-8 bg-gradient-to-r from-sky-500 to-emerald-400' : 'w-2.5 bg-slate-200 hover:bg-sky-200'"
          :aria-label="`Buka halaman galeri ${page}`"
          @click="setGalleryPage(page - 1)"
        ></button>
      </div>
    </section>

    <section class="relative mt-16">
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">{{ agenda.eyebrow }}</p>
          <h2 class="mt-2 text-3xl font-semibold text-slate-950">{{ agenda.title }}</h2>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {{ agenda.subtitle }}
          </p>
        </div>
        <a
          :href="agenda.buttonUrl"
          class="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          {{ agenda.buttonLabel }}
        </a>
      </div>

      <div class="flex snap-x gap-5 overflow-x-auto pb-4">
        <article
          v-for="item in agendaItems"
          :key="item.title"
          class="group relative min-w-[290px] snap-start overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-lg shadow-sky-100/60 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-sky-100 sm:min-w-[340px]"
        >
          <button
            type="button"
            class="absolute inset-0 z-10"
            :aria-label="`Lihat detail ${item.title || 'acara alumni'}`"
            @click="openAgenda(item)"
          ></button>
          <div class="relative h-44 overflow-hidden">
            <img :src="item.imageUrl" :alt="item.title" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <div :class="['absolute left-4 top-4 rounded-2xl bg-gradient-to-r px-4 py-2 text-sm font-bold text-white shadow-lg', item.color]">
              {{ item.date }}
            </div>
          </div>
          <div class="space-y-4 p-5">
            <span class="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">{{ item.tag }}</span>
            <h3 class="text-lg font-semibold leading-snug text-slate-950">{{ item.title }}</h3>
            <div class="space-y-2 text-sm text-slate-600">
              <p class="flex items-center gap-2">
                <span class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-sky-700">Jam</span>
                {{ item.time }}
              </p>
              <p class="flex items-center gap-2">
                <span class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-emerald-700">Lok</span>
                {{ item.place }}
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="relative mt-16 overflow-hidden rounded-[32px] bg-gradient-to-br from-sky-600 via-cyan-500 to-emerald-400 p-1 shadow-2xl shadow-sky-200">
      <div class="relative overflow-hidden rounded-[30px] bg-white/16 p-7 text-white backdrop-blur-xl sm:p-9">
        <div class="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/20 blur-3xl"></div>
        <div class="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex gap-4">
            <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-white/25 shadow-lg ring-1 ring-white/35 backdrop-blur">
              <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 11a4 4 0 1 0-8 0" />
                <path d="M3 21a7 7 0 0 1 14 0" />
                <path d="M17 8h4" />
                <path d="M19 6v4" />
              </svg>
            </div>
            <div>
              <h2 class="max-w-3xl text-2xl font-semibold leading-tight sm:text-3xl">
                {{ cta.title }}
              </h2>
              <p class="mt-3 max-w-2xl text-sm leading-7 text-white/85">
                {{ cta.description }}
              </p>
            </div>
          </div>
          <a
            :href="cta.buttonUrl"
            class="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-sky-700 shadow-xl shadow-sky-700/20 transition hover:-translate-y-0.5 hover:bg-sky-50"
          >
            {{ cta.buttonLabel }}
          </a>
        </div>
      </div>
    </section>

    <div
      v-if="previewImage"
      class="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/75 px-4 py-6 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      @click.self="closePreview"
    >
      <div class="relative max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-2xl shadow-slate-950/40">
        <button
          type="button"
          class="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-lg transition hover:bg-white"
          aria-label="Tutup preview foto"
          @click="closePreview"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <div class="max-h-[78vh] bg-slate-950">
          <img :src="previewImage.imageUrl" :alt="previewImage.title" class="mx-auto max-h-[78vh] w-auto max-w-full object-contain" />
        </div>
        <div class="bg-white px-5 py-4 sm:px-6">
          <p class="text-lg font-semibold text-slate-950">{{ previewImage.title || 'Foto galeri' }}</p>
          <p v-if="previewImage.description || previewImage.label" class="mt-1 text-sm text-slate-500">
            {{ previewImage.description || previewImage.label }}
          </p>
        </div>
      </div>
    </div>

    <div
      v-if="selectedAgenda"
      class="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      @click.self="closeAgenda"
    >
      <div class="relative max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-2xl shadow-slate-950/40">
        <button
          type="button"
          class="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-lg transition hover:bg-white"
          aria-label="Tutup detail acara"
          @click="closeAgenda"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <div class="relative h-72 overflow-hidden bg-slate-100">
          <img v-if="selectedAgenda.imageUrl" :src="selectedAgenda.imageUrl" :alt="selectedAgenda.title" class="h-full w-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent"></div>
          <div :class="['absolute left-5 top-5 rounded-2xl bg-gradient-to-r px-4 py-2 text-sm font-bold text-white shadow-lg', selectedAgenda.color]">
            {{ selectedAgenda.date }}
          </div>
          <div class="absolute inset-x-0 bottom-0 p-6 text-white">
            <span class="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">{{ selectedAgenda.tag }}</span>
            <h3 class="mt-3 text-2xl font-semibold leading-tight">{{ selectedAgenda.title }}</h3>
          </div>
        </div>
        <div class="space-y-5 p-6">
          <p v-if="selectedAgenda.description" class="text-sm leading-7 text-slate-600">{{ selectedAgenda.description }}</p>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-2xl bg-sky-50 px-4 py-3">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Waktu</p>
              <p class="mt-1 font-semibold text-slate-900">{{ selectedAgenda.time || '-' }}</p>
            </div>
            <div class="rounded-2xl bg-emerald-50 px-4 py-3">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Lokasi</p>
              <p class="mt-1 font-semibold text-slate-900">{{ selectedAgenda.place || '-' }}</p>
            </div>
          </div>
          <div class="flex justify-end">
            <button
              type="button"
              class="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              @click="closeAgenda"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
