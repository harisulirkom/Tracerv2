<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminShell from '../components/AdminShell.vue'
import { useJobs } from '../stores/jobs'

const router = useRouter()
const { jobs, addJob, updateJob, deleteJob, fetchJobs, loading, error: loadError } = useJobs()

const mode = ref('create')
const editingId = ref(null)
const saving = ref(false)
const message = ref('')
const error = ref('')
const filterType = ref('all')
const searchQuery = ref('')
const page = ref(1)
const pageSize = ref(8)

const typeLabels = {
  kerja: 'Lowongan Kerja',
  magang: 'Magang',
  pkl: 'PKL',
}

const form = reactive({
  title: '',
  company: '',
  category: 'kerja', // kerja | magang | pkl
  companyProfile: '',
  location: '',
  workMode: 'Onsite',
  jobType: 'Full-time',
  deadline: '',
  summary: '',
  responsibilitiesText: '',
  education: '',
  experience: '',
  skillsText: '',
  otherText: '',
  compensation: '',
  benefitsText: '',
  apply: '',
})

const parseLines = (value) =>
  String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

const resetForm = () => {
  form.title = ''
  form.company = ''
  form.category = 'kerja'
  form.companyProfile = ''
  form.location = ''
  form.workMode = 'Onsite'
  form.jobType = 'Full-time'
  form.deadline = ''
  form.summary = ''
  form.responsibilitiesText = ''
  form.education = ''
  form.experience = ''
  form.skillsText = ''
  form.otherText = ''
  form.compensation = ''
  form.benefitsText = ''
  form.apply = ''
  mode.value = 'create'
  editingId.value = null
  message.value = ''
  error.value = ''
}

const handleSubmit = async () => {
  saving.value = true
  message.value = ''
  error.value = ''

  if (!form.title.trim() || !form.company.trim()) {
    error.value = 'Judul posisi dan nama perusahaan wajib diisi.'
    saving.value = false
    return
  }

  try {
    const payload = {
      title: form.title,
      company: form.company,
      category: form.category,
      companyProfile: form.companyProfile,
      location: form.location,
      workMode: form.workMode,
      jobType: form.jobType,
      deadline: form.deadline,
      summary: form.summary,
      responsibilities: parseLines(form.responsibilitiesText),
      qualifications: {
        education: form.education,
        experience: form.experience,
        skills: parseLines(form.skillsText),
        other: parseLines(form.otherText),
      },
      compensation: form.compensation,
      benefits: parseLines(form.benefitsText),
      apply: form.apply,
    }

    if (editingId.value) {
      await updateJob(editingId.value, payload)
      message.value = 'Lowongan diperbarui.'
    } else {
      await addJob(payload)
      message.value = 'Lowongan ditambahkan.'
    }

    resetForm()
  } catch (e) {
    error.value = e?.message || 'Terjadi kesalahan saat menyimpan lowongan.'
  } finally {
    saving.value = false
  }
}

const handleEdit = (job) => {
  mode.value = 'edit'
  editingId.value = job.id
  form.title = job.title || ''
  form.company = job.company || ''
  form.category = job.category || 'kerja'
  form.companyProfile = job.companyProfile || ''
  form.location = job.location || ''
  form.workMode = job.workMode || 'Onsite'
  form.jobType = job.jobType || 'Full-time'
  form.deadline = job.deadline || ''
  form.summary = job.summary || ''
  form.responsibilitiesText = (job.responsibilities || []).join('\n')
  form.education = job.qualifications?.education || ''
  form.experience = job.qualifications?.experience || ''
  form.skillsText = (job.qualifications?.skills || []).join('\n')
  form.otherText = (job.qualifications?.other || []).join('\n')
  form.compensation = job.compensation || ''
  form.benefitsText = (job.benefits || []).join('\n')
  form.apply = job.apply || ''
  message.value = ''
  error.value = ''
}

const handleDelete = async (id) => {
  // eslint-disable-next-line no-alert
  const confirmed = window.confirm('Hapus lowongan ini?')
  if (!confirmed) return
  await deleteJob(id)
}

const filteredJobs = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return jobs.value.filter((job) => {
    if (filterType.value !== 'all' && job.category !== filterType.value) return false
    if (!q) return true
    const haystack = `${job.title || ''} ${job.company || ''} ${job.summary || ''}`.toLowerCase()
    return haystack.includes(q)
  })
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredJobs.value.length / pageSize.value)))
const paginatedJobs = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredJobs.value.slice(start, start + pageSize.value)
})

const goBack = () => {
  router.push('/admin')
}

const openPortal = () => {
  router.push('/lowongan')
}

onMounted(() => {
  fetchJobs()
})
</script>

