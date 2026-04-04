<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import * as XLSX from 'xlsx'
import AdminShell from '../components/AdminShell.vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import tracerService from '../services/tracerService'
import { useAuth } from '../stores/auth'
import { useAlumni } from '../stores/alumni'
import { useQuestionnaires } from '../stores/questionnaires'
import { useSubmissions } from '../stores/submissions'

const TS_LABEL_ORDER = ['TS', 'TS-1', 'TS-2', 'TS-3', 'TS-4', 'TS-5']
const DEFAULT_TS_LABELS = ['TS-1', 'TS-2']
const MAX_RESPONSE_PAGE = 200
const RESPONSE_PAGE_SIZE = 200
const RESPONSE_FETCH_BATCH_SIZE = 6
const RESPONSE_FETCH_TIMEOUT_MS = 30_000
const RESPONSE_CACHE_TTL_MS = 1000 * 60 * 5
const RESPONSE_PERSIST_KEY = 'tracer_accreditation_response_cache'
const NIM_COVERAGE_SAMPLE_SIZE = 120
const DETAIL_PAGE_SIZE_OPTIONS = [20, 50, 100, 'all']
const FREEZE_STORAGE_KEY = 'tracer_accreditation_freezes'
const AUDIT_STORAGE_KEY = 'tracer_accreditation_audit'
const MAX_AUDIT_LOG = 80
const responseMemoryCache = new Map()

const auth = useAuth()
const { alumni, fetchAlumni } = useAlumni()
const { fetchActiveQuestionnaire } = useQuestionnaires()
const { submissions } = useSubmissions()

const loading = ref(false)
const error = ref('')
const rawResponses = ref([])
const summaryPayload = ref(null)
const usingSummaryEndpoint = ref(false)
const hasRemoteDataLoaded = ref(false)
const lastUpdatedAt = ref('')
const questionnaireMeta = ref({ id: null, title: '' })
const isLocalDataMode = ref(!import.meta.env.VITE_API_BASE_URL)
const activeLoadController = ref(null)
const activeLoadSequence = ref(0)

const filters = reactive({
  accreditationYear: new Date().getFullYear(),
  fakultas: 'all',
  prodi: 'all',
  tsLabels: [...DEFAULT_TS_LABELS],
})

const readStorageArray = (key) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    return []
  }
}

const saveStorageArray = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(Array.isArray(value) ? value : []))
  } catch (err) {
    // ignore write failures
  }
}

const readResponsePersistedCache = () => {
  try {
    const raw = localStorage.getItem(RESPONSE_PERSIST_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const hasResponses = Array.isArray(parsed?.responses)
    const hasSummaryPayload = parsed?.summaryPayload && typeof parsed.summaryPayload === 'object'
    if (!hasResponses && !hasSummaryPayload) return null
    const savedAt = Number(parsed?.savedAt || 0)
    if (!savedAt || Date.now() - savedAt > RESPONSE_CACHE_TTL_MS) return null
    return parsed
  } catch (err) {
    return null
  }
}

const writeResponsePersistedCache = ({ responses = [], summaryPayload: payload = null, questionnaire = {}, savedAt = Date.now() } = {}) => {
  try {
    localStorage.setItem(
      RESPONSE_PERSIST_KEY,
      JSON.stringify({
        responses: Array.isArray(responses) ? responses : [],
        summaryPayload: payload && typeof payload === 'object' ? payload : null,
        questionnaire: questionnaire || {},
        savedAt,
      }),
    )
  } catch (err) {
    // ignore write failures
  }
}

const useFrozenSnapshot = ref(true)
const frozenSnapshots = ref(readStorageArray(FREEZE_STORAGE_KEY))
const auditLogs = ref(readStorageArray(AUDIT_STORAGE_KEY))

const hasValue = (value) => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim() !== ''
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value).length > 0
  return true
}

const isCanceledError = (err) => {
  const code = String(err?.code || '').toUpperCase()
  const message = String(err?.message || '').toLowerCase()
  return code === 'ERR_CANCELED' || message.includes('canceled') || message.includes('cancelled')
}

const scalar = (value) => String(value ?? '').trim()
const clonePlain = (value, fallback = null) => {
  try {
    return JSON.parse(JSON.stringify(value))
  } catch (err) {
    return fallback
  }
}

const readObjectValue = (obj, key) => {
  if (!obj || typeof obj !== 'object') return undefined
  if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key]
  const snake = String(key).replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)
  const camel = String(key).replace(/_([a-z])/g, (_, char) => char.toUpperCase())
  if (Object.prototype.hasOwnProperty.call(obj, snake)) return obj[snake]
  if (Object.prototype.hasOwnProperty.call(obj, camel)) return obj[camel]
  return undefined
}

const pickFirst = (...values) => values.find((value) => hasValue(value))

const normalizeYear = (value) => {
  const raw = scalar(value).replace(/[^\d]/g, '')
  if (!raw) return null
  const num = Number(raw)
  if (!Number.isFinite(num)) return null
  if (num < 1990 || num > 2100) return null
  return num
}

const normalizeName = (value, fallback = '-') => {
  const text = scalar(value)
  return text || fallback
}

const normalizeNim = (value) => scalar(value).toLowerCase()

const resolveTsLabel = (graduationYear, accreditationYear) => {
  const year = normalizeYear(graduationYear)
  const accYear = normalizeYear(accreditationYear)
  if (!year || !accYear) return ''
  const diff = accYear - year
  if (diff < 0 || diff > 5) return ''
  return diff === 0 ? 'TS' : `TS-${diff}`
}

const toObject = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {})

const toSafeNumber = (value, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const normalizeRateString = (value) => toSafeNumber(value, 0).toFixed(2)

const normalizeTsLabels = (value, fallback = [...DEFAULT_TS_LABELS]) => {
  const list = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',').map((item) => item.trim()).filter(Boolean)
      : []
  const normalized = TS_LABEL_ORDER.filter((label) => list.includes(label))
  return normalized.length ? normalized : [...fallback]
}

const normalizeSummaryRow = (item) => {
  const source = toObject(item)
  const tsLabel = scalar(pickFirst(source.tsLabel, source.ts_label))
  return {
    tsLabel: tsLabel || '-',
    totalAlumni: toSafeNumber(pickFirst(source.totalAlumni, source.total_alumni), 0),
    respondents: toSafeNumber(pickFirst(source.respondents, source.total_respondents), 0),
    responseRate: normalizeRateString(pickFirst(source.responseRate, source.response_rate)),
  }
}

