<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import BarChart from '@/components/Charts/BarChart.vue'
import DoughnutChart from '@/components/Charts/DoughnutChart.vue'
import RadarChart from '@/components/Charts/RadarChart.vue'
import MapHeatmap from '@/components/Charts/MapHeatmap.vue'
import dashboardService from '@/services/dashboardService'

const route = useRoute()
const insights = ref(null)
const loading = ref(true)
const error = ref('')

const filters = reactive({
  fakultas: '',
  prodi: '',
  tahunLulus: '',
  periode: '',
  questionnaireId: route.query?.questionnaire_id || '',
})

const fetchInsights = async () => {
  loading.value = true
  error.value = ''
  const params = {
    fakultas: filters.fakultas || undefined,
    prodi: filters.prodi || undefined,
    tahun_lulus: filters.tahunLulus || undefined,
    periode_tracer: filters.periode || undefined,
    questionnaire_id: filters.questionnaireId || undefined,
  }

  try {
    insights.value = await dashboardService.getTracerInsights(params)
  } catch (err) {
    error.value = 'Gagal memuat dashboard. Periksa koneksi atau konfigurasi backend.'
  } finally {
    loading.value = false
  }
}

watch(
  () => [filters.fakultas, filters.prodi, filters.tahunLulus, filters.periode, filters.questionnaireId],
  fetchInsights,
  { immediate: true },
)

watch(
  () => route.query?.questionnaire_id,
  (value) => {
    filters.questionnaireId = value || ''
  },
)

const filterOptions = computed(() => insights.value?.filters ?? { faculties: [], prodis: [], years: [], periods: [] })
const summary = computed(() => insights.value?.summary ?? { total_alumni: 0, total_respondents: 0, response_rate: 0, status_counts: {} })
const waitingTime = computed(() => insights.value?.waiting_time ?? { per_cohort: [], per_prodi: [], avg_wait_months: null, percent_le_3: null, percent_le_6: null, percent_gt_6: null })
const locations = computed(() => insights.value?.locations ?? { province_heatmap: [], top_cities: [], distribution: { lokal: 0, luar_daerah: 0, luar_negeri: 0 } })
const workplace = computed(() => insights.value?.workplace ?? { company_types: {}, trends: { labels: [], datasets: [] } })
const levels = computed(() => insights.value?.levels ?? { levels: {}, trend: { labels: [], datasets: [] } })
const fieldFit = computed(() => insights.value?.field_fit ?? { match_percent: null, non_degree_percent: null, per_prodi: [] })
const competencies = computed(() => insights.value?.competencies ?? { individual: { labels: [], values: [] }, learning: { labels: [], values: [] } })
const jobSearch = computed(() => insights.value?.job_search ?? { methods: {}, avg_applications: null, avg_responses: null, avg_interviews: null })
const entrepreneurship = computed(() => insights.value?.entrepreneurship ?? { total_entrepreneurs: 0, type_distribution: {}, level_distribution: {}, alignment_percent: null })
const furtherStudy = computed(() => insights.value?.further_study ?? { total_study: 0, locations: {}, funding: {}, focus_areas: {} })

const waitingCohortChartData = computed(() => ({
  labels: waitingTime.value.per_cohort.map((item) => item.label),
  datasets: [
    {
      label: 'Rerata bulan',
      data: waitingTime.value.per_cohort.map((item) => item.value),
      backgroundColor: '#2563eb',
    },
  ],
}))

const waitingProdiChartData = computed(() => ({
  labels: waitingTime.value.per_prodi.map((item) => item.label),
  datasets: [
    {
      label: 'Bulan',
      data: waitingTime.value.per_prodi.map((item) => item.value),
      backgroundColor: '#14b8a6',
    },
  ],
}))

const locationDistributionChartData = computed(() => {
  const distribution = locations.value.distribution
  return {
    labels: ['Lokal', 'Luar Daerah', 'Luar Negeri'],
    datasets: [
      {
        data: [distribution.lokal, distribution.luar_daerah, distribution.luar_negeri],
        backgroundColor: ['#0f766e', '#f97316', '#2563eb'],
      },
    ],
  }
})

const companyTypeChartData = computed(() => {
  const entries = Object.entries(workplace.value.company_types)
  return {
    labels: entries.map(([label]) => label),
    datasets: [
      {
        data: entries.map(([, value]) => value),
        backgroundColor: ['#14b8a6', '#22c55e', '#0ea5e9', '#f97316', '#6366f1', '#fb7185'],
      },
    ],
  }
})

