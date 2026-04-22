import { get, post } from './api'

// Kirim jawaban kuisioner
export const submitResponses = (data) => post('/responses/submit', data)
export const submitResponsesViaToken = (data) => post('/responses/submit-via-token', data)

// Riwayat pengisian berdasarkan alumni_id
export const getAttempts = (alumniId) => get(`/responses/${alumniId}`)

// Detail pengisian per attempt
export const getAttemptDetail = (attemptId) => get(`/responses/attempt/${attemptId}`)

// Validasi token akses kuisioner
export const validateSurveyToken = (token) => post('/surveys/validate-token', { token })

export default {
  submitResponses,
  submitResponsesViaToken,
  getAttempts,
  getAttemptDetail,
  validateSurveyToken,
}
 