const normalizeDetailEntry = (entry, fallbackTsLabel = '') => {
  const source = toObject(entry)
  const tahunLulus = normalizeYear(pickFirst(source.tahunLulus, source.tahun_lulus, source.tahun))
  const attemptCount = Math.max(0, Math.trunc(toSafeNumber(pickFirst(source.attemptCount, source.attempt_count), 0)))
  return {
    id: pickFirst(source.id, source.attemptId, source.attempt_id, source.uuid, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    nim: normalizeNim(pickFirst(source.nim, source.nim_alumni)),
    nama: normalizeName(pickFirst(source.nama, source.name), '-'),
    fakultas: normalizeName(pickFirst(source.fakultas, source.faculty), '-'),
    prodi: normalizeName(pickFirst(source.prodi, source.program_studi, source.programStudi), '-'),
    tahunLulus: tahunLulus || resolveTsYear(fallbackTsLabel) || '-',
    status: normalizeName(pickFirst(source.status, source.statusPekerjaan, source.status_pekerjaan), '-'),
    lastSubmittedAt: pickFirst(source.lastSubmittedAt, source.last_submitted_at, source.createdAt, source.created_at) || null,
    attemptCount,
  }
}

const normalizeDetailBucket = (bucket, tsLabel = '') => {
  const source = toObject(bucket)
  const parseList = (value) => (Array.isArray(value) ? value.map((item) => normalizeDetailEntry(item, tsLabel)) : [])
  return {
    already: parseList(pickFirst(source.already, source.sudah, source.filled)),
    pending: parseList(pickFirst(source.pending, source.belum, source.unfilled)),
    unmatched: parseList(pickFirst(source.unmatched, source.tanpa_match, source.unmatched_responses)),
  }
}

const normalizeSummaryPayload = (payload, fallbackScope = {}) => {
  const root = toObject(payload)
  const dataNode = toObject(root.data)
  const source = Object.keys(dataNode).length ? dataNode : root
  const scope = toObject(pickFirst(source.scope, source.filters))
  const summaryNode = toObject(pickFirst(source.summary, source.ringkasan))
  const cohortSource = Array.isArray(pickFirst(source.cohortRows, source.cohort_rows, source.cohorts))
    ? pickFirst(source.cohortRows, source.cohort_rows, source.cohorts)
    : []
  const detailNode = toObject(pickFirst(source.detailByTs, source.detail_by_ts))
  const filterOptionsNode = toObject(pickFirst(source.filterOptions, source.filter_options))
  const prodiByFakultasNode = toObject(
    pickFirst(filterOptionsNode.prodiByFakultas, filterOptionsNode.prodi_by_fakultas),
  )
  const detailByTs = {}

  const activeLabels = normalizeTsLabels(
    pickFirst(scope.tsLabels, scope.ts_labels, fallbackScope.tsLabels),
    fallbackScope.tsLabels,
  )

  activeLabels.forEach((label) => {
    detailByTs[label] = normalizeDetailBucket(detailNode[label], label)
  })

  Object.keys(detailNode).forEach((label) => {
    if (detailByTs[label]) return
    detailByTs[label] = normalizeDetailBucket(detailNode[label], label)
  })

  const normalizedCohortRows = cohortSource
    .map((row) => normalizeSummaryRow(row))
    .filter((row) => row.tsLabel !== '-')

  const normalizedScope = {
    accreditationYear: normalizeYear(
      pickFirst(scope.accreditationYear, scope.accreditation_year, fallbackScope.accreditationYear),
    ) || new Date().getFullYear(),
    fakultas: scalar(pickFirst(scope.fakultas, fallbackScope.fakultas)) || 'all',
    prodi: scalar(pickFirst(scope.prodi, fallbackScope.prodi)) || 'all',
    tsLabels: activeLabels,
  }

  return {
    scope: normalizedScope,
    summary: {
      totalAlumni: toSafeNumber(pickFirst(summaryNode.totalAlumni, summaryNode.total_alumni), 0),
      totalRespondents: toSafeNumber(pickFirst(summaryNode.totalRespondents, summaryNode.total_respondents), 0),
      responseRate: normalizeRateString(pickFirst(summaryNode.responseRate, summaryNode.response_rate)),
      rawResponses: toSafeNumber(pickFirst(summaryNode.rawResponses, summaryNode.raw_responses), 0),
      unmatchedResponses: toSafeNumber(pickFirst(summaryNode.unmatchedResponses, summaryNode.unmatched_responses), 0),
    },
    cohortRows: normalizedCohortRows,
    detailByTs,
    source: {
      questionnaireId: pickFirst(source.questionnaireId, source.questionnaire_id, source.source?.questionnaireId, source.source?.questionnaire_id, null),
      questionnaireTitle: pickFirst(source.questionnaireTitle, source.questionnaire_title, source.source?.questionnaireTitle, source.source?.questionnaire_title, ''),
      generatedAt: pickFirst(source.generatedAt, source.generated_at, source.source?.generatedAt, source.source?.generated_at, null),
      responseCount: toSafeNumber(pickFirst(source.responseCount, source.response_count, source.source?.responseCount, source.source?.response_count), 0),
    },
    filterOptions: {
      fakultas: Array.isArray(filterOptionsNode.fakultas) ? filterOptionsNode.fakultas.map((item) => scalar(item)).filter(Boolean) : [],
      prodi: Array.isArray(filterOptionsNode.prodi) ? filterOptionsNode.prodi.map((item) => scalar(item)).filter(Boolean) : [],
      prodiByFakultas: Object.fromEntries(
        Object.entries(prodiByFakultasNode).map(([fakultas, list]) => [
          scalar(fakultas),
          Array.isArray(list) ? list.map((item) => scalar(item)).filter(Boolean) : [],
        ]),
      ),
    },
  }
}

const isSummaryEndpointReady = (payload) => {
  const summaryNode = payload?.summary
  const cohort = payload?.cohortRows
  return Boolean(
    summaryNode &&
    typeof summaryNode === 'object' &&
    Array.isArray(cohort),
  )
}

const getRawContainer = (record) => {
  const source = record && typeof record === 'object' ? record : {}
  const raw = source.raw && typeof source.raw === 'object' ? source.raw : source
  const formData = raw.formData && typeof raw.formData === 'object'
    ? raw.formData
    : raw.form_data && typeof raw.form_data === 'object'
      ? raw.form_data
      : {}
  const biodata = raw.biodata && typeof raw.biodata === 'object' ? raw.biodata : {}
  return { source, raw, formData, biodata }
}

const extractSubmissionPayload = (record, accreditationYear) => {
  const { source, raw, formData, biodata } = getRawContainer(record)
  const nim = pickFirst(
    readObjectValue(source, 'nim'),
    readObjectValue(raw, 'nim'),
    readObjectValue(formData, 'nim'),
    readObjectValue(biodata, 'nim'),
  )
  const tahunLulus = pickFirst(
    readObjectValue(source, 'tahun'),
    readObjectValue(source, 'tahunLulus'),
    readObjectValue(source, 'tahun_lulus'),
    readObjectValue(raw, 'tahun'),
    readObjectValue(raw, 'tahunLulus'),
    readObjectValue(raw, 'tahun_lulus'),
    readObjectValue(formData, 'tahun'),
    readObjectValue(formData, 'tahunLulus'),
    readObjectValue(formData, 'tahun_lulus'),
    readObjectValue(biodata, 'tahunLulus'),
    readObjectValue(biodata, 'tahun_lulus'),
    readObjectValue(raw, 'graduation_year'),
  )
  const fakultas = pickFirst(
    readObjectValue(source, 'fakultas'),
    readObjectValue(raw, 'fakultas'),
    readObjectValue(formData, 'fakultas'),
    readObjectValue(biodata, 'fakultas'),
    readObjectValue(raw, 'faculty'),
  )
  const prodi = pickFirst(
    readObjectValue(source, 'prodi'),
    readObjectValue(raw, 'prodi'),
    readObjectValue(formData, 'prodi'),
    readObjectValue(biodata, 'prodi'),
    readObjectValue(raw, 'program_studi'),
    readObjectValue(raw, 'programStudi'),
  )
  const status = pickFirst(
    readObjectValue(source, 'status'),
    readObjectValue(raw, 'status'),
    readObjectValue(formData, 'status'),
    readObjectValue(raw, 'status_pekerjaan'),
    readObjectValue(formData, 'status_pekerjaan'),
  )
  const createdAt = pickFirst(
    source.createdAt,
    source.created_at,
    raw.createdAt,
    raw.created_at,
  )
  const year = normalizeYear(tahunLulus)
  const tsLabel = resolveTsLabel(year, accreditationYear)
  return {
    id: source.id || source.attempt_id || source.uuid || crypto.randomUUID?.() || `${Date.now()}`,
    nim: normalizeNim(nim),
    fakultas: normalizeName(fakultas),
    prodi: normalizeName(prodi),
    status: normalizeName(status),
    tahunLulus: year,
    tsLabel,
    createdAt: createdAt ? new Date(createdAt).toISOString() : null,
  }
}

const normalizeAlumniRows = computed(() => {
  return (alumni.value.items || [])
    .map((item) => {
      const year = normalizeYear(item.tahunLulus || item.tahun || item.tahun_lulus)
      const tsLabel = resolveTsLabel(year, filters.accreditationYear)
      return {
        nim: normalizeNim(item.nim),
        nama: normalizeName(item.nama, '-'),
        tahunLulus: year,
        fakultas: normalizeName(item.fakultas),
        prodi: normalizeName(item.prodi),
        tsLabel,
      }
    })
    .filter((item) => hasValue(item.nim) && item.tahunLulus)
})

const alumniByNim = computed(() => {
  const map = new Map()
  normalizeAlumniRows.value.forEach((row) => {
    if (row.nim) map.set(row.nim, row)
  })
  return map
})

const normalizedResponses = computed(() =>
  rawResponses.value.map((item) => {
    const parsed = extractSubmissionPayload(item, filters.accreditationYear)
    const matchedAlumni = parsed.nim ? alumniByNim.value.get(parsed.nim) : null
    if (matchedAlumni) {
      return {
        ...parsed,
        tahunLulus: matchedAlumni.tahunLulus,
        fakultas: matchedAlumni.fakultas,
        prodi: matchedAlumni.prodi,
        tsLabel: matchedAlumni.tsLabel,
        matchedAlumni: true,
      }
    }
    return { ...parsed, matchedAlumni: false }
  }),
)

const fakultasOptions = computed(() => {
  if (usingSummaryEndpoint.value) {
    const fromSummary = summaryPayload.value?.filterOptions?.fakultas
    if (Array.isArray(fromSummary) && fromSummary.length) {
      return [...new Set(fromSummary)].sort((a, b) => a.localeCompare(b))
    }
  }
  const values = new Set()
  normalizeAlumniRows.value.forEach((item) => values.add(item.fakultas))
  normalizedResponses.value.forEach((item) => values.add(item.fakultas))
  return Array.from(values).filter(Boolean).sort((a, b) => a.localeCompare(b))
})

const prodiOptions = computed(() => {
  if (usingSummaryEndpoint.value) {
    const options = summaryPayload.value?.filterOptions || {}
    const byFakultas = toObject(options.prodiByFakultas)
    if (filters.fakultas !== 'all') {
      const scoped = byFakultas[filters.fakultas]
      if (Array.isArray(scoped) && scoped.length) {
        return [...new Set(scoped)].sort((a, b) => a.localeCompare(b))
      }
    }
    if (Array.isArray(options.prodi) && options.prodi.length) {
      return [...new Set(options.prodi)].sort((a, b) => a.localeCompare(b))
    }
  }
  const source = [
    ...normalizeAlumniRows.value,
    ...normalizedResponses.value,
  ]
  const list = source
    .filter((item) => filters.fakultas === 'all' || item.fakultas === filters.fakultas)
    .map((item) => item.prodi)
    .filter(Boolean)
  return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b))
})