const workplaceLevelChartData = computed(() => ({
  labels: Object.keys(levels.value.levels),
  datasets: [
    {
      label: 'Persentase',
      data: Object.values(levels.value.levels),
      backgroundColor: '#a855f7',
    },
  ],
}))

const workplaceTrendPalette = ['#14b8a6', '#0ea5e9', '#f97316', '#22c55e', '#6366f1', '#fb7185']
const workplaceTrendChartData = computed(() => {
  const trend = workplace.value.trends ?? { labels: [], datasets: [] }
  return {
    labels: trend.labels,
    datasets: (trend.datasets ?? []).map((dataset, index) => ({
      label: dataset.label,
      data: dataset.data,
      backgroundColor: workplaceTrendPalette[index % workplaceTrendPalette.length],
    })),
  }
})

const levelTrendChartData = computed(() => {
  const trend = levels.value.trend ?? { labels: [], datasets: [] }
  return {
    labels: trend.labels,
    datasets: (trend.datasets ?? []).map((dataset) => ({
      ...dataset,
      backgroundColor: '#a855f7',
    })),
  }
})

const fieldFitProdiChartData = computed(() => ({
  labels: fieldFit.value.per_prodi.map((item) => item.label),
  datasets: [
    {
      label: 'Persentase',
      data: fieldFit.value.per_prodi.map((item) => item.value),
      backgroundColor: '#22d3ee',
    },
  ],
}))

const jobSearchMethodChartData = computed(() => {
  const entries = Object.entries(jobSearch.value.methods || {})
  return {
    labels: entries.map(([label]) => label),
    datasets: [
      {
        label: 'Responden',
        data: entries.map(([, value]) => value),
        backgroundColor: '#0ea5e9',
      },
    ],
  }
})

const topCitiesList = computed(() => locations.value.top_cities ?? [])
const entrepreneurshipTypeList = computed(() =>
  Object.entries(entrepreneurship.value.type_distribution || {}).map(([label, value]) => ({ label, value })),
)
const entrepreneurshipLevelList = computed(() =>
  Object.entries(entrepreneurship.value.level_distribution || {}).map(([label, value]) => ({ label, value })),
)
const furtherStudyLocationList = computed(() =>
  Object.entries(furtherStudy.value.locations || {}).map(([label, value]) => ({ label, value })),
)
const furtherStudyFundingList = computed(() =>
  Object.entries(furtherStudy.value.funding || {}).map(([label, value]) => ({ label, value })),
)
const furtherStudyFocusList = computed(() =>
  Object.entries(furtherStudy.value.focus_areas || {}).map(([label, value]) => ({ label, value })),
)

const competencyIndividualData = computed(() => ({
  labels: competencies.value.individual.labels,
  datasets: [
    {
      label: 'Individu',
      data: competencies.value.individual.values,
      backgroundColor: 'rgba(14, 165, 233, 0.6)',
      borderColor: '#0ea5e9',
    },
  ],
}))

const competencyLearningData = computed(() => ({
  labels: competencies.value.learning.labels,
  datasets: [
    {
      label: 'Pendekatan Pembelajaran',
      data: competencies.value.learning.values,
      backgroundColor: 'rgba(252, 211, 77, 0.6)',
      borderColor: '#facc15',
    },
  ],
}))

const jobMethodList = computed(() =>
  Object.entries(jobSearch.value.methods || {})
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value),
)

const summaryCards = computed(() => {
  const counts = summary.value.status_counts || {}
  return [
    { label: 'Total Alumni', value: summary.value.total_alumni },
    { label: 'Total Alumni Mengisi Tracer', value: summary.value.total_respondents },
    { label: 'Response Rate', value: `${summary.value.response_rate}%` },
    { label: 'Alumni Bekerja', value: counts.bekerja || 0 },
    { label: 'Alumni Wirausaha', value: counts.wirausaha || 0 },
    { label: 'Alumni Studi Lanjut', value: counts.studi_lanjut || 0 },
    { label: 'Alumni Belum Bekerja', value: counts.belum_bekerja || 0 },
  ]
})
</script>

