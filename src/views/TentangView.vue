<template>
  <div class="space-y-8">
    <header class="space-y-3">
      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Tentang</p>
      <h1 class="text-3xl font-semibold text-slate-900">Tentang platform tracer study</h1>
      <p class="text-slate-600">
        Kami membantu kampus mengumpulkan data alumni dengan cepat, aman, dan siap lapor.
      </p>
    </header>

    <div class="grid gap-6 md:grid-cols-2">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 class="text-xl font-semibold text-slate-900">Misi</h3>
        <p class="mt-3 text-sm text-slate-600">
          Memudahkan tracer study melalui automasi pengiriman kuisioner, dashboard realtime, dan publikasi laporan yang bisa langsung dipakai pimpinan.
        </p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 class="text-xl font-semibold text-slate-900">Tim</h3>
        <p class="mt-3 text-sm text-slate-600">
          Berisi praktisi tracer, pengembang, dan analis data yang terbiasa mendampingi kampus menuntaskan kewajiban tracer nasional.
        </p>
      </div>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-gradient-to-r from-indigo-100 via-sky-100 to-cyan-100 p-[1px]">
      <div class="h-full rounded-[18px] bg-white p-6 shadow-sm sm:p-8">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-700">Kontak</p>
            <h2 class="text-xl font-semibold text-slate-900">Butuh demo atau pendampingan?</h2>
            <p class="text-sm text-slate-700">Hubungi kami untuk jadwalkan sesi bersama tim tracer kampus Anda.</p>
          </div>
          <RouterLink
            to="/kuisioner"
            class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110"
          >
            Jadwalkan demo
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