watch(
  () => filters.fakultas,
  () => {
    if (filters.prodi === 'all') return
    if (!prodiOptions.value.includes(filters.prodi)) {
      filters.prodi = 'all'
    }
  },
)

const activeTsLabels = computed(() =>
  TS_LABEL_ORDER.filter((label) => filters.tsLabels.includes(label)),
)

const currentScope = computed(() => ({
  accreditationYear: normalizeYear(filters.accreditationYear) || new Date().getFullYear(),
  fakultas: filters.fakultas,
  prodi: filters.prodi,
  tsLabels: [...activeTsLabels.value],
}))

const scopeKey = computed(() => {
  const scope = currentScope.value
  return [
    scope.accreditationYear,
    scope.fakultas,
    scope.prodi,
    [...scope.tsLabels].sort((a, b) => TS_LABEL_ORDER.indexOf(a) - TS_LABEL_ORDER.indexOf(b)).join('|'),
  ].join('::')
})

const matchFilters = (item) => {
  if (!item) return false
  if (filters.fakultas !== 'all' && item.fakultas !== filters.fakultas) return false
  if (filters.prodi !== 'all' && item.prodi !== filters.prodi) return false
  if (!filters.tsLabels.includes(item.tsLabel)) return false
  return true
}

const filteredAlumniRows = computed(() =>
  normalizeAlumniRows.value.filter((item) => matchFilters(item)),
)

const filteredResponses = computed(() =>
  normalizedResponses.value.filter((item) => matchFilters(item)),
)

const respondentsByTs = computed(() => {
  const setByTs = new Map()
  activeTsLabels.value.forEach((label) => setByTs.set(label, new Set()))
  filteredResponses.value.forEach((item) => {
    if (!item.matchedAlumni || !item.nim || !setByTs.has(item.tsLabel)) return
    setByTs.get(item.tsLabel).add(item.nim)
  })
  return setByTs
})

const localSummary = computed(() => {
  const totalAlumni = filteredAlumniRows.value.length
  const respondentSet = new Set()
  respondentsByTs.value.forEach((nimSet) => {
    nimSet.forEach((nim) => respondentSet.add(nim))
  })
  const totalRespondents = respondentSet.size
  const unmatchedResponses = filteredResponses.value.filter((item) => !item.matchedAlumni).length
  const responseRate = totalAlumni > 0 ? ((totalRespondents / totalAlumni) * 100).toFixed(2) : '0.00'
  return {
    totalAlumni,
    totalRespondents,
    responseRate,
    rawResponses: filteredResponses.value.length,
    unmatchedResponses,
  }
})

const summary = computed(() => {
  if (usingSummaryEndpoint.value && summaryPayload.value?.summary) {
    return summaryPayload.value.summary
  }
  return localSummary.value
})

const localCohortRows = computed(() => {
  return activeTsLabels.value.map((tsLabel) => {
    const totalAlumni = filteredAlumniRows.value.filter((item) => item.tsLabel === tsLabel).length
    const respondents = respondentsByTs.value.get(tsLabel)?.size || 0
    const responseRate = totalAlumni > 0 ? ((respondents / totalAlumni) * 100).toFixed(2) : '0.00'
    return {
      tsLabel,
      totalAlumni,
      respondents,
      responseRate,
    }
  })
})

const cohortRows = computed(() => {
  if (usingSummaryEndpoint.value && Array.isArray(summaryPayload.value?.cohortRows)) {
    return summaryPayload.value.cohortRows
  }
  return localCohortRows.value
})

