import { get, post, put } from '@/services/api'

export const generateSurveyLink = (payload) => post('/admin/generate-survey-link', payload)

export const blastEmail = (payload) => post('/admin/alumni/blast-email', payload)

export const getEmailTemplate = (key = 'alumni-blast') => get(`/admin/email-templates/${key}`)

export const updateEmailTemplate = (key = 'alumni-blast', payload = {}) =>
  put(`/admin/email-templates/${key}`, payload)

export default {
  generateSurveyLink,
  blastEmail,
  getEmailTemplate,
  updateEmailTemplate,
}