<template>
  <AdminShell>
    <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10">
      <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Lowongan</p>
          <h1 class="mt-1 text-2xl font-semibold text-slate-900">Kelola lowongan & magang</h1>
          <p class="mt-1 text-xs text-slate-500">
            Tambah lowongan terbaru lengkap dengan rincian, kategori, dan instruksi melamar.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            @click="goBack"
          >
            Kembali ke dashboard
          </button>
          <button
            type="button"
            class="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100"
            @click="openPortal"
          >
            Lihat di portal
          </button>
        </div>
      </header>

      <div class="grid gap-6 lg:grid-cols-3">
        <section class="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70 lg:col-span-2">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-3">
              <h2 class="text-sm font-semibold text-slate-900">Daftar lowongan</h2>
              <span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                {{ filteredJobs.length }} item
              </span>
            </div>
            <p v-if="loadError" class="text-xs font-semibold text-rose-600">{{ loadError }}</p>
            <div class="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <div class="inline-flex rounded-full bg-slate-50 p-1">
                <button
                  type="button"
                  class="rounded-full px-3 py-1 font-semibold"
                  :class="filterType === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'"
                  @click="filterType = 'all'"
                >
                  Semua
                </button>
                <button
                  type="button"
                  class="rounded-full px-3 py-1 font-semibold"
                  :class="filterType === 'kerja' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'"
                  @click="filterType = 'kerja'"
                >
                  Lowongan kerja
                </button>
                <button
                  type="button"
                  class="rounded-full px-3 py-1 font-semibold"
                  :class="filterType === 'magang' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'"
                  @click="filterType = 'magang'"
                >
                  Magang
                </button>
                <button
                  type="button"
                  class="rounded-full px-3 py-1 font-semibold"
                  :class="filterType === 'pkl' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-slate-900'"
                  @click="filterType = 'pkl'"
                >
                  PKL
                </button>
              </div>
              <div class="relative">
                <input
                  v-model="searchQuery"
                  type="text"
                  class="w-48 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 pr-7 text-xs text-slate-700 outline-none ring-0 transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="Cari posisi..."
                />
                <span class="pointer-events-none absolute right-2 top-1.5 text-[11px] text-slate-400">⌕</span>
              </div>
            </div>
        </div>

        <div v-if="loadError" class="mt-4 rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          {{ loadError }}
        </div>
        <div v-else-if="loading" class="mt-4 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
          Memuat lowongan...
        </div>
        <div v-else-if="!jobs.length" class="mt-4 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
          Belum ada lowongan. Tambahkan melalui formulir di samping.
        </div>

          <div v-else class="mt-4 space-y-3">
            <article
              v-for="job in paginatedJobs"
              :key="job.id"
              class="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-700 sm:flex-row sm:items-center"
            >
              <div class="flex-1 space-y-1">
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
                  <span class="text-[11px] text-slate-500">Deadline: {{ job.deadline || '-' }}</span>
                </div>
                <p class="text-base font-semibold text-slate-900">{{ job.title }}</p>
                <p class="text-sm font-semibold text-slate-700">{{ job.company }}</p>
                <p class="text-xs text-slate-500 line-clamp-2">{{ job.summary }}</p>
                <div class="flex flex-wrap gap-2 text-[12px] text-slate-600">
                  <span class="rounded-full bg-white px-3 py-1">Lokasi: {{ job.location || '-' }}</span>
                  <span class="rounded-full bg-white px-3 py-1">Mode: {{ job.workMode || '-' }}</span>
                  <span class="rounded-full bg-white px-3 py-1">Jenis: {{ job.jobType || '-' }}</span>
                </div>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  @click="handleEdit(job)"
                >
                  Edit
                </button>
                <button
                  type="button"
                  class="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                  @click="handleDelete(job.id)"
                >
                  Hapus
                </button>
              </div>
            </article>
            <div class="flex items-center justify-between text-xs text-slate-600">
              <span>Halaman {{ page }} / {{ totalPages }}</span>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="rounded-full border px-3 py-1"
                  :disabled="page === 1"
                  @click="page = Math.max(1, page - 1)"
                >
                  Sebelumnya
                </button>
                <button
                  type="button"
                  class="rounded-full border px-3 py-1"
                  :disabled="page >= totalPages"
                  @click="page = Math.min(totalPages, page + 1)"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                {{ mode === 'edit' ? 'Edit lowongan' : 'Tambah lowongan' }}
              </p>
              <h2 class="text-lg font-semibold text-slate-900">
                {{ mode === 'edit' ? 'Perbarui data' : 'Form lowongan' }}
              </h2>
            </div>
            <button
              v-if="mode === 'edit'"
              type="button"
              class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-700"
              @click="resetForm"
            >
              Reset
            </button>
          </div>

          <form class="mt-4 space-y-3 text-sm" @submit.prevent="handleSubmit">
            <div class="grid gap-3">
              <label class="space-y-1">
                <span class="text-xs font-semibold text-slate-600">Judul posisi *</span>
                <input
                  v-model="form.title"
                  type="text"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="Software Engineer (Backend)"
                  required
                />
              </label>
              <label class="space-y-1">
                <span class="text-xs font-semibold text-slate-600">Perusahaan *</span>
                <input
                  v-model="form.company"
                  type="text"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="PT Nusantara Digital"
                  required
                />
              </label>
              <div class="grid gap-3 sm:grid-cols-3">
                <label class="space-y-1 sm:col-span-2">
                  <span class="text-xs font-semibold text-slate-600">Profil singkat perusahaan</span>
                  <textarea
                    v-model="form.companyProfile"
                    rows="2"
                    class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    placeholder="Ringkasan industri, budaya, produk."
                  />
                </label>
                <label class="space-y-1">
                  <span class="text-xs font-semibold text-slate-600">Kategori</span>
                  <select
                    v-model="form.category"
                    class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="kerja">Lowongan kerja</option>
                    <option value="magang">Magang</option>
                    <option value="pkl">PKL</option>
                  </select>
                </label>
              </div>

              <div class="grid gap-3 sm:grid-cols-3">
                <label class="space-y-1 sm:col-span-2">
                  <span class="text-xs font-semibold text-slate-600">Lokasi</span>
                  <input
                    v-model="form.location"
                    type="text"
                    class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    placeholder="Jakarta / Hybrid"
                  />
                </label>
                <label class="space-y-1">
                  <span class="text-xs font-semibold text-slate-600">Mode kerja</span>
                  <input
                    v-model="form.workMode"
                    type="text"
                    class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    placeholder="Hybrid / Remote / Onsite"
                  />
                </label>
              </div>

              <div class="grid gap-3 sm:grid-cols-3">
                <label class="space-y-1 sm:col-span-2">
                  <span class="text-xs font-semibold text-slate-600">Jenis pekerjaan</span>
                  <input
                    v-model="form.jobType"
                    type="text"
                    class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    placeholder="Full-time / Part-time / Kontrak"
                  />
                </label>
                <label class="space-y-1">
                  <span class="text-xs font-semibold text-slate-600">Deadline</span>
                  <input
                    v-model="form.deadline"
                    type="date"
                    class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
              </div>

              <label class="space-y-1">
                <span class="text-xs font-semibold text-slate-600">Ringkasan posisi</span>
                <textarea
                  v-model="form.summary"
                  rows="2"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="Peran utama dan tujuan pekerjaan."
                />
              </label>

              <label class="space-y-1">
                <span class="text-xs font-semibold text-slate-600">Tanggung jawab utama (pisahkan baris)</span>
                <textarea
                  v-model="form.responsibilitiesText"
                  rows="3"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="Merancang API...\nMenulis unit test..."
                />
              </label>

              <div class="grid gap-3 sm:grid-cols-2">
                <label class="space-y-1">
                  <span class="text-xs font-semibold text-slate-600">Pendidikan</span>
                  <input
                    v-model="form.education"
                    type="text"
                    class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    placeholder="Minimal S1 Informatika"
                  />
                </label>
                <label class="space-y-1">
                  <span class="text-xs font-semibold text-slate-600">Pengalaman</span>
                  <input
                    v-model="form.experience"
                    type="text"
                    class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    placeholder="2-4 tahun"
                  />
                </label>
              </div>

              <label class="space-y-1">
                <span class="text-xs font-semibold text-slate-600">Keterampilan (pisahkan baris)</span>
                <textarea
                  v-model="form.skillsText"
                  rows="3"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="Node.js/Express...\nSQL/NoSQL..."
                />
              </label>

              <label class="space-y-1">
                <span class="text-xs font-semibold text-slate-600">Kriteria lain (opsional, pisahkan baris)</span>
                <textarea
                  v-model="form.otherText"
                  rows="2"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="Domisili Jabodetabek..."
                />
              </label>

              <label class="space-y-1">
                <span class="text-xs font-semibold text-slate-600">Kompensasi & benefit (ringkasan)</span>
                <input
                  v-model="form.compensation"
                  type="text"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="Rp10-15 jt/bulan, asuransi, bonus"
                />
              </label>

              <label class="space-y-1">
                <span class="text-xs font-semibold text-slate-600">Benefit (pisahkan baris)</span>
                <textarea
                  v-model="form.benefitsText"
                  rows="2"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="Asuransi kesehatan\nWFH allowance"
                />
              </label>

              <label class="space-y-1">
                <span class="text-xs font-semibold text-slate-600">Cara melamar</span>
                <textarea
                  v-model="form.apply"
                  rows="2"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="Kirim CV ke email... sertakan subjek..."
                />
              </label>
            </div>

            <div class="space-y-2">
              <p v-if="message" class="rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
                {{ message }}
              </p>
              <p v-if="error" class="rounded-2xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                {{ error }}
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                type="submit"
                class="rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:brightness-110"
                :disabled="saving"
              >
                {{ saving ? 'Menyimpan...' : mode === 'edit' ? 'Simpan perubahan' : 'Tambahkan lowongan' }}
              </button>
              <button
                type="button"
                class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                @click="resetForm"
              >
                Bersihkan
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  </AdminShell>
</template>
