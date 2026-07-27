<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import reportService from '../services/tracerStudyReportService'
import { formatFileSize, scopeLabel } from '../utils/tracerStudyReport'

const { locale } = useI18n()
const reports = ref([])
const meta = ref(null)
const loading = ref(false)
const viewingId = ref(null)
const downloadingId = ref(null)
const error = ref('')

const filters = reactive({
  year: '',
  scope_type: '',
  page: 1,
})

const copy = {
  id: {
    tag: 'Publikasi',
    title: 'Laporan Tracer Study',
    description: 'Unduh laporan tracer study berdasarkan tahun dan cakupan pelaporan.',
    year: 'Tahun',
    allYears: 'Semua tahun',
    scope: 'Cakupan',
    allScopes: 'Semua cakupan',
    apply: 'Terapkan filter',
    empty: 'Belum ada laporan tracer study yang sesuai.',
    loading: 'Memuat laporan...',
    download: 'Unduh PDF',
    view: 'Lihat PDF',
    viewing: 'Membuka...',
    downloading: 'Mengunduh...',
    downloads: 'unduhan',
    previous: 'Sebelumnya',
    next: 'Berikutnya',
    page: 'Halaman',
    of: 'dari',
    loadError: 'Gagal memuat laporan tracer study.',
    downloadError: 'Gagal mengunduh laporan.',
  },
  en: {
    tag: 'Publication',
    title: 'Tracer Study Reports',
    description: 'Download tracer study reports by reporting year and scope.',
    year: 'Year',
    allYears: 'All years',
    scope: 'Scope',
    allScopes: 'All scopes',
    apply: 'Apply filters',
    empty: 'No matching tracer study reports are available.',
    loading: 'Loading reports...',
    download: 'Download PDF',
    view: 'View PDF',
    viewing: 'Opening...',
    downloading: 'Downloading...',
    downloads: 'downloads',
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    of: 'of',
    loadError: 'Unable to load tracer study reports.',
    downloadError: 'Unable to download the report.',
  },
  ar: {
    tag: 'النشر',
    title: 'تقارير دراسة التتبع',
    description: 'تنزيل تقارير دراسة التتبع حسب السنة ونطاق التقرير.',
    year: 'السنة',
    allYears: 'كل السنوات',
    scope: 'النطاق',
    allScopes: 'كل النطاقات',
    apply: 'تطبيق التصفية',
    empty: 'لا توجد تقارير مطابقة حاليا.',
    loading: 'جار تحميل التقارير...',
    download: 'تنزيل PDF',
    view: 'عرض PDF',
    viewing: 'جار الفتح...',
    downloading: 'جار التنزيل...',
    downloads: 'تنزيل',
    previous: 'السابق',
    next: 'التالي',
    page: 'الصفحة',
    of: 'من',
    loadError: 'تعذر تحميل تقارير دراسة التتبع.',
    downloadError: 'تعذر تنزيل التقرير.',
  },
}

const ui = computed(() => copy[locale.value] || copy.id)
const totalPages = computed(() => Number(meta.value?.last_page || 1))

const loadReports = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await reportService.getPublicReports({
      ...filters,
      per_page: 6,
    })
    reports.value = response.items
    meta.value = response.meta
  } catch (err) {
    error.value = err?.response?.data?.message || err?.message || ui.value.loadError
  } finally {
    loading.value = false
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

const download = async (report) => {
  downloadingId.value = report.id
  error.value = ''
  try {
    await reportService.downloadReport(report)
    report.downloadCount = Number(report.downloadCount || 0) + 1
  } catch (err) {
    error.value = err?.response?.data?.message || err?.message || ui.value.downloadError
  } finally {
    downloadingId.value = null
  }
}

const view = async (report) => {
  viewingId.value = report.id
  error.value = ''
  try {
    await reportService.viewReport(report)
  } catch (err) {
    error.value = err?.response?.data?.message || err?.message || ui.value.downloadError
  } finally {
    viewingId.value = null
  }
}

onMounted(loadReports)
</script>

<template>
  <section class="rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/40 to-sky-50/60 p-6 shadow-sm">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">{{ ui.tag }}</p>
        <h2 class="mt-1 text-2xl font-semibold text-slate-900">{{ ui.title }}</h2>
        <p class="mt-1 text-sm text-slate-600">{{ ui.description }}</p>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label class="grid gap-1 text-xs font-semibold text-slate-600">
          {{ ui.year }}
          <input v-model="filters.year" type="number" min="2000" :max="new Date().getFullYear() + 1" :placeholder="ui.allYears" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-indigo-400 sm:w-36" />
        </label>
        <label class="grid gap-1 text-xs font-semibold text-slate-600">
          {{ ui.scope }}
          <select v-model="filters.scope_type" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-indigo-400">
            <option value="">{{ ui.allScopes }}</option>
            <option value="universitas">Universitas</option>
            <option value="fakultas">Fakultas</option>
            <option value="prodi">Program Studi</option>
          </select>
        </label>
        <button type="button" class="rounded-full bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-500" @click="applyFilters">
          {{ ui.apply }}
        </button>
      </div>
    </div>

    <div v-if="error" class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
      {{ error }}
    </div>

    <div v-if="loading" class="mt-5 rounded-2xl bg-white/80 p-5 text-sm text-slate-600">
      {{ ui.loading }}
    </div>
    <div v-else-if="!reports.length" class="mt-5 rounded-2xl bg-white/80 p-5 text-sm text-slate-600">
      {{ ui.empty }}
    </div>
    <div v-else class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article v-for="report in reports" :key="report.id" class="flex flex-col rounded-2xl border border-white bg-white p-5 shadow-sm">
        <div class="flex items-start justify-between gap-3">
          <span class="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            {{ report.reportYear }}
          </span>
          <span class="text-xs text-slate-500">{{ formatFileSize(report.fileSize) }}</span>
        </div>
        <h3 class="mt-4 text-base font-semibold text-slate-900">{{ report.title }}</h3>
        <p class="mt-1 text-xs font-semibold text-indigo-600">{{ scopeLabel(report) }}</p>
        <p v-if="report.description" class="mt-3 line-clamp-3 flex-1 text-sm text-slate-600">{{ report.description }}</p>
        <div class="mt-5 flex items-center justify-between gap-3">
          <span class="text-[11px] text-slate-500">{{ report.downloadCount }} {{ ui.downloads }}</span>
          <div class="flex gap-2">
            <button type="button" :disabled="viewingId === report.id" class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60" @click="view(report)">
              {{ viewingId === report.id ? ui.viewing : ui.view }}
            </button>
            <button type="button" :disabled="downloadingId === report.id" class="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60" @click="download(report)">
              {{ downloadingId === report.id ? ui.downloading : ui.download }}
            </button>
          </div>
        </div>
      </article>
    </div>

    <div v-if="totalPages > 1 && !loading" class="mt-5 flex items-center justify-between text-xs text-slate-600">
      <span>{{ ui.page }} {{ filters.page }} {{ ui.of }} {{ totalPages }}</span>
      <div class="flex gap-2">
        <button type="button" :disabled="filters.page <= 1" class="rounded-full border border-slate-200 bg-white px-3 py-1.5 disabled:opacity-40" @click="changePage(filters.page - 1)">{{ ui.previous }}</button>
        <button type="button" :disabled="filters.page >= totalPages" class="rounded-full border border-slate-200 bg-white px-3 py-1.5 disabled:opacity-40" @click="changePage(filters.page + 1)">{{ ui.next }}</button>
      </div>
    </div>
  </section>
</template>