const activeFreeze = computed(() =>
  frozenSnapshots.value.find((item) => item.scopeKey === scopeKey.value) || null,
)

const displaySummary = computed(() =>
  useFrozenSnapshot.value && activeFreeze.value?.snapshot?.summary
    ? activeFreeze.value.snapshot.summary
    : summary.value,
)

const displayCohortRows = computed(() =>
  useFrozenSnapshot.value && Array.isArray(activeFreeze.value?.snapshot?.cohortRows)
    ? activeFreeze.value.snapshot.cohortRows
    : cohortRows.value,
)

const displayUpdatedAt = computed(() => {
  if (useFrozenSnapshot.value && activeFreeze.value?.createdAt) return activeFreeze.value.createdAt
  return lastUpdatedAt.value
})

const sortedAuditLogs = computed(() =>
  [...auditLogs.value]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 8),
)

const tsDescriptions = computed(() => {
  const year = normalizeYear(filters.accreditationYear)
  return TS_LABEL_ORDER.map((label) => {
    const offset = label === 'TS' ? 0 : Number(label.replace('TS-', '')) || 0
    return {
      label,
      year: year ? year - offset : '-',
    }
  })
})

const resolveTsYear = (label) => {
  const year = normalizeYear(filters.accreditationYear)
  if (!year) return ''
  const offset = label === 'TS' ? 0 : Number(label.replace('TS-', '')) || 0
  return year - offset
}

const selectedTsLabel = ref('')
const detailTab = ref('already')
const detailPageSize = ref(20)
const detailCurrentPage = ref(1)

const createEmptyDetailBucket = () => ({
  already: [],
  pending: [],
  unmatched: [],
})

