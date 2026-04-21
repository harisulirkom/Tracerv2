import { get, post, put, del } from './api'

// Base dari env: import.meta.env.VITE_API_BASE_URL
export const getQuestionnaires = (params = {}, requestConfig = {}) =>
  get('/questionnaires', { params, ...requestConfig })

export const getQuestionnaireById = (id) => get(`/questionnaires/${id}`)

export const createQuestionnaire = (payload) => post('/questionnaires', payload)

export const updateQuestionnaire = (id, payload) => put(`/questionnaires/${id}`, payload)

export const deleteQuestionnaire = (id) => del(`/questionnaires/${id}`)

export const getQuestions = (questionnaireId, requestConfig = {}) =>
  get(`/questionnaires/${questionnaireId}/questions`, requestConfig)

export const createQuestion = (questionnaireId, payload) =>
  post(`/questionnaires/${questionnaireId}/questions`, payload)

export const updateQuestion = (questionnaireId, questionId, payload) =>
  put(`/questionnaires/${questionnaireId}/questions/${questionId}`, payload)

export const deleteQuestion = (questionnaireId, questionId) =>
  del(`/questionnaires/${questionnaireId}/questions/${questionId}`)

export const getResponses = (questionnaireId, query = {}, requestConfig = {}) =>
  get(`/questionnaires/${questionnaireId}/responses`, { params: query, ...requestConfig })

export const getResponsesSummary = (questionnaireId, query = {}, requestConfig = {}) =>
  get(`/questionnaires/${questionnaireId}/responses/summary`, { params: query, ...requestConfig })

export const getTracerAccreditationSummary = (query = {}, requestConfig = {}) =>
  get('/dashboard/tracer/accreditation-summary', { params: query, ...requestConfig })

export const requestResponsesExport = (payload = {}) =>
  post('/exports/responses', payload)

export const getExportStatus = (exportId) =>
  get(`/exports/${exportId}`)

export const downloadExport = (exportId, config = {}) =>
  get(`/exports/${exportId}/download`, config)

export const submitAlumniAnswer = (payload) => post('/responses/submit', payload)

export const submitBulkSubmissions = (payloads = []) =>
  post('/submissions/bulk', { data: payloads })

export const deleteSubmission = async (submissionId) => {
  const id = encodeURIComponent(String(submissionId ?? '').trim())
  try {
    // Route aktif di backend: DELETE /responses/{id}
    return await del(`/responses/${id}`)
  } catch (err) {
    if (err?.response?.status !== 404) throw err
    // Fallback kompatibilitas lama
    return del(`/submissions/${id}`)
  }
}

export const getSubmissionById = async (submissionId) => {
  const id = encodeURIComponent(String(submissionId ?? '').trim())
  try {
    // Route aktif di backend: GET /responses/attempt/{attempt_id}
    return await get(`/responses/attempt/${id}`)
  } catch (err) {
    if (err?.response?.status !== 404) throw err
    // Fallback kompatibilitas lama
    return get(`/submissions/${id}`)
  }
}

export const getActiveQuestionnaire = (audience = 'alumni', requestConfig = {}) =>
  get('/questionnaires/active', { params: { audience }, ...requestConfig })

// Bank soal global (jika tersedia di backend)
export const getQuestionBank = () => get('/question-bank')
export const createQuestionBankItem = (payload) => post('/question-bank', payload)
export const updateQuestionBankItem = (id, payload) =>
  put(`/question-bank/${id}`, payload)
export const deleteQuestionBankItem = (id) => del(`/question-bank/${id}`)

export default {
  getQuestionnaires,
  getQuestionnaireById,
  createQuestionnaire,
  updateQuestionnaire,
  deleteQuestionnaire,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getResponses,
  getResponsesSummary,
  getTracerAccreditationSummary,
  requestResponsesExport,
  getExportStatus,
  downloadExport,
  submitAlumniAnswer,
  submitBulkSubmissions,
  deleteSubmission,
  getSubmissionById,
  getActiveQuestionnaire,
  getQuestionBank,
  createQuestionBankItem,
  updateQuestionBankItem,
  deleteQuestionBankItem,
}