<template>
  <main class="mx-auto max-w-6xl space-y-6 py-8 px-4">
    <header class="space-y-2 text-center">
      <p class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">CDC UIN Tracer Study</p>
      <h1 class="text-3xl font-semibold text-slate-900">Dashboard Admin Tracer Study</h1>
      <p class="text-sm text-slate-600">
        Analitik real-time terkait status alumni, masa tunggu kerja, lokasi penempatan, dan studi lanjut.
      </p>
    </header>

    <section class="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
      <div class="grid gap-4 md:grid-cols-5">
        <label class="space-y-1">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Fakultas</span>
          <select v-model="filters.fakultas" class="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700">
            <option value="">Semua Fakultas</option>
            <option v-for="faculty in filterOptions.faculties" :key="faculty" :value="faculty">{{ faculty }}</option>
          </select>
        </label>
        <label class="space-y-1">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Prodi</span>
          <select v-model="filters.prodi" class="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700">
            <option value="">Semua Prodi</option>
            <option v-for="prodi in filterOptions.prodis" :key="prodi" :value="prodi">{{ prodi }}</option>
          </select>
        </label>
        <label class="space-y-1">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tahun Lulus</span>
          <select v-model="filters.tahunLulus" class="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700">
            <option value="">Semua Angkatan</option>
            <option v-for="year in filterOptions.years" :key="year" :value="year">Angkatan {{ year }}</option>
          </select>
        </label>
        <label class="space-y-1">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Periode Tracer</span>
          <select v-model="filters.periode" class="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700">
            <option value="">Semua Periode</option>
            <option v-for="period in filterOptions.periods" :key="period.value" :value="period.value">
              {{ period.label }}
            </option>
          </select>
        </label>
        <label class="space-y-1">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Questionnaire</span>
          <input
            type="text"
            v-model="filters.questionnaireId"
            placeholder="ID Kuisioner (opsional)"
            class="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700"
          />
        </label>
      </div>
    </section>

    <section v-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {{ error }}
    </section>

    <section v-else class="space-y-6">
      <div v-if="loading" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p class="text-sm text-slate-500">Memuat data dashboard...</p>
      </div>

      <div v-else class="space-y-6">
        <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="space-y-1 border-b border-slate-100 pb-4">
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Summary Utama (KPI Cards)</p>
            <p class="text-sm text-slate-600">Menampilkan indikator kinerja utama alumni secara ringkas untuk evaluasi cepat.</p>
          </div>
          <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div v-for="card in summaryCards" :key="card.label" class="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{{ card.label }}</p>
              <p class="text-3xl font-semibold text-slate-900">{{ card.value || 0 }}</p>
            </div>
          </div>
        </section>

        <div class="grid gap-4 lg:grid-cols-3">
          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-semibold text-slate-900">Rerata Masa Tunggu (bulan)</p>
            <p class="mt-2 text-3xl font-semibold text-emerald-600">{{ waitingTime.value.avg_wait_months ?? '-' }}</p>
            <div class="mt-4 grid gap-3 sm:grid-cols-3">
              <div class="text-center">
                <p class="text-xs uppercase text-slate-500">≤ 3 bulan</p>
                <p class="text-lg font-semibold text-slate-900">{{ waitingTime.value.percent_le_3 ?? '-' }}%</p>
              </div>
              <div class="text-center">
                <p class="text-xs uppercase text-slate-500">≤ 6 bulan</p>
                <p class="text-lg font-semibold text-slate-900">{{ waitingTime.value.percent_le_6 ?? '-' }}%</p>
              </div>
              <div class="text-center">
                <p class="text-xs uppercase text-slate-500">> 6 bulan</p>
                <p class="text-lg font-semibold text-slate-900">{{ waitingTime.value.percent_gt_6 ?? '-' }}%</p>
              </div>
            </div>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
            <p class="text-sm font-semibold text-slate-900">Masa Tunggu per Angkatan</p>
            <BarChart :chartData="waitingCohortChartData" :height="220" />
          </div>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-sm font-semibold text-slate-900">Tren Jenis Tempat Kerja per Angkatan</p>
            <BarChart :chartData="workplaceTrendChartData" :height="220" />
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-sm font-semibold text-slate-900">Tren Tingkat Lokasi Kerja</p>
            <BarChart :chartData="levelTrendChartData" :height="220" />
          </div>
        </div>

        <div class="grid gap-4 lg:grid-cols-3">
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
            <MapHeatmap :regions="locations.value.province_heatmap" title="Sebaran Provinsi Kerja" />
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-sm font-semibold text-slate-900">Distribusi Lokasi Kerja</p>
            <DoughnutChart :chartData="locationDistributionChartData" :height="220" />
            <ul class="mt-4 space-y-2 text-sm text-slate-600">
              <li v-for="city in topCitiesList" :key="city.city">
                {{ city.city }} · {{ city.count }} responden
              </li>
            </ul>
          </div>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-sm font-semibold text-slate-900">Jenis Tempat Kerja</p>
            <DoughnutChart :chartData="companyTypeChartData" :height="220" />
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-sm font-semibold text-slate-900">Tingkat Lokasi Kerja</p>
            <BarChart :chartData="workplaceLevelChartData" :height="220" />
          </div>
        </div>

        <section class="grid gap-4 lg:grid-cols-2">
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-sm font-semibold text-slate-900">Kesesuaian Bidang Studi</p>
            <div class="mt-3 flex gap-4 text-sm">
              <div>
                <p class="text-xs uppercase text-slate-500">Sesuai bidang</p>
                <p class="text-2xl font-semibold text-emerald-600">{{ fieldFit.value.match_percent ?? '-' }}%</p>
              </div>
              <div>
                <p class="text-xs uppercase text-slate-500">Tidak butuh pendidikan tinggi</p>
                <p class="text-2xl font-semibold text-slate-900">{{ fieldFit.value.non_degree_percent ?? '-' }}%</p>
              </div>
            </div>
            <div class="mt-4">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Per prodi</p>
              <BarChart :chartData="fieldFitProdiChartData" :height="160" />
            </div>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-sm font-semibold text-slate-900">Job Search Journey</p>
            <BarChart :chartData="jobSearchMethodChartData" :height="180" />
            <ul class="mt-3 space-y-2 text-sm text-slate-600">
              <li v-for="method in jobMethodList" :key="method.label">
                {{ method.label }} · {{ method.value }} responden
              </li>
            </ul>
            <div class="mt-4 grid gap-4 text-sm text-slate-600 sm:grid-cols-3">
              <div>
                <p class="text-xs uppercase text-slate-500">Rata-rata lamaran</p>
                <p class="text-lg font-semibold text-slate-900">{{ jobSearch.value.avg_applications ?? '-' }}</p>
              </div>
              <div>
                <p class="text-xs uppercase text-slate-500">Rata-rata respon</p>
                <p class="text-lg font-semibold text-slate-900">{{ jobSearch.value.avg_responses ?? '-' }}</p>
              </div>
              <div>
                <p class="text-xs uppercase text-slate-500">Rata-rata wawancara</p>
                <p class="text-lg font-semibold text-slate-900">{{ jobSearch.value.avg_interviews ?? '-' }}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="grid gap-4 lg:grid-cols-2">
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-sm font-semibold text-slate-900">Kompetensi Individu</p>
            <RadarChart :chartData="competencyIndividualData" :height="280" />
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-sm font-semibold text-slate-900">Kompetensi Pembelajaran</p>
            <RadarChart :chartData="competencyLearningData" :height="280" />
          </div>
        </section>

        <section class="grid gap-4 lg:grid-cols-2">
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-sm font-semibold text-slate-900">Statistik Wirausaha</p>
            <p class="text-3xl font-semibold text-amber-600">{{ entrepreneurship.value.total_entrepreneurs }}</p>
            <p class="text-xs uppercase text-slate-500 mt-2">Kesesuaian studi: {{ entrepreneurship.value.alignment_percent ?? '-' }}%</p>
            <div class="mt-3 space-y-2 text-sm text-slate-600">
              <p class="text-xs uppercase text-slate-500">Jenis usaha populer</p>
              <ul class="space-y-1">
                <li v-for="item in entrepreneurshipTypeList" :key="item.label">
                  {{ item.label }} · {{ item.value }}
                </li>
              </ul>
              <p class="text-xs uppercase text-slate-500">Tingkat usaha</p>
              <ul class="space-y-1">
                <li v-for="item in entrepreneurshipLevelList" :key="item.label">
                  {{ item.label }} · {{ item.value }}
                </li>
              </ul>
            </div>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-sm font-semibold text-slate-900">Statistik Studi Lanjut</p>
            <p class="text-3xl font-semibold text-indigo-600">{{ furtherStudy.value.total_study }}</p>
            <div class="mt-3 text-sm text-slate-600">
              <p class="text-xs uppercase text-slate-500">Lokasi studi</p>
              <ul class="space-y-1">
                <li v-for="item in furtherStudyLocationList" :key="item.label">
                  {{ item.label }} · {{ item.value }}
                </li>
              </ul>
              <p class="text-xs uppercase text-slate-500 mt-3">Pembiayaan</p>
              <ul class="space-y-1">
                <li v-for="item in furtherStudyFundingList" :key="item.label">
                  {{ item.label }} · {{ item.value }}
                </li>
              </ul>
              <p class="text-xs uppercase text-slate-500 mt-3">Tujuan Universitas/Prodi</p>
              <ul class="space-y-1">
                <li v-for="item in furtherStudyFocusList" :key="item.label">
                  {{ item.label }} · {{ item.value }}
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-sm font-semibold text-slate-900">Grafik Masa Tunggu per Prodi</p>
          <BarChart :chartData="waitingProdiChartData" :height="220" />
        </section>
      </div>
    </section>
  </main>
</template>
