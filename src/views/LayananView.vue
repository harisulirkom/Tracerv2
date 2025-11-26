<script setup>
const features = [
  { title: 'Pengumpulan Data Cepat', desc: 'Kirim kuisioner multi-channel dengan pengingat otomatis.', badge: 'Realtime' },
  { title: 'Analitik dan Laporan', desc: 'Grafik tren karier, persebaran pekerjaan, dan ringkasan cohort.', badge: 'Insight' },
  { title: 'Integrasi & Ekspor', desc: 'Ekspor CSV/Excel atau sambungkan ke BI tools.', badge: 'Opsional' },
  { title: 'Keamanan Data', desc: 'Hak akses berbasis peran, enkripsi, dan audit log.', badge: 'Keamanan' },
  { title: 'Template Kuisioner', desc: 'Template siap pakai menyesuaikan pedoman tracer study.', badge: 'Template' },
  { title: 'Support Implementasi', desc: 'Bantuan setup domain, sinkronisasi lulusan, dan pelatihan.', badge: 'Support' },
]
</script>

<template>
  <div class="space-y-10">
    <header class="space-y-3">
      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Layanan</p>
      <h1 class="text-3xl font-semibold text-slate-900">Paket lengkap untuk tracer study</h1>
      <p class="text-slate-600">Pilih layanan yang relevan untuk tim tracer, akademik, dan pusat karier.</p>
    </header>

    <div class="grid gap-5 sm:grid-cols-2">
      <article
        v-for="item in features"
        :key="item.title"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
      >
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-400" />
          <div class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{{ item.badge }}</div>
        </div>
        <h3 class="mt-3 text-xl font-semibold text-slate-900">{{ item.title }}</h3>
        <p class="mt-2 text-sm text-slate-600">{{ item.desc }}</p>
      </article>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-gradient-to-r from-indigo-100 via-sky-100 to-cyan-100 p-[1px]">
      <div class="h-full rounded-[18px] bg-white p-6 sm:p-8 shadow-sm">
        <div class="grid gap-6 lg:grid-cols-3">
          <div class="lg:col-span-2 space-y-3">
            <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-700">Konsultasi</p>
            <h2 class="text-2xl font-semibold text-slate-900">Butuh penyesuaian khusus?</h2>
            <p class="text-sm text-slate-700">
              Kami bisa bantu audit kuisioner, integrasi data lulusan, atau publikasi laporan tahunan.
            </p>
          </div>
          <div class="flex flex-col gap-3 lg:items-end lg:text-right">
            <RouterLink
              to="/kuisioner"
              class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110"
            >
              Hubungi tim tracer
            </RouterLink>
            <RouterLink
              to="/tentang"
              class="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Lihat detail layanan ->
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
