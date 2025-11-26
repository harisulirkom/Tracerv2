<template>
  <section class="flex flex-col items-center gap-4 py-16 text-center text-slate-800">
    <div
      class="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-500 text-3xl font-bold text-white shadow-lg shadow-indigo-500/25"
    >
      404
    </div>
    <h1 class="text-3xl font-bold text-slate-900">Halaman belum tersedia</h1>
    <p class="max-w-xl text-sm text-slate-600">
      Menu atau halaman yang kamu pilih belum tersedia atau sudah dipindahkan. Gunakan tombol di bawah ini untuk
      kembali ke halaman utama atau lanjut menjelajah fitur yang sudah aktif.
    </p>
    <div class="mt-2 flex flex-wrap items-center justify-center gap-3">
      <RouterLink
        to="/"
        class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
      >
        Kembali ke Beranda
      </RouterLink>
      <RouterLink
        to="/kuisioner"
        class="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:brightness-110"
      >
        Lihat Kuisioner
      </RouterLink>
    </div>
  </section>
</template>
