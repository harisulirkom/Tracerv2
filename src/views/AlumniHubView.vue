<script setup>
import { RouterLink } from 'vue-router'

const heroFeatures = [
  {
    title: 'Terhubung & Berkolaborasi',
    desc: 'Bangun jejaring lintas angkatan, prodi, dan profesi.',
    icon: 'M7 11a4 4 0 1 1 4-4M13 17a4 4 0 1 0 4-4M8 17h8M12 7v4',
  },
  {
    title: 'Berbagi Pengalaman',
    desc: 'Ruang cerita karier, studi lanjut, dan pembelajaran alumni.',
    icon: 'M5 6h14M5 10h10M5 14h8M5 18h12',
  },
  {
    title: 'Memberi Dampak',
    desc: 'Kolaborasi kontribusi untuk mahasiswa dan kampus.',
    icon: 'M12 21s-7-4.35-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.65-7 10-7 10z',
  },
]

const galleryImages = [
  {
    title: 'Seminar alumni lintas profesi',
    label: '16 Mei 2026',
    src: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
    large: true,
  },
  {
    title: 'Sharing session karier',
    src: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Foto bersama alumni',
    src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Diskusi komunitas',
    src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Workshop alumni',
    src: 'https://images.unsplash.com/photo-1558403194-611308249627?auto=format&fit=crop&w=900&q=80',
    more: '+12 Foto Lainnya',
  },
]

const agendaItems = [
  {
    title: 'Temu Alumni UIN Syekh Wasil Kediri',
    date: '16 Mei',
    time: '08.00 WIB - Selesai',
    place: 'Auditorium Lantai 4 Perpustakaan',
    tag: 'Networking',
    color: 'from-sky-500 to-cyan-400',
    src: 'https://images.unsplash.com/photo-1540317580384-e5d43867caa6?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Career Sharing: Dari Kampus ke Industri',
    date: '24 Mei',
    time: '09.00 - 11.30 WIB',
    place: 'Ruang Kolaborasi CDC',
    tag: 'Sharing Session',
    color: 'from-indigo-500 to-blue-400',
    src: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Workshop Personal Branding Alumni',
    date: '31 Mei',
    time: '13.00 - 15.30 WIB',
    place: 'Hybrid Zoom & Aula Kampus',
    tag: 'Pengembangan Diri',
    color: 'from-emerald-500 to-teal-400',
    src: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Gerakan Alumni Mengabdi',
    date: '08 Jun',
    time: '07.30 - 12.00 WIB',
    place: 'Kediri Raya',
    tag: 'Pengabdian Masyarakat',
    color: 'from-cyan-500 to-blue-500',
    src: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=900&q=80',
  },
]
</script>