const buildDetailByTs = (alumniRows = [], responses = [], tsLabels = []) => {
  const detail = {}
  const eligibleByTs = {}
  const filledByTs = {}
  const validLabels = Array.isArray(tsLabels) ? tsLabels : []

  validLabels.forEach((label) => {
    detail[label] = createEmptyDetailBucket()
    eligibleByTs[label] = new Map()
    filledByTs[label] = new Map()
  })

  alumniRows.forEach((row) => {
    if (!row?.tsLabel || !eligibleByTs[row.tsLabel] || !row.nim) return
    eligibleByTs[row.tsLabel].set(row.nim, row)
  })

  responses.forEach((row) => {
    const label = row?.tsLabel
    if (!label || !detail[label]) return
    if (!row?.matchedAlumni || !row?.nim) {
      detail[label].unmatched.push({
        id: row?.id || `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        nim: row?.nim || '-',
        nama: '-',
        fakultas: row?.fakultas || '-',
        prodi: row?.prodi || '-',
        tahunLulus: row?.tahunLulus || resolveTsYear(label),
        status: row?.status || '-',
        lastSubmittedAt: row?.createdAt || null,
        attemptCount: 1,
      })
      return
    }

    const eligible = eligibleByTs[label]?.get(row.nim)
    if (!eligible) return
    const existing = filledByTs[label].get(row.nim)
    if (!existing) {
      filledByTs[label].set(row.nim, {
        nim: row.nim,
        nama: eligible.nama || '-',
        fakultas: eligible.fakultas || '-',
        prodi: eligible.prodi || '-',
        tahunLulus: eligible.tahunLulus || resolveTsYear(label),
        status: row.status || '-',
        lastSubmittedAt: row.createdAt || null,
        attemptCount: 1,
      })
      return
    }

    existing.attemptCount += 1
    if (row.status && row.status !== '-') existing.status = row.status
    if (row.createdAt && (!existing.lastSubmittedAt || new Date(row.createdAt) > new Date(existing.lastSubmittedAt))) {
      existing.lastSubmittedAt = row.createdAt
    }
  })

  validLabels.forEach((label) => {
    const filledMap = filledByTs[label]
    const filledNims = new Set(filledMap.keys())

    detail[label].already = Array.from(filledMap.values()).sort((a, b) => {
      const aDate = a.lastSubmittedAt ? new Date(a.lastSubmittedAt).getTime() : 0
      const bDate = b.lastSubmittedAt ? new Date(b.lastSubmittedAt).getTime() : 0
      if (aDate !== bDate) return bDate - aDate
      return String(a.nama).localeCompare(String(b.nama))
    })

    detail[label].pending = Array.from(eligibleByTs[label].values())
      .filter((row) => !filledNims.has(row.nim))
      .map((row) => ({
        nim: row.nim,
        nama: row.nama || '-',
        fakultas: row.fakultas || '-',
        prodi: row.prodi || '-',
        tahunLulus: row.tahunLulus || resolveTsYear(label),
        status: 'Belum mengisi',
        lastSubmittedAt: null,
        attemptCount: 0,
      }))
      .sort((a, b) => String(a.nama).localeCompare(String(b.nama)))

    detail[label].unmatched = detail[label].unmatched.sort((a, b) => {
      const aDate = a.lastSubmittedAt ? new Date(a.lastSubmittedAt).getTime() : 0
      const bDate = b.lastSubmittedAt ? new Date(b.lastSubmittedAt).getTime() : 0
      return bDate - aDate
    })
  })

  return detail
}

const selectedDetailBucket = computed(() => {
  const label = selectedTsLabel.value
  if (!label) return createEmptyDetailBucket()
  if (useFrozenSnapshot.value && activeFreeze.value?.snapshot?.detailByTs) {
    return activeFreeze.value.snapshot.detailByTs[label] || createEmptyDetailBucket()
  }
  if (usingSummaryEndpoint.value && summaryPayload.value?.detailByTs) {
    return summaryPayload.value.detailByTs[label] || createEmptyDetailBucket()
  }
  const live = buildDetailByTs(filteredAlumniRows.value, filteredResponses.value, [label])
  return live[label] || createEmptyDetailBucket()
})

const detailRows = computed(() => {
  const tab = detailTab.value
  return Array.isArray(selectedDetailBucket.value?.[tab]) ? selectedDetailBucket.value[tab] : []
})

const normalizedDetailPageSize = computed(() => {
  if (detailPageSize.value === 'all') return 'all'
  const parsed = Number(detailPageSize.value)
  if (!Number.isFinite(parsed) || parsed <= 0) return 20
  return parsed
})

const detailTotalPages = computed(() => {
  if (normalizedDetailPageSize.value === 'all') return 1
  return Math.max(1, Math.ceil(detailRows.value.length / normalizedDetailPageSize.value))
})

const detailRange = computed(() => {
  const total = detailRows.value.length
  if (!total) return { start: 0, end: 0, total: 0 }
  if (normalizedDetailPageSize.value === 'all') return { start: 1, end: total, total }
  const size = normalizedDetailPageSize.value
  const start = (detailCurrentPage.value - 1) * size + 1
  const end = Math.min(total, start + size - 1)
  return { start, end, total }
})

const paginatedDetailRows = computed(() => {
  if (normalizedDetailPageSize.value === 'all') return detailRows.value
  const size = normalizedDetailPageSize.value
  const start = (detailCurrentPage.value - 1) * size
  return detailRows.value.slice(start, start + size)
})

const detailTabCounts = computed(() => ({
  already: selectedDetailBucket.value.already.length,
  pending: selectedDetailBucket.value.pending.length,
  unmatched: selectedDetailBucket.value.unmatched.length,
}))

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

const openTsDetail = (label) => {
  if (!label) return
  selectedTsLabel.value = label
}

const goDetailPrev = () => {
  if (detailCurrentPage.value > 1) detailCurrentPage.value -= 1
}

const goDetailNext = () => {
  if (detailCurrentPage.value < detailTotalPages.value) detailCurrentPage.value += 1
}

const toResponseList = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  if (Array.isArray(payload)) return payload
  return []
}

const toMeta = (payload) => payload?.meta || payload?.data?.meta || {}

const readResponseCache = (questionnaireId) => {
  if (!questionnaireId) return null
  const cached = responseMemoryCache.get(String(questionnaireId))
  if (!cached?.savedAt || !Array.isArray(cached?.responses)) return null
  if (Date.now() - cached.savedAt > RESPONSE_CACHE_TTL_MS) return null
  return cached
}

const writeResponseCache = (questionnaireId, responses = []) => {
  if (!questionnaireId || !Array.isArray(responses)) return
  responseMemoryCache.set(String(questionnaireId), {
    savedAt: Date.now(),
    responses,
  })
}

const ensureAlumniLoaded = async ({ forceRefresh = false } = {}) => {
  if (!forceRefresh && Array.isArray(alumni.value.items) && alumni.value.items.length) {
    return alumni.value.items
  }
  const options = forceRefresh ? { forceRemote: true } : {}
  return fetchAlumni({}, options)
}

const buildSummaryQuery = () => {
  const scope = currentScope.value
  const query = {
    accreditation_year: scope.accreditationYear,
    ts_labels: scope.tsLabels.join(','),
  }
  if (scope.fakultas !== 'all') query.fakultas = scope.fakultas
  if (scope.prodi !== 'all') query.prodi = scope.prodi
  if (questionnaireMeta.value.id) query.questionnaire_id = questionnaireMeta.value.id
  return query
}

const evaluateNimCoverage = (responses = [], sampleSize = NIM_COVERAGE_SAMPLE_SIZE) => {
  if (!Array.isArray(responses) || !responses.length) return 1
  const sample = responses.slice(0, Math.max(1, Number(sampleSize) || NIM_COVERAGE_SAMPLE_SIZE))
  let total = 0
  let withNim = 0
  sample.forEach((item) => {
    total += 1
    const payload = extractSubmissionPayload(item, filters.accreditationYear)
    if (payload.nim) withNim += 1
  })
  return total > 0 ? withNim / total : 1
}

const hydrateFromLocalCache = () => {
  const persisted = readResponsePersistedCache()
  if (!persisted) return false
  if (persisted.summaryPayload && typeof persisted.summaryPayload === 'object') {
    summaryPayload.value = normalizeSummaryPayload(persisted.summaryPayload, currentScope.value)
    usingSummaryEndpoint.value = true
    rawResponses.value = []
  } else {
    summaryPayload.value = null
    usingSummaryEndpoint.value = false
    rawResponses.value = persisted.responses || []
  }
  if (persisted.questionnaire && typeof persisted.questionnaire === 'object') {
    questionnaireMeta.value = {
      id: persisted.questionnaire.id || null,
      title: persisted.questionnaire.title || '',
    }
  }
  lastUpdatedAt.value = new Date(Number(persisted.savedAt || Date.now())).toISOString()
  hasRemoteDataLoaded.value = true
  return true
}

const resolveQuestionnaire = async (requestConfig = {}) => {
  const active = await fetchActiveQuestionnaire('alumni', { silent: true, requestConfig })
  const activeId = active?.id || active?.data?.id || null
  if (activeId) {
    questionnaireMeta.value = {
      id: activeId,
      title: active?.title || active?.data?.title || 'Kuisioner alumni aktif',
    }
    return activeId
  }

  try {
    const resp = await tracerService.getQuestionnaires(
      { audience: 'alumni', active: true },
      requestConfig,
    )
    const list = toResponseList(resp)
    const first = list[0] || null
    questionnaireMeta.value = {
      id: first?.id || null,
      title: first?.title || 'Kuisioner alumni',
    }
    return first?.id || null
  } catch (err) {
    questionnaireMeta.value = { id: null, title: '' }
    return null
  }
}

const fetchAllResponses = async (
  questionnaireId,
  { includeAnswers = false, requestConfig = {}, includeAnswersAuto = false } = {},
) => {
  const requestPage = (page, includeAns = includeAnswers) =>
    tracerService.getResponses(
      questionnaireId,
      {
      page,
      per_page: RESPONSE_PAGE_SIZE,
      include_answers: includeAns ? 1 : 0,
      },
      requestConfig,
    )

  let includeAns = includeAnswers
  let firstResp = await requestPage(1, includeAns)
  let firstList = toResponseList(firstResp)

  if (includeAnswersAuto && !includeAns) {
    const firstCoverage = evaluateNimCoverage(firstList)
    if (firstCoverage < 0.6) {
      includeAns = true
      firstResp = await requestPage(1, includeAns)
      firstList = toResponseList(firstResp)
    }
  }

  const allItems = [...firstList]
  const firstMeta = toMeta(firstResp)
  const lastPageRaw = Number(firstMeta.last_page || firstMeta.lastPage || 1)
  const lastPage = Number.isFinite(lastPageRaw) && lastPageRaw > 1
    ? Math.min(lastPageRaw, MAX_RESPONSE_PAGE)
    : 1

  if (lastPage <= 1 || !firstList.length) return allItems

  const remainingPages = []
  for (let page = 2; page <= lastPage; page += 1) {
    remainingPages.push(page)
  }

  const batchSize = Math.max(1, RESPONSE_FETCH_BATCH_SIZE)
  for (let idx = 0; idx < remainingPages.length; idx += batchSize) {
    const batch = remainingPages.slice(idx, idx + batchSize)
    const responses = await Promise.all(
      batch.map(async (page) => {
        const resp = await requestPage(page, includeAns)
        return { page, list: toResponseList(resp) }
      }),
    )
    responses
      .sort((a, b) => a.page - b.page)
      .forEach((item) => {
        if (item.list.length) allItems.push(...item.list)
      })
  }
  return allItems
}

const abortActiveLoad = () => {
  if (activeLoadController.value) {
    activeLoadController.value.abort()
  }
  activeLoadController.value = null
}

const reloadData = async ({ forceRefresh = false } = {}) => {
  abortActiveLoad()
  const controller = new AbortController()
  activeLoadController.value = controller
  activeLoadSequence.value += 1
  const loadSeq = activeLoadSequence.value
  const isStale = () =>
    controller.signal.aborted ||
    activeLoadSequence.value !== loadSeq ||
    activeLoadController.value !== controller
  loading.value = true
  error.value = ''
  try {
    if (!import.meta.env.VITE_API_BASE_URL) {
      isLocalDataMode.value = true
      usingSummaryEndpoint.value = false
      summaryPayload.value = null
      await ensureAlumniLoaded({ forceRefresh: false })
      if (isStale()) return
      rawResponses.value = (submissions.items || []).filter(
        (item) => String(item.type || '').toLowerCase() === 'alumni',
      )
      hasRemoteDataLoaded.value = false
      lastUpdatedAt.value = new Date().toISOString()
      appendAuditLog('refresh', `Muat ulang data lokal (${rawResponses.value.length} jawaban)`)
      return
    }

    isLocalDataMode.value = false
    const requestConfig = {
      signal: controller.signal,
      timeout: RESPONSE_FETCH_TIMEOUT_MS,
    }

    try {
      const summaryResp = await tracerService.getTracerAccreditationSummary(
        buildSummaryQuery(),
        requestConfig,
      )
      if (isStale()) return
      const normalizedSummary = normalizeSummaryPayload(summaryResp, currentScope.value)
      if (!isSummaryEndpointReady(normalizedSummary)) {
        throw new Error('Payload endpoint ringkasan belum valid')
      }
      usingSummaryEndpoint.value = true
      summaryPayload.value = normalizedSummary
      rawResponses.value = []
      questionnaireMeta.value = {
        id: normalizedSummary.source.questionnaireId || null,
        title: normalizedSummary.source.questionnaireTitle || questionnaireMeta.value.title || 'Kuisioner alumni',
      }
      hasRemoteDataLoaded.value = true
      lastUpdatedAt.value = normalizedSummary.source.generatedAt || new Date().toISOString()
      writeResponsePersistedCache({
        responses: [],
        summaryPayload: normalizedSummary,
        questionnaire: questionnaireMeta.value,
        savedAt: Date.now(),
      })
      appendAuditLog(
        'refresh',
        `Muat ulang via endpoint ringkasan (${normalizedSummary.summary.rawResponses} jawaban raw)`,
      )
      return
    } catch (summaryErr) {
      if (isCanceledError(summaryErr)) return
      usingSummaryEndpoint.value = false
      summaryPayload.value = null
    }

    const alumniPromise = ensureAlumniLoaded({ forceRefresh: false })
    const questionnaireId = await resolveQuestionnaire({
      ...requestConfig,
    })
    await alumniPromise
    if (isStale()) return
    if (!questionnaireId) {
      rawResponses.value = []
      hasRemoteDataLoaded.value = true
      lastUpdatedAt.value = new Date().toISOString()
      appendAuditLog('refresh', 'Muat ulang data: kuisioner alumni aktif tidak ditemukan')
      return
    }

    if (!forceRefresh) {
      const cached = readResponseCache(questionnaireId)
      if (cached) {
        if (isStale()) return
        await alumniPromise
        if (isStale()) return
        rawResponses.value = cached.responses
        hasRemoteDataLoaded.value = true
        lastUpdatedAt.value = new Date(cached.savedAt).toISOString()
        appendAuditLog('refresh', `Muat ulang data dari cache (${rawResponses.value.length} jawaban)`)
        return
      }
    }

    const responsesPromise = fetchAllResponses(questionnaireId, {
      includeAnswers: false,
      includeAnswersAuto: true,
      requestConfig: {
        ...requestConfig,
      },
    })
    const [responses] = await Promise.all([responsesPromise, alumniPromise])
    if (isStale()) return

    rawResponses.value = responses
    hasRemoteDataLoaded.value = true
    writeResponseCache(questionnaireId, responses)
    writeResponsePersistedCache({
      responses,
      summaryPayload: null,
      questionnaire: questionnaireMeta.value,
      savedAt: Date.now(),
    })
    lastUpdatedAt.value = new Date().toISOString()
    appendAuditLog('refresh', `Muat ulang data berhasil (${rawResponses.value.length} jawaban)`)
  } catch (err) {
    if (isCanceledError(err)) return
    error.value = err?.message || 'Gagal memuat data akreditasi tracer.'
    appendAuditLog('error', error.value)
  } finally {
    if (!isStale()) {
      loading.value = false
      activeLoadController.value = null
    }
  }
}

const appendAuditLog = (action, detail) => {
  const actor = auth.user.value?.fullName || auth.user.value?.name || auth.user.value?.email || 'Admin'
  const next = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      action,
      detail,
      actor,
      createdAt: new Date().toISOString(),
    },
    ...auditLogs.value,
  ].slice(0, MAX_AUDIT_LOG)
  auditLogs.value = next
  saveStorageArray(AUDIT_STORAGE_KEY, next)
}

const lockCurrentScope = () => {
  if (!activeTsLabels.value.length) return
  const liveDetailByTs = usingSummaryEndpoint.value
    ? clonePlain(summaryPayload.value?.detailByTs, {})
    : clonePlain(buildDetailByTs(filteredAlumniRows.value, filteredResponses.value, activeTsLabels.value), {})
  const snapshot = {
    scope: currentScope.value,
    summary: summary.value,
    cohortRows: cohortRows.value,
    detailByTs: liveDetailByTs || {},
    source: {
      questionnaireId: questionnaireMeta.value.id || null,
      questionnaireTitle: questionnaireMeta.value.title || '',
      generatedAt: new Date().toISOString(),
      responseCount: usingSummaryEndpoint.value
        ? summary.value.rawResponses
        : filteredResponses.value.length,
    },
  }
  const payload = {
    id: activeFreeze.value?.id || `${scopeKey.value}-${Date.now()}`,
    scopeKey: scopeKey.value,
    createdAt: new Date().toISOString(),
    createdBy: auth.user.value?.fullName || auth.user.value?.name || auth.user.value?.email || 'Admin',
    snapshot,
  }
  const remaining = frozenSnapshots.value.filter((item) => item.scopeKey !== scopeKey.value)
  const next = [payload, ...remaining]
  frozenSnapshots.value = next
  saveStorageArray(FREEZE_STORAGE_KEY, next)
  useFrozenSnapshot.value = true
  appendAuditLog(
    'freeze',
    `Kunci periode ${currentScope.value.accreditationYear} (${currentScope.value.tsLabels.join(', ') || '-'})`,
  )
}

const unlockCurrentScope = () => {
  if (!activeFreeze.value) return
  const next = frozenSnapshots.value.filter((item) => item.scopeKey !== scopeKey.value)
  frozenSnapshots.value = next
  saveStorageArray(FREEZE_STORAGE_KEY, next)
  appendAuditLog(
    'unfreeze',
    `Buka kunci periode ${currentScope.value.accreditationYear} (${currentScope.value.tsLabels.join(', ') || '-'})`,
  )
}

const triggerTextDownload = (filename, content, mimeType) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const exportReport = (format = 'xlsx') => {
  const generatedAt = new Date().toISOString()
  const scope = currentScope.value
  const sourceMode = useFrozenSnapshot.value && activeFreeze.value ? 'snapshot_terkunci' : 'live_data'
  const summaryRows = [
    ['Tahun Akreditasi', scope.accreditationYear],
    ['Fakultas', scope.fakultas === 'all' ? 'Semua fakultas' : scope.fakultas],
    ['Prodi', scope.prodi === 'all' ? 'Semua prodi' : scope.prodi],
    ['TS dihitung', scope.tsLabels.join(', ')],
    ['Mode sumber', sourceMode],
    ['Total alumni eligible', displaySummary.value.totalAlumni],
    ['Total responden valid', displaySummary.value.totalRespondents],
    ['Response rate (%)', Number(displaySummary.value.responseRate || 0)],
    ['Total jawaban raw', displaySummary.value.rawResponses],
    ['Jawaban tanpa match alumni', displaySummary.value.unmatchedResponses],
    ['Waktu generate', new Date(generatedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })],
  ]

  const cohortRowsExport = [
    ['Label TS', 'Tahun Lulus', 'Total Alumni', 'Responden', 'Response Rate (%)'],
    ...displayCohortRows.value.map((row) => [
      row.tsLabel,
      resolveTsYear(row.tsLabel),
      row.totalAlumni,
      row.respondents,
      Number(row.responseRate || 0),
    ]),
  ]

  const workbook = XLSX.utils.book_new()
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows)
  const cohortSheet = XLSX.utils.aoa_to_sheet(cohortRowsExport)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan')
  XLSX.utils.book_append_sheet(workbook, cohortSheet, 'Cohort TS')

  const dateCode = new Date().toISOString().slice(0, 10)
  const baseName = `laporan-akreditasi-ts-${scope.accreditationYear}-${dateCode}`

  if (format === 'csv') {
    const combinedAoA = [
      ...summaryRows,
      [],
      ...cohortRowsExport,
    ]
    const csvSheet = XLSX.utils.aoa_to_sheet(combinedAoA)
    const csv = XLSX.utils.sheet_to_csv(csvSheet)
    triggerTextDownload(`${baseName}.csv`, csv, 'text/csv;charset=utf-8;')
  } else {
    XLSX.writeFile(workbook, `${baseName}.xlsx`)
  }

  appendAuditLog(
    'export',
    `Export laporan ${format.toUpperCase()} (${sourceMode}) untuk tahun ${scope.accreditationYear}`,
  )
}

const toggleTs = (label) => {
  if (filters.tsLabels.includes(label)) {
    if (filters.tsLabels.length === 1) return
    filters.tsLabels = filters.tsLabels.filter((item) => item !== label)
    return
  }
  filters.tsLabels = [...filters.tsLabels, label]
}

watch(
  displayCohortRows,
  (rows) => {
    if (!Array.isArray(rows) || !rows.length) {
      selectedTsLabel.value = ''
      return
    }
    if (!rows.some((row) => row.tsLabel === selectedTsLabel.value)) {
      selectedTsLabel.value = rows[0].tsLabel
    }
  },
  { immediate: true },
)

watch(
  [detailTab, selectedTsLabel, detailPageSize, () => detailRows.value.length],
  () => {
    detailCurrentPage.value = 1
  },
)

watch(
  [detailCurrentPage, detailTotalPages],
  () => {
    if (detailCurrentPage.value < 1) detailCurrentPage.value = 1
    if (detailCurrentPage.value > detailTotalPages.value) detailCurrentPage.value = detailTotalPages.value
  },
)

onMounted(() => {
  if (!import.meta.env.VITE_API_BASE_URL) {
    reloadData()
    return
  }
  const hydrated = hydrateFromLocalCache()
  if (hydrated) {
    const cachedCount = usingSummaryEndpoint.value
      ? summaryPayload.value?.summary?.rawResponses || 0
      : rawResponses.value.length
    appendAuditLog('refresh', `Memuat data dari cache lokal (${cachedCount} jawaban)`)
  }
})

onBeforeUnmount(() => {
  abortActiveLoad()
})
</script>

<template>
  <AdminShell>
    <section class="space-y-5 px-4 md:px-6 xl:px-8">
      <header class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Akreditasi tracer</p>
        <h1 class="mt-1 text-2xl font-semibold text-slate-900">Laporan Akreditasi Alumni (TS)</h1>
        <p class="mt-2 text-sm text-slate-600">
          Ringkasan pelaporan tracer berbasis cohort TS untuk evaluasi akreditasi prodi/fakultas.
        </p>
      </header>

      <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="grid gap-4 md:grid-cols-4">
          <label class="space-y-1">
            <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tahun akreditasi</span>
            <input
              v-model.number="filters.accreditationYear"
              type="number"
              min="2000"
              max="2100"
              class="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700"
            />
          </label>
          <label class="space-y-1">
            <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Fakultas</span>
            <select v-model="filters.fakultas" class="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700">
              <option value="all">Semua fakultas</option>
              <option v-for="fak in fakultasOptions" :key="fak" :value="fak">{{ fak }}</option>
            </select>
          </label>
          <label class="space-y-1">
            <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Prodi</span>
            <select v-model="filters.prodi" class="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700">
              <option value="all">Semua prodi</option>
              <option v-for="prodi in prodiOptions" :key="prodi" :value="prodi">{{ prodi }}</option>
            </select>
          </label>
          <div class="space-y-1">
            <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Aksi</span>
            <div class="grid grid-cols-3 gap-2">
              <button
                type="button"
                class="h-11 rounded-xl bg-slate-900 px-2 text-xs font-semibold text-white transition hover:bg-slate-700"
                @click="reloadData({ forceRefresh: true })"
              >
                Muat ulang
              </button>
              <button
                type="button"
                class="h-11 rounded-xl bg-emerald-600 px-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
                :disabled="!activeTsLabels.length"
                @click="lockCurrentScope"
              >
                Kunci periode
              </button>
              <button
                type="button"
                class="h-11 rounded-xl border border-rose-300 bg-rose-50 px-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                :disabled="!activeFreeze"
                @click="unlockCurrentScope"
              >
                Buka kunci
              </button>
            </div>
          </div>
        </div>

        <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Periode TS yang dihitung</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <button
              v-for="ts in TS_LABEL_ORDER"
              :key="ts"
              type="button"
              class="rounded-full border px-3 py-1 text-xs font-semibold transition"
              :class="filters.tsLabels.includes(ts) ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'"
              @click="toggleTs(ts)"
            >
              {{ ts }}
            </button>
          </div>
          <div class="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
            <span v-for="item in tsDescriptions" :key="item.label" class="rounded-full bg-white px-2 py-1 border border-slate-200">
              {{ item.label }} = {{ item.year }}
            </span>
          </div>
        </div>

        <div class="mt-4 rounded-xl border p-3 text-xs" :class="activeFreeze ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-600'">
          <p class="font-semibold uppercase tracking-[0.2em]">
            {{ activeFreeze ? 'Periode terkunci' : 'Periode belum terkunci' }}
          </p>
          <p class="mt-1">
            <template v-if="activeFreeze">
              Snapshot dikunci oleh {{ activeFreeze.createdBy || 'Admin' }}
              pada {{ new Date(activeFreeze.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) }}.
            </template>
            <template v-else>
              Gunakan tombol <span class="font-semibold">Kunci periode</span> agar angka pelaporan tetap konsisten saat proses akreditasi.
            </template>
          </p>
          <label v-if="activeFreeze" class="mt-2 inline-flex items-center gap-2 text-[11px] font-semibold">
            <input v-model="useFrozenSnapshot" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
            Gunakan snapshot periode terkunci
          </label>
        </div>
      </section>

      <section v-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {{ error }}
      </section>

      <section
        v-if="!loading && !error && !isLocalDataMode && !hasRemoteDataLoaded"
        class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
      >
        Data belum dimuat dari server. Klik tombol <span class="font-semibold">Muat ulang</span> untuk mengambil data terbaru.
      </section>

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Alumni eligible</p>
          <p class="mt-2 text-2xl font-semibold text-slate-900">{{ displaySummary.totalAlumni }}</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Responden valid</p>
          <p class="mt-2 text-2xl font-semibold text-slate-900">{{ displaySummary.totalRespondents }}</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Response rate</p>
          <p class="mt-2 text-2xl font-semibold text-emerald-600">{{ displaySummary.responseRate }}%</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Total jawaban (raw)</p>
          <p class="mt-2 text-2xl font-semibold text-slate-900">{{ displaySummary.rawResponses }}</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Jawaban tanpa match alumni</p>
          <p class="mt-2 text-2xl font-semibold text-amber-600">{{ displaySummary.unmatchedResponses }}</p>
        </article>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">Cohort TS</h2>
            <p class="text-xs text-slate-500">Denominator alumni diambil dari master alumni, responden dihitung unik per NIM.</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
              @click="exportReport('csv')"
            >
              Export CSV
            </button>
            <button
              type="button"
              class="rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-slate-700"
              @click="exportReport('xlsx')"
            >
              Export Excel
            </button>
            <p class="text-[11px] text-slate-500">
              Terakhir diperbarui:
              {{ displayUpdatedAt ? new Date(displayUpdatedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-' }}
            </p>
          </div>
        </div>

        <div class="mt-4 overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
              <tr>
                <th class="px-4 py-3">Label TS</th>
                <th class="px-4 py-3">Tahun lulus</th>
                <th class="px-4 py-3">Total alumni</th>
                <th class="px-4 py-3">Responden</th>
                <th class="px-4 py-3">Response rate</th>
                <th class="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="row in displayCohortRows" :key="row.tsLabel">
                <td class="px-4 py-3 font-semibold text-slate-900">{{ row.tsLabel }}</td>
                <td class="px-4 py-3 text-slate-600">
                  {{ resolveTsYear(row.tsLabel) }}
                </td>
                <td class="px-4 py-3 text-slate-700">{{ row.totalAlumni }}</td>
                <td class="px-4 py-3 text-slate-700">{{ row.respondents }}</td>
                <td class="px-4 py-3 font-semibold text-emerald-700">{{ row.responseRate }}%</td>
                <td class="px-4 py-3">
                  <button
                    type="button"
                    class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
                    :class="selectedTsLabel === row.tsLabel ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'"
                    @click="openTsDetail(row.tsLabel)"
                  >
                    Lihat detail
                  </button>
                </td>
              </tr>
              <tr v-if="!displayCohortRows.length">
                <td colspan="6" class="px-4 py-8 text-center text-sm text-slate-500">
                  Tidak ada periode TS yang dipilih.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="selectedTsLabel" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">Detail Alumni {{ selectedTsLabel }}</h2>
            <p class="text-xs text-slate-500">
              Tahun lulus cohort: {{ resolveTsYear(selectedTsLabel) }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-full border px-3 py-1 text-xs font-semibold transition"
              :class="detailTab === 'already' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'"
              @click="detailTab = 'already'"
            >
              Sudah isi ({{ detailTabCounts.already }})
            </button>
            <button
              type="button"
              class="rounded-full border px-3 py-1 text-xs font-semibold transition"
              :class="detailTab === 'pending' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'"
              @click="detailTab = 'pending'"
            >
              Belum isi ({{ detailTabCounts.pending }})
            </button>
            <button
              type="button"
              class="rounded-full border px-3 py-1 text-xs font-semibold transition"
              :class="detailTab === 'unmatched' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'"
              @click="detailTab = 'unmatched'"
            >
              Tanpa match ({{ detailTabCounts.unmatched }})
            </button>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-slate-700">Tampilkan</span>
            <select
              v-model="detailPageSize"
              class="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
            >
              <option v-for="size in DETAIL_PAGE_SIZE_OPTIONS" :key="String(size)" :value="size">
                {{ size === 'all' ? 'Semua data' : `${size} data` }}
              </option>
            </select>
          </div>
          <p>
            Menampilkan {{ detailRange.start }}-{{ detailRange.end }} dari {{ detailRange.total }} data
          </p>
        </div>

        <div class="mt-4 overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
              <tr>
                <th class="px-4 py-3">NIM</th>
                <th class="px-4 py-3">Nama</th>
                <th class="px-4 py-3">Fakultas</th>
                <th class="px-4 py-3">Prodi</th>
                <th class="px-4 py-3">Tahun</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">Jumlah isi</th>
                <th class="px-4 py-3">Terakhir isi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="row in paginatedDetailRows" :key="`${detailTab}-${row.nim}-${row.id || row.lastSubmittedAt || row.nama}`">
                <td class="px-4 py-3 font-mono text-xs text-slate-700">{{ row.nim || '-' }}</td>
                <td class="px-4 py-3 text-slate-800">{{ row.nama || '-' }}</td>
                <td class="px-4 py-3 text-slate-700">{{ row.fakultas || '-' }}</td>
                <td class="px-4 py-3 text-slate-700">{{ row.prodi || '-' }}</td>
                <td class="px-4 py-3 text-slate-700">{{ row.tahunLulus || '-' }}</td>
                <td class="px-4 py-3 text-slate-700">{{ row.status || '-' }}</td>
                <td class="px-4 py-3 text-slate-700">{{ row.attemptCount ?? 0 }}</td>
                <td class="px-4 py-3 text-slate-700">{{ formatDateTime(row.lastSubmittedAt) }}</td>
              </tr>
              <tr v-if="!detailRows.length">
                <td colspan="8" class="px-4 py-8 text-center text-sm text-slate-500">
                  Tidak ada data pada tab ini.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="detailRows.length && detailPageSize !== 'all'"
          class="mt-3 flex items-center justify-end gap-2 text-xs"
        >
          <button
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="detailCurrentPage <= 1"
            @click="goDetailPrev"
          >
            Sebelumnya
          </button>
          <span class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-600">
            Halaman {{ detailCurrentPage }} / {{ detailTotalPages }}
          </span>
          <button
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="detailCurrentPage >= detailTotalPages"
            @click="goDetailNext"
          >
            Berikutnya
          </button>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        <p class="font-semibold uppercase tracking-[0.15em] text-slate-500">Catatan metodologi</p>
        <ul class="mt-2 list-disc space-y-1 pl-5">
          <li>Perhitungan response rate menggunakan alumni eligible dari master alumni sesuai filter.</li>
          <li>Responden valid dihitung unik per NIM (bukan jumlah attempt/pengisian).</li>
          <li>Data jawaban tanpa pasangan NIM alumni tetap ditampilkan sebagai indikator kualitas data.</li>
          <li v-if="usingSummaryEndpoint">Sumber utama data saat ini memakai endpoint ringkasan backend untuk mempercepat proses muat.</li>
          <li v-if="isLocalDataMode">Mode saat ini memakai data lokal browser karena API backend belum terkonfigurasi.</li>
          <li v-else>Data kuisioner sumber: {{ questionnaireMeta.title || '-' }} (ID: {{ questionnaireMeta.id || '-' }}).</li>
        </ul>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Log aktivitas periode</h2>
        <div class="mt-3 space-y-2">
          <article
            v-for="log in sortedAuditLogs"
            :key="log.id"
            class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
          >
            <p class="font-semibold text-slate-700">{{ log.action }}</p>
            <p class="mt-1">{{ log.detail }}</p>
            <p class="mt-1 text-[11px] text-slate-500">
              {{ log.actor }} •
              {{ new Date(log.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) }}
            </p>
          </article>
          <p v-if="!sortedAuditLogs.length" class="text-xs text-slate-500">
            Belum ada log aktivitas.
          </p>
        </div>
      </section>
    </section>
  </AdminShell>
  <LoadingOverlay :active="loading" />
</template>
