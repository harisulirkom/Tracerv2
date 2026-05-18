<script setup>
import { computed, onMounted, ref } from 'vue'
import alumniHubService from '../services/alumniHubService'

const fallbackAgenda = {
  eyebrow: 'Agenda Komunitas',
  title: 'Semua Agenda & Acara Alumni',
  subtitle: 'Kumpulan kegiatan alumni untuk jejaring, pengembangan diri, pengabdian, dan kolaborasi kampus.',
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
  ],
}

const agenda = ref(fallbackAgenda)
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const selectedEvent = ref(null)

const events = computed(() => {
  const items = agenda.value.items || []
  return items.length ? items : fallbackAgenda.items
})

const filteredEvents = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return events.value
  return events.value.filter((item) => {
    const haystack = `${item.title || ''} ${item.tag || ''} ${item.place || ''} ${item.time || ''} ${item.date || ''}`.toLowerCase()
    return haystack.includes(q)
  })
})

const openEvent = (item) => {
  selectedEvent.value = item
}

const closeEvent = () => {
  selectedEvent.value = null
}

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await alumniHubService.getAlumniHubContent()
    agenda.value = {
      ...fallbackAgenda,
      ...(response?.content?.agenda || response?.agenda || {}),
    }
  } catch (err) {
    error.value = err?.response?.data?.message || err?.message || 'Gagal memuat acara alumni.'
    agenda.value = fallbackAgenda
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="public-page">
    <section class="public-hero-panel motion-card-sheen p-6 sm:p-7">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="public-kicker">{{ agenda.eyebrow }}</p>
          <h1 class="public-section-title mt-3">{{ agenda.title || fallbackAgenda.title }}</h1>
          <p class="public-section-subtitle">{{ agenda.subtitle || fallbackAgenda.subtitle }}</p>
        </div>
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            class="w-64 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 pr-10 text-sm text-slate-700 outline-none ring-0 transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
            placeholder="Cari acara..."
          />
          <svg
            class="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="m14 14-3.5-3.5m0 0A4.5 4.5 0 1 0 14.5 6 4.5 4.5 0 0 0 10.5 10.5Z" />
          </svg>
        </div>
      </div>
    </section>

    <div v-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">
      {{ error }}
    </div>
    <div v-else-if="loading" class="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
      Memuat acara alumni...
    </div>
    <div v-else-if="!filteredEvents.length" class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
      Belum ada acara alumni tersedia.
    </div>

    <div v-else class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="(item, itemIdx) in filteredEvents"
        :key="`${item.title}-${itemIdx}`"
        class="public-news-card motion-card-sheen motion-delay-item group"
        :style="{ '--stagger-index': itemIdx }"
      >
        <div class="relative h-44 w-full overflow-hidden bg-slate-100">
          <img
            v-if="item.imageUrl"
            :src="item.imageUrl"
            :alt="item.title"
            class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900/45 to-transparent"></div>
          <div :class="['absolute left-4 top-4 rounded-2xl bg-gradient-to-r px-4 py-2 text-sm font-bold text-white shadow-lg', item.color || 'from-sky-500 to-cyan-400']">
            {{ item.date || '-' }}
          </div>
        </div>
        <div class="space-y-3 p-4">
          <span class="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">{{ item.tag || 'Acara Alumni' }}</span>
          <h3 class="text-lg font-semibold text-slate-900 group-hover:text-sky-600">{{ item.title }}</h3>
          <div class="space-y-2 text-sm text-slate-600">
            <p class="flex items-center gap-2">
              <span class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-sky-700">Jam</span>
              {{ item.time || '-' }}
            </p>
            <p class="flex items-center gap-2">
              <span class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-emerald-700">Lok</span>
              {{ item.place || '-' }}
            </p>
          </div>
          <button
            type="button"
            class="motion-underline-link inline-flex items-center gap-2 text-sm font-semibold text-sky-600 transition hover:text-sky-500"
            @click="openEvent(item)"
          >
            Lihat rincian
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </article>
    </div>

    <div v-if="selectedEvent" class="public-dialog-backdrop" @click.self="closeEvent">
      <div class="public-dialog-panel max-w-4xl p-6 sm:p-8">
        <button type="button" class="public-dialog-close" @click="closeEvent">&times;</button>
        <div class="space-y-4">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">{{ selectedEvent.tag || agenda.eyebrow }}</p>
          <h3 class="text-2xl font-semibold text-slate-900">{{ selectedEvent.title }}</h3>
          <div v-if="selectedEvent.imageUrl" class="overflow-hidden rounded-2xl border border-slate-100">
            <img :src="selectedEvent.imageUrl" :alt="selectedEvent.title" class="max-h-[440px] w-full object-cover" loading="lazy" />
          </div>
          <div class="grid gap-3 sm:grid-cols-3">
            <div class="rounded-2xl bg-sky-50 p-4">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Tanggal</p>
              <p class="mt-1 font-semibold text-slate-900">{{ selectedEvent.date || '-' }}</p>
            </div>
            <div class="rounded-2xl bg-indigo-50 p-4">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">Waktu</p>
              <p class="mt-1 font-semibold text-slate-900">{{ selectedEvent.time || '-' }}</p>
            </div>
            <div class="rounded-2xl bg-emerald-50 p-4">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Lokasi</p>
              <p class="mt-1 font-semibold text-slate-900">{{ selectedEvent.place || '-' }}</p>
            </div>
          </div>
          <p v-if="selectedEvent.description" class="whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {{ selectedEvent.description }}
          </p>
          <div class="flex justify-end">
            <button type="button" class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" @click="closeEvent">
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
