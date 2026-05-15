<script setup>
const head = {
  role: 'Kepala',
  name: "Dhiya’u Shidiqy, M.M.",
  accent: 'from-sky-500 to-indigo-500',
}

const divisions = [
  {
    role: 'Kepala Divisi Tracer Study dan Alumni',
    name: 'Dr. Trimurti Ningtyas, M.KP.',
    accent: 'from-sky-500 to-blue-500',
    tint: 'bg-sky-50/80',
  },
  {
    role: 'Kepala Divisi Pengembangan Karier dan Kerjasama',
    name: 'Dr. Oktaria Ardika, M.M.',
    accent: 'from-emerald-500 to-teal-500',
    tint: 'bg-emerald-50/80',
  },
  {
    role: 'Kepala Divisi Kewirausahaan dan Pengembangan Bakat Mahasiswa',
    name: 'Ghulam Falach, L.c, M.Ag',
    accent: 'from-amber-500 to-orange-500',
    tint: 'bg-amber-50/80',
  },
]
</script>

<template>
  <div class="public-page relative overflow-hidden">
    <div class="pointer-events-none absolute -left-16 top-8 h-56 w-56 rounded-full bg-cyan-200/30 blur-3xl"></div>
    <div class="pointer-events-none absolute -right-20 top-24 h-64 w-64 rounded-full bg-violet-200/25 blur-3xl"></div>

    <section class="relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-white via-cyan-50/55 to-emerald-50/45 p-6 shadow-[0_18px_45px_-24px_rgba(2,132,199,0.35)] sm:p-8">
      <div class="grid items-center gap-8 lg:grid-cols-2">
        <div class="space-y-4">
          <span class="inline-flex rounded-full border border-cyan-200 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-700 backdrop-blur">
            Profil CDC
          </span>
          <h1 class="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">Struktur Organisasi</h1>
          <div class="h-1.5 w-24 rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500"></div>
          <p class="text-sm leading-relaxed text-slate-600 sm:text-base">
            Susunan organisasi UPA Pengembangan Karier dan Kewirausahaan dirancang untuk memperkuat tata kelola
            layanan tracer study, pengembangan karier, kolaborasi strategis, serta kewirausahaan mahasiswa secara terpadu.
          </p>
        </div>

        <div class="relative">
          <div class="absolute -right-6 -top-8 h-36 w-36 rounded-full bg-gradient-to-br from-cyan-200/70 to-blue-200/60 blur-2xl"></div>
          <div class="relative rounded-[26px] border border-white/70 bg-white/70 p-5 shadow-lg backdrop-blur">
            <div class="rounded-2xl bg-gradient-to-br from-sky-100 via-cyan-100 to-emerald-100 p-5">
              <svg viewBox="0 0 320 200" class="h-44 w-full text-sky-700">
                <circle cx="58" cy="84" r="24" fill="currentColor" fill-opacity="0.32"/>
                <circle cx="160" cy="62" r="28" fill="currentColor" fill-opacity="0.40"/>
                <circle cx="254" cy="84" r="24" fill="currentColor" fill-opacity="0.32"/>
                <rect x="70" y="120" width="180" height="16" rx="8" fill="currentColor" fill-opacity="0.30"/>
                <path d="M82 84h68M172 84h58M160 90v30" stroke="currentColor" stroke-opacity="0.5" stroke-width="5" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm">
              <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-700">◎</span>
              Organisasi kolaboratif untuk ekosistem karier berkelanjutan.
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="mt-8 rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.28)] backdrop-blur sm:p-8">
      <div class="mx-auto max-w-5xl">
        <div class="flex justify-center">
          <article class="group relative w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
            <div class="absolute inset-x-6 top-0 h-1.5 rounded-b-full bg-gradient-to-r" :class="head.accent"></div>
            <div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c1.8-3.6 4.3-5.4 8-5.4S18.2 16.4 20 20"/>
              </svg>
            </div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{{ head.role }}</p>
            <h2 class="mt-2 text-xl font-semibold text-slate-900">{{ head.name }}</h2>
            <div class="pointer-events-none absolute -bottom-7 right-4 h-16 w-16 rounded-full bg-sky-100/40 blur-xl"></div>
          </article>
        </div>

        <div class="mx-auto mt-4 h-10 w-px bg-gradient-to-b from-slate-300 to-slate-100"></div>
        <div class="mx-auto h-px max-w-3xl bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>

        <div class="mt-6 grid gap-4 md:grid-cols-3">
          <article
            v-for="(item, idx) in divisions"
            :key="idx"
            class="group relative rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div class="absolute inset-x-5 top-0 h-1.5 rounded-b-full bg-gradient-to-r" :class="item.accent"></div>
            <div class="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl" :class="item.tint">
              <svg class="h-6 w-6 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M4 19h16"/>
                <rect x="6" y="5" width="12" height="10" rx="2"/>
                <path d="M9 9h6"/>
              </svg>
            </div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{{ item.role }}</p>
            <h3 class="mt-2 text-lg font-semibold text-slate-900">{{ item.name }}</h3>
            <div class="pointer-events-none absolute -bottom-7 right-5 h-16 w-16 rounded-full bg-slate-100/70 blur-xl"></div>
          </article>
        </div>
      </div>
    </section>

    <section class="mt-8 rounded-[28px] border border-white/70 bg-gradient-to-r from-cyan-100/70 via-blue-100/65 to-emerald-100/70 p-6 shadow-[0_14px_35px_-20px_rgba(14,116,144,0.35)] sm:p-8">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-start gap-3">
          <span class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-cyan-700 shadow-sm">
            <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="8" cy="8" r="3"/>
              <circle cx="16" cy="8" r="3"/>
              <path d="M3 20c1-3 2.8-4.6 5-4.6M21 20c-1-3-2.8-4.6-5-4.6M8 15h8"/>
            </svg>
          </span>
          <p class="max-w-2xl text-sm font-medium leading-relaxed text-slate-700 sm:text-base">
            Bersama membangun ekosistem karier dan kewirausahaan yang unggul.
          </p>
        </div>
        <RouterLink
          to="/kuisioner"
          class="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-400/30 transition hover:brightness-110"
        >
          Isi Kuisioner
          <span aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </section>
  </div>
</template>
