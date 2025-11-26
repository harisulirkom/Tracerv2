<script setup>
import { useRouter, RouterLink } from 'vue-router'

const router = useRouter()

const goTo = (path) => {
  router.push(path)
}
</script>

<template>
  <div class="space-y-8">
    <header class="space-y-3 rounded-3xl bg-gradient-to-r from-indigo-50 via-sky-50 to-cyan-50 p-6 text-slate-900 shadow-sm shadow-indigo-100">
      <p class="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">Kuisioner</p>
      <h1 class="text-3xl font-semibold leading-tight sm:text-4xl">
        Pilih halaman kuisioner yang ingin Anda isi
      </h1>
      <p class="text-slate-600 sm:max-w-3xl">
        Gunakan kuisioner alumni untuk lulusan dan kuisioner pengguna alumni untuk instansi atau perusahaan yang mempekerjakan alumni. Data yang ditampilkan mengikuti kuisioner aktif yang disetel admin.
      </p>
      <div class="flex flex-wrap gap-2 text-xs font-semibold text-indigo-700">
        <span class="rounded-full bg-white px-3 py-1">Tidak perlu login</span>
        <span class="rounded-full bg-white px-3 py-1">Data tersimpan lokal</span>
        <span class="rounded-full bg-white px-3 py-1">Mengikuti kuisioner aktif</span>
      </div>
    </header>

    <section class="grid gap-4 lg:grid-cols-2">
      <article class="group relative overflow-hidden rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm shadow-indigo-100 transition hover:shadow-md">
        <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-sky-500/5 to-cyan-400/10" />
        <div class="relative space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
              <span class="h-2 w-2 rounded-full bg-indigo-500" />
              Kuisioner alumni
            </div>
            <span class="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700">
              Aktif (statis)
            </span>
          </div>
          <h2 class="text-2xl font-semibold text-slate-900">
            Isi kuisioner alumni
          </h2>
          <p class="text-sm text-slate-600">
            Form alumni menggunakan konten statis untuk keperluan uji tampilan.
          </p>
          <div class="flex flex-wrap gap-2 text-xs font-semibold text-indigo-700">
            <span class="rounded-full bg-indigo-50 px-3 py-1">
              Tracer Study 2025 - Kuisioner dibuka
            </span>
            <span class="rounded-full bg-indigo-50 px-3 py-1">
              +/-5 menit
            </span>
          </div>

          <div class="pt-2">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              @click="goTo('/kuisioner/alumni')"
            >
              Isi sebagai alumni
            </button>
            <RouterLink
              to="/tentang"
              class="ml-3 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Lihat panduan
            </RouterLink>
          </div>
        </div>
      </article>

      <article class="group relative overflow-hidden rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm shadow-emerald-100 transition hover:shadow-md">
        <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-400/10" />
        <div class="relative space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
              <span class="h-2 w-2 rounded-full bg-emerald-500" />
              Kuisioner pengguna alumni
            </div>
            <span class="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
              {{ activePengguna ? 'Aktif' : 'Menunggu aktivasi' }}
            </span>
          </div>
          <h2 class="text-2xl font-semibold text-slate-900">
            {{ activePengguna?.title || 'Kuisioner pengguna belum diaktifkan' }}
          </h2>
          <p class="text-sm text-slate-600">
            {{
              activePengguna?.description ||
              'Aktifkan kuisioner pengguna alumni dari dashboard admin untuk mulai menerima penilaian pengguna alumni.'
            }}
          </p>

          <div class="flex flex-wrap gap-2 text-xs font-semibold text-emerald-700">
            <span class="rounded-full bg-emerald-50 px-3 py-1">
              {{ activePengguna?.chipText || 'Menunggu aktivasi admin' }}
            </span>
            <span class="rounded-full bg-emerald-50 px-3 py-1">
              {{ activePengguna?.estimatedTime || '+/-5 menit' }}
            </span>
          </div>

          <div class="pt-2">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              :disabled="!activePengguna"
              @click="goTo('/kuisioner/pengguna')"
            >
              Isi sebagai pengguna alumni
            </button>
            <RouterLink
              to="/tentang"
              class="ml-3 text-sm font-semibold text-emerald-600 hover:text-emerald-500"
            >
              Lihat kriteria
            </RouterLink>
          </div>
        </div>
      </article>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Kuisioner aktif</p>
          <h3 class="text-lg font-semibold text-slate-900">Daftar kuisioner yang siap diisi</h3>
          <p class="text-xs text-slate-500">Daftar ini mengikuti kuisioner yang ditandai aktif oleh admin.</p>
        </div>
        <RouterLink
          to="/login"
          class="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Buka dashboard admin
        </RouterLink>
      </div>

      <div v-if="!activeCards.length" class="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        Belum ada kuisioner yang aktif. Silakan aktifkan kuisioner dari modul admin untuk menampilkan pilihan di halaman ini.
      </div>

      <div v-else class="mt-4 grid gap-3 md:grid-cols-2">
        <article
          v-for="card in activeCards"
          :key="card.id"
          class="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-700"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-2">
              <div class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-indigo-700">
                <span class="h-2 w-2 rounded-full bg-indigo-500" />
                {{ card.audience }}
              </div>
              <h4 class="text-base font-semibold text-slate-900">{{ card.title }}</h4>
              <p class="text-xs text-slate-600">{{ card.description }}</p>
            </div>
            <span class="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-700">{{ card.estimatedTime }}</span>
          </div>
          <p class="mt-3 text-[11px] font-semibold text-slate-500">
            {{ card.chipText }}
          </p>
        </article>
      </div>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="grid gap-4 sm:grid-cols-3">
        <div class="rounded-2xl bg-indigo-50 p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">Langkah 1</p>
          <h4 class="mt-2 text-sm font-semibold text-slate-900">Pilih tipe kuisioner</h4>
          <p class="mt-1 text-xs text-slate-600">Pilih sesuai peran Anda: alumni untuk lulusan, pengguna untuk instansi.</p>
        </div>
        <div class="rounded-2xl bg-emerald-50 p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">Langkah 2</p>
          <h4 class="mt-2 text-sm font-semibold text-slate-900">Isi formulir lengkap</h4>
          <p class="mt-1 text-xs text-slate-600">Isi data sesuai petunjuk. Pertanyaan mengikuti konfigurasi admin.</p>
        </div>
        <div class="rounded-2xl bg-slate-50 p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">Langkah 3</p>
          <h4 class="mt-2 text-sm font-semibold text-slate-900">Kirim & simpan</h4>
          <p class="mt-1 text-xs text-slate-600">Setelah terkirim, data tercatat lokal dan ditampilkan di admin.</p>
        </div>
      </div>
    </section>
  </div>
</template>
