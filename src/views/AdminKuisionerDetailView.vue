<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminShell from '../components/AdminShell.vue'
import { useQuestionnaires } from '../stores/questionnaires'
import { useSubmissions } from '../stores/submissions'

const route = useRoute()
const router = useRouter()
const { questionnaires, fetchQuestionnaires } = useQuestionnaires()
const {
  submissions,
  fetchSubmissions,
  loading: submissionsLoading,
  error: submissionsError,
} = useSubmissions()

const questionnaireId = computed(() => String(route.params.id ?? ''))
const questionnaire = computed(
  () => questionnaires.value.find((item) => String(item.id) === questionnaireId.value) || null,
)

const filters = reactive({
  status: 'all',
  prodi: 'all',
  tahun: 'all',
  province: 'all',
  wait: 'all',
  salary: 'all',
  suitability: 'all',
})

const targetAudience = computed(() => questionnaire.value?.audience || 'alumni')

const normalizeStatus = (val, fallback = 'belum') => {
  const key = String(val || fallback).trim().toLowerCase()
  if (targetAudience.value === 'umum') return key || 'umum'
  return key === 'umum' ? 'belum' : key
}

const toNumber = (val) => {
  const num = Number(String(val ?? '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(num) ? num : 0
}

const normalizeSalaryToJt = (val) => {
  const raw = toNumber(val)
  if (!raw) return 0
  // heuristik: jika > 1000 anggap rupiah, konversi ke juta; jika kecil, anggap sudah juta
  if (raw > 1000) return Math.round((raw / 1_000_000) * 10) / 10
  return Math.round(raw * 10) / 10
}

const mapAlumniRecord = (s) => {
  const waitMonths = toNumber(
    s.waitMonths || s.bekerja_bulanDapat || s.bekerja_bulanTidak || s.mencari_mulaiSetelah || s.mencari_mulaiSebelum,
  )
  return {
    id: s.id,
    nama: s.nama || 'Alumni',
    prodi: s.prodi || 'Lainnya',
    fakultas: s.fakultas || '-',
    tahun: s.tahun ? Number(s.tahun) : null,
    status: normalizeStatus(s.status),
    waitMonths,
    salary: normalizeSalaryToJt(s.salary || s.bekerja_pendapatan),
    province: s.province || s.bekerja_provinsi || s.studi_lokasi || '-',
    industry: s.industry || s.bekerja_jenisPerusahaan || s.wira_jenisPerusahaan || s.wira_bidang || 'Lainnya',
    suitability: toNumber(s.bekerja_kesesuaianBidang || s.wira_kesesuaian || s.suitability || 0) || 0,
    eduFit: s.bekerja_pendidikanSesuai || s.wira_pendidikan || s.eduFit || '-',
  }
}

const mapPenggunaRecord = (s) => ({
  id: s.id,
  nama: s.nama || s.organisasi || 'Pengguna alumni',
  prodi: s.prodi || s.peran || s.bidang || 'Bidang/Peran',
  fakultas: s.fakultas || s.lokasi || '-',
  tahun: null,
  status: 'pengguna',
  waitMonths: 0,
  salary: 0,
  province: s.lokasi || '-',
  industry: s.bidang || 'Lainnya',
  suitability: 0,
  eduFit: s.kinerja || '-',
})

const submissionsByAudience = computed(() => {
  const targetType = targetAudience.value === 'pengguna' ? 'pengguna_alumni' : targetAudience.value
  return Array.isArray(submissions.items)
    ? submissions.items.filter((item) => (item.type || '').toLowerCase() === targetType)
    : []
})

const allRecords = computed(() => {
  if (targetAudience.value === 'pengguna') {
    return submissionsByAudience.value.map(mapPenggunaRecord)
  }
  if (targetAudience.value === 'umum') {
    return submissionsByAudience.value.map((s) => ({
      id: s.id,
      nama: s.nama || 'Responden',
      prodi: s.prodi || '-',
      fakultas: s.fakultas || '-',
      tahun: null,
      status: 'umum',
      waitMonths: 0,
      salary: 0,
      province: s.province || '-',
      industry: s.industry || '-',
      suitability: 0,
      eduFit: '-',
    }))
  }
  return submissionsByAudience.value.map(mapAlumniRecord)
})

const filteredRecords = computed(() =>
  allRecords.value.filter((item) => {
    const matchStatus = filters.status === 'all' || item.status === filters.status
    const matchProdi = filters.prodi === 'all' || item.prodi === filters.prodi
    const matchTahun = filters.tahun === 'all' || String(item.tahun) === filters.tahun
    const matchProv = filters.province === 'all' || item.province === filters.province
    const matchWait =
      filters.wait === 'all' ||
      (filters.wait === '0-3' && item.waitMonths <= 3) ||
      (filters.wait === '4-6' && item.waitMonths > 3 && item.waitMonths <= 6) ||
      (filters.wait === '7-12' && item.waitMonths > 6 && item.waitMonths <= 12) ||
      (filters.wait === '12+' && item.waitMonths > 12)
    const matchSalary =
      filters.salary === 'all' ||
      (filters.salary === '<5' && item.salary > 0 && item.salary < 5) ||
      (filters.salary === '5-8' && item.salary >= 5 && item.salary <= 8) ||
      (filters.salary === '8+' && item.salary > 8)
    const matchSuit =
      filters.suitability === 'all' ||
      (filters.suitability === 'high' && item.suitability >= 4) ||
      (filters.suitability === 'mid' && item.suitability === 3) ||
      (filters.suitability === 'low' && item.suitability > 0 && item.suitability < 3)
    return matchStatus && matchProdi && matchTahun && matchProv && matchWait && matchSalary && matchSuit
  }),
)

const summary = computed(() => {
  const data = filteredRecords.value
  const total = data.length
  const denom = Math.max(total, 1)
  const bekerjaCount = data.filter((d) => ['bekerja', 'wiraswasta'].includes(d.status)).length
  const employedPercent = total ? Math.round((bekerjaCount / denom) * 100) : 0

  const waits = data.filter((d) => d.waitMonths >= 0)
  const waitAvg = waits.length ? waits.reduce((sum, d) => sum + d.waitMonths, 0) / waits.length : 0

  const salaryItems = data.filter((d) => d.salary > 0)
  const salaryAvg = salaryItems.length
    ? salaryItems.reduce((sum, d) => sum + d.salary, 0) / salaryItems.length
    : 0

  const industryCounts = data.reduce((acc, d) => {
    const key = d.industry || 'Lainnya'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  const topIndustry = Object.entries(industryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'

  const statusConfig =
    targetAudience.value === 'pengguna'
      ? [{ key: 'pengguna', label: 'Pengguna alumni' }]
      : targetAudience.value === 'umum'
        ? [{ key: 'umum', label: 'Umum' }]
      : [
          { key: 'bekerja', label: 'Bekerja' },
          { key: 'wiraswasta', label: 'Wirausaha' },
          { key: 'melanjutkan', label: 'Studi lanjut' },
          { key: 'mencari', label: 'Mencari kerja' },
          { key: 'belum', label: 'Belum memungkinkan bekerja' },
        ]

  const statusCounts = statusConfig.map((item) => ({
    label: item.label,
    value: data.filter((d) => d.status === item.key).length,
  }))

  return {
    total,
    employedPercent,
    waitAvg: waitAvg.toFixed(1),
    salaryAvg: salaryAvg ? `${salaryAvg.toFixed(1)} jt` : 'N/A',
    topIndustry,
    statusCounts,
  }
})

const uniqueValues = computed(() => ({
  prodi: Array.from(new Set(allRecords.value.map((d) => d.prodi).filter(Boolean))),
  tahun: Array.from(new Set(allRecords.value.map((d) => d.tahun).filter(Boolean))).map(String),
  province: Array.from(new Set(allRecords.value.map((d) => d.province).filter(Boolean))),
}))

const statusFilterOptions = computed(() =>
  targetAudience.value === 'pengguna'
    ? [
        { value: 'all', label: 'Semua status' },
        { value: 'pengguna', label: 'Pengguna alumni' },
      ]
    : targetAudience.value === 'umum'
      ? [
          { value: 'all', label: 'Semua status' },
          { value: 'umum', label: 'Umum' },
        ]
      : [
          { value: 'all', label: 'Semua status' },
          { value: 'bekerja', label: 'Bekerja' },
          { value: 'wiraswasta', label: 'Wirausaha' },
          { value: 'melanjutkan', label: 'Studi lanjut' },
          { value: 'mencari', label: 'Mencari kerja' },
          { value: 'belum', label: 'Belum memungkinkan bekerja' },
        ],
)

const resetFilters = () => {
  filters.status = 'all'
  filters.prodi = 'all'
  filters.tahun = 'all'
  filters.province = 'all'
  filters.wait = 'all'
  filters.salary = 'all'
  filters.suitability = 'all'
}

const exportCsv = () => {
  const rows = filteredRecords.value
  const header = [
    'Nama',
    'Prodi',
    'Fakultas',
    'Tahun',
    'Status',
    'Masa tunggu (bulan)',
    'Gaji (jt)',
    'Provinsi',
    'Industri',
    'Kesesuaian',
  ]
  const csv = [
    header.join(','),
    ...rows.map((r) =>
      [
        r.nama,
        r.prodi,
        r.fakultas,
        r.tahun,
        r.status,
        r.waitMonths,
        r.salary,
        r.province,
        r.industry,
        r.eduFit,
      ]
        .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
        .join(','),
    ),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `tracer_detail_${Date.now()}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

const goBack = () => {
  router.push({ name: 'AdminKuisioner' })
}

const loadData = async () => {
  if (!questionnaires.value.length) {
    await fetchQuestionnaires()
  }
  if (questionnaire.value?.id) {
    await fetchSubmissions({ questionnaireId: questionnaire.value.id })
  }
}

onMounted(loadData)
</script>

<template>
  <AdminShell>
    <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Kuisioner</p>
          <h1 class="mt-1 text-2xl font-semibold text-slate-900">Detail & dashboard jawaban</h1>
          <p class="mt-1 text-xs text-slate-500">
            Lihat ringkasan jawaban tracer, filter dinamis, grafik, tabel detail, dan export.
          </p>
          <p v-if="questionnaire" class="mt-2 text-xs text-slate-600">
            Kuisioner:
            <span class="font-semibold text-slate-900">{{ questionnaire.title }}</span>
          </p>
          <p v-if="questionnaire" class="text-[11px] text-slate-500">
            Target responden:
            <span class="font-semibold text-slate-800">
              {{ questionnaire.audience === 'pengguna' ? 'Pengguna alumni' : questionnaire.audience === 'umum' ? 'Umum' : 'Alumni' }}
            </span>
          </p>
        </div>
        <button
          type="button"
          class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          @click="goBack"
        >
          Kembali ke daftar kuisioner
        </button>
      </header>

      <div v-if="submissionsError" class="mb-3 rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">
        {{ submissionsError }}
      </div>
      <div v-if="submissionsLoading" class="mb-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">
        Memuat data jawaban...
      </div>

      <div class="space-y-8">
        <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Dashboard jawaban tracer</p>
              <h2 class="text-xl font-semibold text-slate-900">Ringkasan & filter interaktif</h2>
              <p class="text-xs text-slate-500">
                Filter status kerja, prodi, tahun lulus, provinsi, masa tunggu, gaji, dan kesesuaian.
              </p>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                @click="resetFilters"
              >
                Reset filter
              </button>
              <button
                type="button"
                class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                @click="exportCsv"
              >
                Export CSV
              </button>
            </div>
          </div>

          <div class="mt-4 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            <select
              v-model="filters.status"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-indigo-400 focus:bg-white focus:outline-none"
            >
              <option v-for="opt in statusFilterOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
            <select
              v-model="filters.prodi"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-indigo-400 focus:bg-white focus:outline-none"
            >
              <option value="all">Semua prodi</option>
              <option v-for="item in uniqueValues.prodi" :key="item" :value="item">{{ item }}</option>
            </select>
            <select
              v-model="filters.tahun"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-indigo-400 focus:bg-white focus:outline-none"
            >
              <option value="all">Semua tahun</option>
              <option v-for="item in uniqueValues.tahun" :key="item" :value="item">{{ item }}</option>
            </select>
            <select
              v-model="filters.province"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-indigo-400 focus:bg-white focus:outline-none"
            >
              <option value="all">Semua provinsi</option>
              <option v-for="item in uniqueValues.province" :key="item" :value="item">{{ item }}</option>
            </select>
            <select
              v-model="filters.wait"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-indigo-400 focus:bg-white focus:outline-none"
            >
              <option value="all">Masa tunggu</option>
              <option value="0-3">0-3 bln</option>
              <option value="4-6">4-6 bln</option>
              <option value="7-12">7-12 bln</option>
              <option value="12+">>12 bln</option>
            </select>
            <select
              v-model="filters.salary"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-indigo-400 focus:bg-white focus:outline-none"
            >
              <option value="all">Rentang gaji</option>
              <option value="<5">&lt;5 jt</option>
              <option value="5-8">5-8 jt</option>
              <option value="8+">&gt;8 jt</option>
            </select>
            <select
              v-model="filters.suitability"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-indigo-400 focus:bg-white focus:outline-none md:col-span-2 lg:col-span-2"
            >
              <option value="all">Kesesuaian bidang</option>
              <option value="high">Tinggi (4-5)</option>
              <option value="mid">Sedang (3)</option>
              <option value="low">Rendah (1-2)</option>
            </select>
          </div>

          <div class="mt-4 grid gap-4 md:grid-cols-4">
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-xs font-semibold text-slate-500">Total respon</p>
              <p class="text-2xl font-semibold text-slate-900">{{ summary.total }}</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-xs font-semibold text-slate-500">% bekerja/wirausaha</p>
              <p class="text-2xl font-semibold text-slate-900">{{ summary.employedPercent }}%</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-xs font-semibold text-slate-500">Masa tunggu rata-rata</p>
              <p class="text-2xl font-semibold text-slate-900">{{ summary.waitAvg }} bln</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-xs font-semibold text-slate-500">Gaji rata-rata</p>
              <p class="text-2xl font-semibold text-slate-900">{{ summary.salaryAvg }}</p>
            </div>
          </div>

          <div class="mt-5 grid gap-4 lg:grid-cols-2">
            <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p class="text-sm font-semibold text-slate-900">Distribusi status</p>
              <div class="mt-3 space-y-2">
                <div
                  v-for="row in summary.statusCounts"
                  :key="row.label"
                  class="flex items-center gap-3"
                >
                  <div class="flex-1 rounded-full bg-white p-1">
                    <div
                      class="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-sky-500"
                      :style="{ width: `${Math.min(100, (row.value / Math.max(1, summary.total)) * 100)}%` }"
                    />
                  </div>
                  <div class="w-28 text-xs font-semibold text-slate-600">
                    {{ row.label }} ({{ row.value }})
                  </div>
                </div>
              </div>
            </div>
            <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p class="text-sm font-semibold text-slate-900">Industri terbanyak</p>
              <p class="mt-2 text-2xl font-semibold text-slate-900">{{ summary.topIndustry }}</p>
              <p class="text-xs text-slate-500">Per sektor pada jawaban tracer.</p>
            </div>
          </div>

          <div class="mt-5 rounded-2xl border border-slate-100 bg-white">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th class="px-4 py-2 text-left">Nama</th>
                    <th class="px-4 py-2 text-left">Prodi</th>
                    <th class="px-4 py-2 text-left">Tahun</th>
                    <th class="px-4 py-2 text-left">Status</th>
                    <th class="px-4 py-2 text-left">Provinsi</th>
                    <th class="px-4 py-2 text-left">Gaji (jt)</th>
                    <th class="px-4 py-2 text-left">Masa tunggu (bln)</th>
                    <th class="px-4 py-2 text-left">Industri</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-700">
                  <tr v-for="row in filteredRecords" :key="row.id">
                    <td class="px-4 py-2">{{ row.nama }}</td>
                    <td class="px-4 py-2">{{ row.prodi }}</td>
                    <td class="px-4 py-2">{{ row.tahun || '-' }}</td>
                    <td class="px-4 py-2 capitalize">{{ row.status || '-' }}</td>
                    <td class="px-4 py-2">{{ row.province || '-' }}</td>
                    <td class="px-4 py-2">{{ row.salary || '-' }}</td>
                    <td class="px-4 py-2">{{ row.waitMonths }}</td>
                    <td class="px-4 py-2">{{ row.industry }}</td>
                  </tr>
                  <tr v-if="!filteredRecords.length">
                    <td colspan="8" class="px-4 py-3 text-center text-xs text-slate-500">
                      Belum ada data tracer yang sesuai filter.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  </AdminShell>
</template>