<template>
  <div class="relative overflow-hidden pb-16 pt-5 text-slate-900">
    <div class="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-200/45 blur-3xl"></div>
    <div class="pointer-events-none absolute right-0 top-80 h-80 w-80 rounded-full bg-emerald-200/35 blur-3xl"></div>

    <section class="relative grid items-center gap-12 py-10 lg:grid-cols-[1.02fr_0.98fr] lg:py-16">
      <div>
        <div class="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-sky-700 shadow-sm shadow-sky-100/80 backdrop-blur">
          <span class="h-2 w-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"></span>
          Pojok Alumni
        </div>
        <h1 class="mt-6 max-w-4xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
          Bersama
          <span class="bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">Alumni</span>,
          Membangun Masa Depan yang Lebih Baik
        </h1>
        <div class="mt-5 h-1.5 w-28 rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"></div>
        <p class="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
          Alumni Community Hub menjadi ruang digital untuk mempertemukan lulusan, kampus, dan mitra
          dalam ekosistem kolaborasi yang hangat, produktif, dan berdampak bagi generasi berikutnya.
        </p>

        <div class="mt-8 grid gap-3 sm:grid-cols-3">
          <article
            v-for="feature in heroFeatures"
            :key="feature.title"
            class="group rounded-[24px] border border-white/70 bg-white/75 p-4 shadow-sm shadow-sky-100/70 backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-100"
          >
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-400 text-white shadow-lg shadow-sky-200">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path :d="feature.icon" />
              </svg>
            </div>
            <h3 class="mt-4 text-sm font-semibold text-slate-950">{{ feature.title }}</h3>
            <p class="mt-2 text-xs leading-5 text-slate-500">{{ feature.desc }}</p>
          </article>
        </div>
      </div>

      <div class="relative min-h-[460px]">
        <div class="absolute inset-8 rounded-[42%_58%_53%_47%/48%_35%_65%_52%] bg-gradient-to-br from-sky-200 via-cyan-100 to-emerald-100 blur-sm"></div>
        <div class="absolute -right-5 top-10 h-24 w-24 rounded-full border border-white/70 bg-white/50 shadow-xl shadow-sky-100 backdrop-blur"></div>
        <div class="absolute bottom-20 left-0 h-14 w-14 rounded-full bg-gradient-to-br from-emerald-300 to-sky-400 opacity-80 shadow-lg shadow-sky-200"></div>
        <div class="relative mx-auto h-[440px] max-w-[520px] overflow-hidden rounded-[34%_66%_58%_42%/40%_36%_64%_60%] border border-white/80 bg-white p-3 shadow-2xl shadow-sky-200/70">
          <img
            src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1200&q=80"
            alt="Alumni kampus sedang berdiskusi santai"
            class="h-full w-full rounded-[32%_68%_56%_44%/38%_34%_66%_62%] object-cover"
          />
        </div>
        <div class="absolute bottom-8 right-2 max-w-xs rounded-[28px] border border-white/75 bg-white/75 p-4 shadow-2xl shadow-sky-200/70 backdrop-blur-xl">
          <p class="text-sm font-semibold leading-6 text-slate-800">
            "Alumni hebat adalah inspirasi bagi generasi selanjutnya."
          </p>
          <div class="mt-3 flex items-center gap-2 text-xs font-semibold text-sky-700">
            <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
            Alumni Community Hub
          </div>
        </div>
      </div>
    </section>

    <section class="relative mt-8 rounded-[32px] border border-white/75 bg-white/80 p-5 shadow-xl shadow-sky-100/70 backdrop-blur-xl sm:p-7">
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.24em] text-sky-600">Kegiatan Alumni</p>
          <h2 class="mt-2 text-3xl font-semibold text-slate-950">Galeri Kegiatan Alumni</h2>
        </div>
        <RouterLink
          to="/coming-soon/galeri-alumni"
          class="inline-flex items-center justify-center rounded-full border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
        >
          Lihat Semua Galeri
        </RouterLink>
      </div>

      <div class="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article class="group relative min-h-[430px] overflow-hidden rounded-[28px]">
          <img :src="galleryImages[0].src" :alt="galleryImages[0].title" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          <div class="absolute left-5 top-5 rounded-full bg-white/80 px-4 py-2 text-xs font-bold text-sky-700 shadow-lg backdrop-blur">
            {{ galleryImages[0].label }}
          </div>
          <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-6 text-white">
            <p class="text-xl font-semibold">{{ galleryImages[0].title }}</p>
            <p class="mt-1 text-sm text-white/75">Dokumentasi kegiatan alumni dan kampus.</p>
          </div>
        </article>

        <div class="grid grid-cols-2 gap-4">
          <article
            v-for="item in galleryImages.slice(1)"
            :key="item.title"
            class="group relative min-h-[205px] overflow-hidden rounded-[26px] bg-slate-100"
          >
            <img :src="item.src" :alt="item.title" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent opacity-80 transition group-hover:opacity-95"></div>
            <div class="absolute inset-x-0 bottom-0 p-4 text-white">
              <p class="text-sm font-semibold">{{ item.more || item.title }}</p>
              <p v-if="item.more" class="mt-1 text-xs text-white/75">Buka arsip dokumentasi alumni</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="relative mt-16">
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">Agenda Komunitas</p>
          <h2 class="mt-2 text-3xl font-semibold text-slate-950">Agenda & Acara Alumni</h2>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Ikuti agenda terbaru untuk memperluas jejaring, mengembangkan diri, dan berkontribusi untuk kampus.
          </p>
        </div>
        <RouterLink
          to="/coming-soon/acara-alumni"
          class="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          Lihat Semua Acara
        </RouterLink>
      </div>

      <div class="flex snap-x gap-5 overflow-x-auto pb-4">
        <article
          v-for="item in agendaItems"
          :key="item.title"
          class="group min-w-[290px] snap-start overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-lg shadow-sky-100/60 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-sky-100 sm:min-w-[340px]"
        >
          <div class="relative h-44 overflow-hidden">
            <img :src="item.src" :alt="item.title" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <div :class="['absolute left-4 top-4 rounded-2xl bg-gradient-to-r px-4 py-2 text-sm font-bold text-white shadow-lg', item.color]">
              {{ item.date }}
            </div>
          </div>
          <div class="space-y-4 p-5">
            <span class="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">{{ item.tag }}</span>
            <h3 class="text-lg font-semibold leading-snug text-slate-950">{{ item.title }}</h3>
            <div class="space-y-2 text-sm text-slate-600">
              <p class="flex items-center gap-2">
                <span class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-sky-700">⏱</span>
                {{ item.time }}
              </p>
              <p class="flex items-center gap-2">
                <span class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-emerald-700">⌖</span>
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
                Jadilah bagian dari komunitas alumni UIN Syekh Wasil Kediri
              </h2>
              <p class="mt-3 max-w-2xl text-sm leading-7 text-white/85">
                Perbarui data diri Anda dan dapatkan informasi terbaru seputar kegiatan alumni.
              </p>
            </div>
          </div>
          <RouterLink
            to="/kuisioner/alumni"
            class="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-sky-700 shadow-xl shadow-sky-700/20 transition hover:-translate-y-0.5 hover:bg-sky-50"
          >
            Perbarui Data Alumni
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>
