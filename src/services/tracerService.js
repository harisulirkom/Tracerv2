import apiClient from './apiClient'

export const getQuestionnaires = (params = {}) =>
  apiClient.get('/tracer/questionnaires', params)

export const getQuestionnaireById = (id) =>
  apiClient.get(`/tracer/questionnaires/${id}`)

export const createQuestionnaire = (payload) =>
  apiClient.post('/tracer/questionnaires', payload)

export const updateQuestionnaire = (id, payload) =>
  apiClient.put(`/tracer/questionnaires/${id}`, payload)

export const deleteQuestionnaire = (id) =>
  apiClient.del(`/tracer/questionnaires/${id}`)

export const getQuestions = (questionnaireId) =>
  apiClient.get(`/tracer/questionnaires/${questionnaireId}/questions`)

export const createQuestion = (questionnaireId, payload) =>
  apiClient.post(`/tracer/questionnaires/${questionnaireId}/questions`, payload)

export const updateQuestion = (questionnaireId, questionId, payload) =>
  apiClient.put(`/tracer/questionnaires/${questionnaireId}/questions/${questionId}`, payload)

export const deleteQuestion = (questionnaireId, questionId) =>
  apiClient.del(`/tracer/questionnaires/${questionnaireId}/questions/${questionId}`)

export const getResponses = (questionnaireId, query = {}) =>
  apiClient.get(`/tracer/questionnaires/${questionnaireId}/responses`, query)

export const submitAlumniAnswer = (payload) =>
  apiClient.post('/tracer/submissions', payload)

export const submitBulkSubmissions = (payloads = []) =>
  apiClient.post('/tracer/submissions/bulk', { data: payloads })

export const deleteSubmission = (submissionId) =>
  apiClient.del(`/tracer/submissions/${submissionId}`)

export const getSubmissionById = (submissionId) =>
  apiClient.get(`/tracer/submissions/${submissionId}`)

export const getActiveQuestionnaire = (audience = 'alumni') =>
  apiClient.get('/tracer/questionnaires/active', { audience })

// Bank soal global
export const getQuestionBank = () => apiClient.get('/tracer/question-bank')
export const createQuestionBankItem = (payload) => apiClient.post('/tracer/question-bank', payload)
export const updateQuestionBankItem = (id, payload) =>
  apiClient.put(`/tracer/question-bank/${id}`, payload)
export const deleteQuestionBankItem = (id) => apiClient.del(`/tracer/question-bank/${id}`)

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
  submitAlumniAnswer,
  deleteSubmission,
  getSubmissionById,
  getActiveQuestionnaire,
  getQuestionBank,
  createQuestionBankItem,
  updateQuestionBankItem,
  deleteQuestionBankItem,
}
