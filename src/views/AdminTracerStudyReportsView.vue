<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import AdminShell from '../components/AdminShell.vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import reportService from '../services/tracerStudyReportService'
import {
  confirmTracerReportDeletion,
  formatFileSize,
  needsScopeName,
  scopeLabel,
  tracerReportApiError,
  validateTracerReportFile,
} from '../utils/tracerStudyReport'

const currentYear = new Date().getFullYear()
const reports = ref([])
const meta = ref(null)
const loading = ref(false)
const saving = ref(false)
const deletingId = ref(null)
const downloadingId = ref(null)
const message = ref('')
const error = ref('')
const fileInput = ref(null)

const filters = reactive({
  search: '',
  year: '',
  scope_type: '',
  page: 1,
})

const form = reactive({
  title: '',
  description: '',
  report_year: currentYear,
  scope_type: 'universitas',
  scope_name: '',
  file: null,
})

const showScopeName = computed(() => needsScopeName(form.scope_type))
const totalPages = computed(() => Number(meta.value?.last_page || 1))

const loadReports = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await reportService.getAdminReports({
      ...filters,
      per_page: 20,
    })
    reports.value = response.items
    meta.value = response.meta
  } catch (err) {
    error.value = tracerReportApiError(err, 'Gagal memuat laporan tracer study.')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.title = ''
  form.description = ''
  form.report_year = currentYear
  form.scope_type = 'universitas'
  form.scope_name = ''
  form.file = null
  if (fileInput.value) fileInput.value.value = ''
}

const handleFileChange = (event) => {
  const file = event.target.files?.[0] || null
  const validationError = validateTracerReportFile(file)
  if (validationError) {
    error.value = validationError
    form.file = null
    event.target.value = ''
    return
  }
  error.value = ''
  form.file = file
}

const saveReport = async () => {
  message.value = ''
  error.value = ''

  if (!form.title.trim()) {
    error.value = 'Judul laporan wajib diisi.'
    return
  }
  if (showScopeName.value && !form.scope_name.trim()) {
    error.value = `Nama ${form.scope_type === 'fakultas' ? 'fakultas' : 'program studi'} wajib diisi.`
    return
  }
  const fileError = validateTracerReportFile(form.file)
  if (fileError) {
    error.value = fileError
    return
  }

  saving.value = true
  try {
    await reportService.createReport({
      title: form.title.trim(),
      description: form.description.trim(),
      report_year: form.report_year,
      scope_type: form.scope_type,
      scope_name: showScopeName.value ? form.scope_name.trim() : null,
      file: form.file,
    })
    message.value = 'Laporan tracer study berhasil diunggah dan langsung tersedia untuk publik.'
    resetForm()
    filters.page = 1
    await loadReports()
  } catch (err) {
    error.value = tracerReportApiError(err, 'Gagal mengunggah laporan tracer study.')
  } finally {
    saving.value = false
  }
}

const removeReport = async (report) => {
  if (!report?.id || deletingId.value) return
  if (!confirmTracerReportDeletion(report)) return

  deletingId.value = report.id
  message.value = ''
  error.value = ''
  try {
    await reportService.deleteReport(report.id)
    message.value = 'Laporan tracer study berhasil dihapus.'
    if (reports.value.length === 1 && filters.page > 1) filters.page -= 1
    await loadReports()
  } catch (err) {
    error.value = tracerReportApiError(err, 'Gagal menghapus laporan tracer study.')
  } finally {
    deletingId.value = null
  }
}

const download = async (report) => {
  downloadingId.value = report.id
  error.value = ''
  try {
    await reportService.downloadReport(report)
    report.downloadCount = Number(report.downloadCount || 0) + 1
  } catch (err) {
    error.value = tracerReportApiError(err, 'Gagal mengunduh laporan.')
  } finally {
    downloadingId.value = null
  }
}

const applyFilters = () => {
  filters.page = 1
  loadReports()
}

const changePage = (page) => {
  if (page < 1 || page > totalPages.value || page === filters.page) return
  filters.page = page
  loadReports()
}

const formatDate = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '-'
    : date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

onMounted(loadReports)
</script>

