<script setup>
import { computed, ref, onMounted } from 'vue'
import { useJobs } from '../stores/jobs'

const { jobs, fetchJobs, loading, error } = useJobs()

const jobSections = [
  {
    id: 'lowongan-terbaru',
    title: 'Lowongan Terbaru',
    desc: 'Kumpulan posting pekerjaan dan magang paling baru yang masuk ke CDC UIN Kediri.',
    badge: 'Update harian',
  },
  {
    id: 'lowongan-fakultas-prodi',
    title: 'Lowongan Berdasarkan Fakultas/Prodi',
    desc: 'Filter peluang yang relevan dengan jurusan, konsentrasi, atau minat alumni.',
    badge: 'Filter prodi',
  },
  {
    id: 'lowongan-magang',
    title: 'Lowongan Magang',
    desc: 'Program magang/PKL yang dikurasi bersama mitra industri untuk mahasiswa dan alumni baru.',
    badge: 'PKL',
  },
  {
    id: 'perusahaan-mitra',
    title: 'Perusahaan Mitra',
    desc: 'Profil singkat perusahaan rekanan serta daftar lowongan aktif dari masing-masing mitra.',
    badge: 'Mitra',
  },
]

const typeLabels = {
  kerja: 'Lowongan kerja',
  magang: 'Magang',
  pkl: 'PKL',
}

const filterType = ref('all')
const jobModalOpen = ref(false)
const selectedJob = ref(null)

const filteredJobs = computed(() => {
  if (!jobs.value.length) return []
  return jobs.value.filter((job) => filterType.value === 'all' || job.category === filterType.value)
})

const openJob = (job) => {
  selectedJob.value = job
  jobModalOpen.value = true
}

const closeJobModal = () => {
  jobModalOpen.value = false
  selectedJob.value = null
}

onMounted(() => {
  fetchJobs()
})
</script>

