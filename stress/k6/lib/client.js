import http from 'k6/http'
import { fail } from 'k6'
import {
  API_BASE,
  REQUEST_TIMEOUT,
  DEFAULT_HEADERS,
  ACCREDITATION_YEAR,
  TS_LABELS,
  FAKULTAS_LIST,
  PRODI_LIST,
  RESPONSES_PAGE_MAX,
  RESPONSES_PER_PAGE,
  SUMMARY_ENDPOINT_PATH,
  LOGIN_ENDPOINT_PATH,
  pickRandom,
} from './config.js'

const toObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {}

const toQueryString = (query = {}) =>
  Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')

export const parseJson = (response) => {
  try {
    return response.json()
  } catch (err) {
    return null
  }
}

export const buildAuthHeaders = (token, extraHeaders = {}) => {
  const headers = {
    ...DEFAULT_HEADERS,
    ...extraHeaders,
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

const requestParams = (token, extra = {}) => ({
  timeout: REQUEST_TIMEOUT,
  headers: buildAuthHeaders(token, extra.headers || {}),
  tags: extra.tags || {},
})

export const resolveToken = () => {
  if (__ENV.TOKEN) return String(__ENV.TOKEN)
  const email = __ENV.LOGIN_EMAIL
  const password = __ENV.LOGIN_PASSWORD
  if (!email || !password) {
    fail('TOKEN atau kombinasi LOGIN_EMAIL + LOGIN_PASSWORD wajib diisi')
  }
  const payload = JSON.stringify({ email, password })
  const response = http.post(`${API_BASE}${LOGIN_ENDPOINT_PATH}`, payload, requestParams(null, { tags: { endpoint: 'auth_login' } }))
  const body = parseJson(response)
  const token =
    body?.data?.token ||
    body?.token ||
    body?.access_token ||
    body?.data?.access_token ||
    ''
  if (!token) {
    fail(`Gagal mengambil token dari ${LOGIN_ENDPOINT_PATH} (status ${response.status})`)
  }
  return String(token)
}

export const resolveQuestionnaireId = (token) => {
  if (__ENV.QID) return Number(__ENV.QID)
  const response = http.get(
    `${API_BASE}/questionnaires/active?audience=alumni`,
    requestParams(token, { tags: { endpoint: 'active_questionnaire' } }),
  )
  if (response.status !== 200) return null
  const body = parseJson(response)
  const id = Number(body?.data?.id ?? body?.id ?? body?.data?.data?.id)
  return Number.isFinite(id) && id > 0 ? id : null
}

export const getAccreditationSummary = (token) => {
  const query = {}
  if (SUMMARY_ENDPOINT_PATH.includes('accreditation-summary')) {
    query.accreditation_year = ACCREDITATION_YEAR
    query.ts_labels = TS_LABELS.join(',')
  }

  const selectedFakultas = pickRandom(FAKULTAS_LIST)
  if (selectedFakultas && Math.random() < 0.6 && SUMMARY_ENDPOINT_PATH.includes('accreditation-summary')) {
    query.fakultas = selectedFakultas
    const selectedProdi = pickRandom(PRODI_LIST)
    if (selectedProdi && Math.random() < 0.5) {
      query.prodi = selectedProdi
    }
  }

  const queryString = toQueryString(query)
  const url = `${API_BASE}${SUMMARY_ENDPOINT_PATH}${queryString ? `?${queryString}` : ''}`
  return http.get(url, requestParams(token, { tags: { endpoint: 'accreditation_summary' } }))
}

export const getQuestionnaireResponses = (token, questionnaireId) => {
  const qid = Number(questionnaireId)
  if (!Number.isFinite(qid) || qid <= 0) return null
  const page = 1 + Math.floor(Math.random() * RESPONSES_PAGE_MAX)
  const queryString = toQueryString({
    page,
    per_page: RESPONSES_PER_PAGE,
  })
  const url = `${API_BASE}/questionnaires/${qid}/responses?${queryString}`
  return http.get(url, requestParams(token, { tags: { endpoint: 'questionnaire_responses' } }))
}

export const triggerResponsesExport = (token, questionnaireId, format = 'xlsx') => {
  const qid = Number(questionnaireId)
  if (!Number.isFinite(qid) || qid <= 0) return null
  const payload = JSON.stringify({
    questionnaire_id: qid,
    format,
    include_answers: 1,
  })
  return http.post(
    `${API_BASE}/exports/responses`,
    payload,
    requestParams(token, { tags: { endpoint: 'responses_export' } }),
  )
}

export const hasSummaryData = (response) => {
  const body = toObject(parseJson(response))
  const data = toObject(body.data)
  const summary = toObject(data.summary)
  if (Object.keys(summary).length > 0) return true
  if (typeof body.totalRespondents === 'number') return true
  if (typeof data.totalRespondents === 'number') return true
  return false
}