<template>
  <AdminShell>
    <div class="max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-10">
      <header>
        <p class="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">Tracer Study</p>
        <h1 class="mt-1 text-2xl font-semibold text-slate-900">Kelola laporan tracer study</h1>
        <p class="mt-1 text-sm text-slate-500">
          PDF yang berhasil diunggah langsung tersedia pada halaman publik Tracer Study.
        </p>
      </header>

      <div v-if="message" class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
        {{ message }}
      </div>
      <div v-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
        {{ error }}
      </div>

      <div class="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <section class="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 class="text-base font-semibold text-slate-900">Unggah laporan baru</h2>
          <p class="mt-1 text-xs text-slate-500">Format PDF, maksimal 10 MB. Laporan tidak dapat diedit setelah diunggah.</p>

          <form class="mt-5 grid gap-4" @submit.prevent="saveReport">
            <label class="grid gap-1 text-sm font-semibold text-slate-700">
              Judul laporan
              <input v-model="form.title" maxlength="255" class="rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-indigo-400" />
            </label>

            <label class="grid gap-1 text-sm font-semibold text-slate-700">
              Deskripsi
              <textarea v-model="form.description" maxlength="5000" rows="3" class="rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-indigo-400"></textarea>
            </label>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="grid gap-1 text-sm font-semibold text-slate-700">
                Tahun laporan
                <input v-model.number="form.report_year" type="number" min="2000" :max="currentYear + 1" class="rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-indigo-400" />
              </label>
              <label class="grid gap-1 text-sm font-semibold text-slate-700">
                Cakupan
                <select v-model="form.scope_type" class="rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-indigo-400">
                  <option value="universitas">Universitas</option>
                  <option value="fakultas">Fakultas</option>
                  <option value="prodi">Program Studi</option>
                </select>
              </label>
            </div>

            <label v-if="showScopeName" class="grid gap-1 text-sm font-semibold text-slate-700">
              {{ form.scope_type === 'fakultas' ? 'Nama fakultas' : 'Nama program studi' }}
              <input v-model="form.scope_name" maxlength="255" class="rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-indigo-400" />
            </label>

            <label class="grid gap-1 text-sm font-semibold text-slate-700">
              File PDF
              <input ref="fileInput" type="file" accept=".pdf,application/pdf" class="rounded-xl border border-dashed border-slate-300 p-3 text-sm font-normal" @change="handleFileChange" />
              <span v-if="form.file" class="text-xs font-normal text-slate-500">
                {{ form.file.name }} · {{ formatFileSize(form.file.size) }}
              </span>
            </label>

            <button type="submit" :disabled="saving" class="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
              {{ saving ? 'Mengunggah...' : 'Unggah dan publikasikan' }}
            </button>
          </form>
        </section>

        <section class="relative rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <LoadingOverlay :show="loading" label="Memuat laporan..." />
          <div class="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label class="grid flex-1 gap-1 text-xs font-semibold text-slate-600">
              Cari
              <input v-model="filters.search" placeholder="Judul atau cakupan..." class="rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-indigo-400" @keyup.enter="applyFilters" />
            </label>
            <label class="grid gap-1 text-xs font-semibold text-slate-600">
              Tahun
              <input v-model="filters.year" type="number" min="2000" :max="currentYear + 1" class="w-28 rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-indigo-400" />
            </label>
            <label class="grid gap-1 text-xs font-semibold text-slate-600">
              Cakupan
              <select v-model="filters.scope_type" class="rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-indigo-400">
                <option value="">Semua</option>
                <option value="universitas">Universitas</option>
                <option value="fakultas">Fakultas</option>
                <option value="prodi">Program Studi</option>
              </select>
            </label>
            <button type="button" class="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500" @click="applyFilters">Terapkan</button>
          </div>

          <div v-if="!reports.length && !loading" class="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
            Belum ada laporan yang sesuai.
          </div>

          <div v-else class="mt-5 overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="px-3 py-3">Laporan</th>
                  <th class="px-3 py-3">Cakupan</th>
                  <th class="px-3 py-3">File</th>
                  <th class="px-3 py-3">Unduhan</th>
                  <th class="px-3 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="report in reports" :key="report.id">
                  <td class="px-3 py-4">
                    <p class="font-semibold text-slate-900">{{ report.title }}</p>
                    <p class="mt-1 text-xs text-slate-500">{{ report.reportYear }} · {{ formatDate(report.createdAt) }}</p>
                  </td>
                  <td class="px-3 py-4 text-xs text-slate-600">{{ scopeLabel(report) }}</td>
                  <td class="max-w-48 px-3 py-4 text-xs text-slate-600">
                    <p class="truncate" :title="report.originalName">{{ report.originalName }}</p>
                    <p>{{ formatFileSize(report.fileSize) }}</p>
                  </td>
                  <td class="px-3 py-4 text-center text-slate-600">{{ report.downloadCount }}</td>
                  <td class="px-3 py-4">
                    <div class="flex justify-end gap-2">
                      <button type="button" class="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50" :disabled="downloadingId === report.id" @click="download(report)">
                        {{ downloadingId === report.id ? 'Mengunduh...' : 'Unduh' }}
                      </button>
                      <button type="button" class="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100" :disabled="deletingId === report.id" @click="removeReport(report)">
                        {{ deletingId === report.id ? 'Menghapus...' : 'Hapus' }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="totalPages > 1" class="mt-5 flex items-center justify-between text-xs text-slate-600">
            <span>Halaman {{ filters.page }} dari {{ totalPages }}</span>
            <div class="flex gap-2">
              <button type="button" class="rounded-full border border-slate-200 px-3 py-1.5 disabled:opacity-40" :disabled="filters.page <= 1" @click="changePage(filters.page - 1)">Sebelumnya</button>
              <button type="button" class="rounded-full border border-slate-200 px-3 py-1.5 disabled:opacity-40" :disabled="filters.page >= totalPages" @click="changePage(filters.page + 1)">Berikutnya</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </AdminShell>
</template>