<template>
  <div class="space-y-8">
    <header class="space-y-3">
      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Lowongan Kerja</p>
      <h1 class="text-3xl font-semibold text-slate-900">Portal lowongan dan magang CDC UIN Kediri</h1>
      <p class="text-slate-600">
        Jelajahi peluang terbaru, temukan lowongan sesuai fakultas/prodi, dan bangun kolaborasi dengan mitra industri.
      </p>
      <div class="flex flex-wrap gap-3">
        <a
          href="#lowongan-terbaru"
          class="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
        >
          Lihat lowongan terbaru
        </a>
        <a
          href="#submit-lowongan"
          class="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Submit lowongan
        </a>
      </div>
    </header>

    <div class="grid gap-5 md:grid-cols-2">
      <article
        v-for="section in jobSections"
        :id="section.id === 'lowongan-terbaru' ? undefined : section.id"
        :key="section.id"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-[2px] hover:shadow-md"
      >
        <div class="flex items-center gap-3">
          <div class="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
            {{ section.badge }}
          </div>
          <div class="h-2 w-2 rounded-full bg-indigo-400" />
        </div>
        <h2 class="mt-3 text-xl font-semibold text-slate-900">{{ section.title }}</h2>
        <p class="mt-2 text-sm text-slate-600">{{ section.desc }}</p>
        <div class="mt-4 flex flex-wrap gap-2 text-[13px] text-slate-500">
          <span class="rounded-full bg-slate-100 px-3 py-1">Katalog</span>
          <span class="rounded-full bg-slate-100 px-3 py-1">Filter</span>
          <span class="rounded-full bg-slate-100 px-3 py-1">Notifikasi</span>
        </div>
      </article>
    </div>

    <section
      id="lowongan-terbaru"
      class="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">Lowongan terbaru</p>
          <h2 class="text-xl font-semibold text-slate-900">Katalog terbaru & detail lengkap</h2>
          <p class="text-xs text-slate-500">Klik lihat lengkap untuk membuka rincian lowongan.</p>
        </div>
        <p v-if="error" class="text-xs font-semibold text-rose-600">{{ error }}</p>
        <div class="inline-flex rounded-full bg-slate-50 p-1 text-[11px] font-semibold text-slate-600">
          <button
            type="button"
            class="rounded-full px-3 py-1"
            :class="filterType === 'all' ? 'bg-slate-900 text-white' : 'hover:text-slate-900'"
            @click="filterType = 'all'"
          >
            Semua
          </button>
          <button
            type="button"
            class="rounded-full px-3 py-1"
            :class="filterType === 'kerja' ? 'bg-emerald-600 text-white' : 'hover:text-slate-900'"
            @click="filterType = 'kerja'"
          >
            Kerja
          </button>
          <button
            type="button"
            class="rounded-full px-3 py-1"
            :class="filterType === 'magang' ? 'bg-indigo-600 text-white' : 'hover:text-slate-900'"
            @click="filterType = 'magang'"
          >
            Magang
          </button>
          <button
            type="button"
            class="rounded-full px-3 py-1"
            :class="filterType === 'pkl' ? 'bg-amber-500 text-white' : 'hover:text-slate-900'"
            @click="filterType = 'pkl'"
          >
            PKL
          </button>
        </div>
      </div>

      <div v-if="loading" class="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Memuat lowongan...</div>
      <div v-else-if="!filteredJobs.length" class="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        Belum ada lowongan pada kategori ini. Silakan cek kembali atau gunakan filter lain.
      </div>

      <div v-else class="grid gap-3">
        <article
          v-for="job in filteredJobs"
          :key="job.id"
          class="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
        >
          <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
                  :class="{
                    'bg-emerald-50 text-emerald-700': job.category === 'kerja',
                    'bg-indigo-50 text-indigo-700': job.category === 'magang',
                    'bg-amber-50 text-amber-700': job.category === 'pkl',
                  }"
                >
                  {{ typeLabels[job.category] || 'Kerja' }}
                </span>
                <span class="h-2 w-2 rounded-full bg-emerald-500" />
                <span class="text-xs font-semibold text-slate-600">Deadline: {{ job.deadline || '-' }}</span>
              </div>
              <h3 class="text-lg font-semibold text-slate-900">{{ job.title }}</h3>
              <p class="text-sm font-semibold text-slate-700">{{ job.company }}</p>
              <p class="text-sm text-slate-600 line-clamp-2">{{ job.summary }}</p>
              <div class="flex flex-wrap gap-2 text-[12px] text-slate-600">
                <span class="rounded-full bg-white px-3 py-1">Lokasi: {{ job.location || '-' }}</span>
                <span class="rounded-full bg-white px-3 py-1">Mode: {{ job.workMode || '-' }}</span>
                <span class="rounded-full bg-white px-3 py-1">Jenis: {{ job.jobType || '-' }}</span>
              </div>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
              @click="openJob(job)"
            >
              Lihat lengkap
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </article>
      </div>
    </section>

    <section
      id="submit-lowongan"
      class="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-100 via-sky-100 to-cyan-100 p-[1px]"
    >
      <div class="h-full rounded-[18px] bg-white p-6 shadow-sm sm:p-8">
        <div class="grid gap-6 lg:grid-cols-3">
          <div class="lg:col-span-2 space-y-3">
            <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-700">Submit Lowongan</p>
            <h2 class="text-2xl font-semibold text-slate-900">Buka peluang bagi alumni dan mahasiswa</h2>
            <p class="text-sm text-slate-700">
              Perusahaan mitra dapat mengirimkan detail lowongan (deskripsi pekerjaan, kualifikasi, lokasi, deadline, dan
              kontak HR) untuk dipublikasikan pada portal CDC UIN Kediri.
            </p>
            <ul class="list-disc space-y-1 pl-4 text-sm text-slate-600">
              <li>Tim CDC akan melakukan kurasi sebelum tayang.</li>
              <li>Dukungan publikasi multi-channel (email, WhatsApp blast, dan poster digital).</li>
              <li>Opsi penjadwalan webinar/company session untuk talent branding.</li>
            </ul>
          </div>
          <div class="flex flex-col gap-3 lg:items-end lg:text-right">
            <a
              href="mailto:tracer@kampus.ac.id?subject=Submit%20Lowongan%20Mitra%20CDC%20UIN%20Kediri"
              class="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              Kirim via email
            </a>
            <a href="#perusahaan-mitra" class="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
              Lihat daftar mitra ->
            </a>
          </div>
        </div>
      </div>
    </section>

    <div
      v-if="jobModalOpen && selectedJob"
      class="fixed inset-0 z-40 flex items-start justify-center bg-slate-900/50 p-4 sm:items-center"
      @click.self="closeJobModal"
    >
      <div
        class="relative w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
        style="max-height: 90vh"
      >
        <button
          type="button"
          class="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          @click="closeJobModal"
        >
          ✕
        </button>

        <div class="space-y-3">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">Rincian Lowongan</p>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-2xl font-semibold text-slate-900">{{ selectedJob.title }}</h3>
              <p class="text-sm font-semibold text-slate-700">{{ selectedJob.company }}</p>
              <p class="text-xs text-slate-500">{{ selectedJob.companyProfile }}</p>
            </div>
            <div class="flex gap-2 text-xs font-semibold text-slate-700">
              <span class="rounded-full bg-slate-100 px-3 py-1">Lokasi: {{ selectedJob.location }}</span>
              <span class="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">Mode: {{ selectedJob.workMode }}</span>
              <span class="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">{{ selectedJob.jobType }}</span>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Ringkasan Posisi</p>
              <p class="mt-2 text-sm text-slate-700">{{ selectedJob.summary }}</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Kompensasi & Benefit</p>
              <p class="mt-2 text-sm font-semibold text-slate-800">{{ selectedJob.compensation }}</p>
              <ul
                v-if="selectedJob.benefits && selectedJob.benefits.length"
                class="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700"
              >
                <li v-for="benefit in selectedJob.benefits" :key="benefit">{{ benefit }}</li>
              </ul>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-100 bg-white p-4">
            <p class="text-sm font-semibold text-slate-900">Tanggung Jawab Utama</p>
            <ul class="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700">
              <li v-for="item in selectedJob.responsibilities" :key="item">{{ item }}</li>
            </ul>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-2xl border border-slate-100 bg-white p-4">
              <p class="text-sm font-semibold text-slate-900">Kualifikasi & Persyaratan</p>
              <div class="mt-2 space-y-2 text-sm text-slate-700">
                <div>
                  <p class="font-semibold text-slate-800">Pendidikan</p>
                  <p>{{ selectedJob.qualifications?.education }}</p>
                </div>
                <div>
                  <p class="font-semibold text-slate-800">Pengalaman</p>
                  <p>{{ selectedJob.qualifications?.experience }}</p>
                </div>
                <div>
                  <p class="font-semibold text-slate-800">Keterampilan</p>
                  <ul class="mt-1 list-disc space-y-1 pl-4">
                    <li v-for="skill in selectedJob.qualifications?.skills" :key="skill">{{ skill }}</li>
                  </ul>
                </div>
                <div v-if="selectedJob.qualifications?.other && selectedJob.qualifications.other.length">
                  <p class="font-semibold text-slate-800">Kriteria lain</p>
                  <ul class="mt-1 list-disc space-y-1 pl-4">
                    <li v-for="other in selectedJob.qualifications.other" :key="other">{{ other }}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-100 bg-white p-4">
              <p class="text-sm font-semibold text-slate-900">Detail Pekerjaan</p>
              <div class="mt-2 space-y-2 text-sm text-slate-700">
                <p><span class="font-semibold text-slate-800">Lokasi:</span> {{ selectedJob.location }} ({{ selectedJob.workMode }})</p>
                <p><span class="font-semibold text-slate-800">Jenis Pekerjaan:</span> {{ selectedJob.jobType }}</p>
                <p><span class="font-semibold text-slate-800">Deadline:</span> {{ selectedJob.deadline }}</p>
                <p><span class="font-semibold text-slate-800">Cara Melamar:</span> {{ selectedJob.apply }}</p>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              @click="closeJobModal"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
