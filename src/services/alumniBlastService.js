import { get, post, put } from '@/services/api'

export const generateSurveyLink = (payload) => post('/admin/generate-survey-link', payload)

export const blastEmail = (payload) => post('/admin/alumni/blast-email', payload)

export const getBlastEmailProgress = (blastId) =>
  get(`/admin/alumni/blast-email/${blastId}`, {
    params: { _t: Date.now() },
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  })

export const getEmailTemplate = (key = 'alumni-blast') => get(`/admin/email-templates/${key}`)

export const updateEmailTemplate = (key = 'alumni-blast', payload = {}) =>
  put(`/admin/email-templates/${key}`, payload)

export default {
  generateSurveyLink,
  blastEmail,
  getBlastEmailProgress,
  getEmailTemplate,
  updateEmailTemplate,
}
