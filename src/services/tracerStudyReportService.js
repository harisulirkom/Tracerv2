import api, { del, get } from './api'

const unwrapCollection = (payload) => ({
  items: Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [],
  meta: payload?.meta || null,
  links: payload?.links || null,
})

const buildFormData = (payload = {}) => {
  const form = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    form.append(key, value)
  })
  return form
}

export const getPublicReports = async (params = {}) =>
  unwrapCollection(await get('/tracer-study-reports', { params }))

export const getAdminReports = async (params = {}) =>
  unwrapCollection(await get('/admin/tracer-study-reports', { params }))

export const createReport = async (payload) => {
  const response = await api.post('/admin/tracer-study-reports', buildFormData(payload))
  return response?.data?.data ?? response?.data
}

export const deleteReport = (id) => del(`/admin/tracer-study-reports/${id}`)

export const viewReport = async (report) => {
  const previewWindow = window.open('', '_blank')
  if (previewWindow) {
    previewWindow.document.title = 'Memuat laporan tracer study...'
    previewWindow.document.body.textContent = 'Memuat PDF...'
  }

  try {
    const response = await api.get(`/tracer-study-reports/${report.id}/view`, {
      responseType: 'blob',
    })
    const url = URL.createObjectURL(response.data)

    if (previewWindow) {
      previewWindow.location.href = url
    } else {
      const link = document.createElement('a')
      link.href = url
      link.target = '_blank'
      link.rel = 'noopener'
      document.body.appendChild(link)
      link.click()
      link.remove()
    }

    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (error) {
    previewWindow?.close()
    throw error
  }
}

export const downloadReport = async (report) => {
  const response = await api.get(`/tracer-study-reports/${report.id}/download`, {
    responseType: 'blob',
  })
  const blob = response.data
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = report.originalName || `laporan-tracer-study-${report.reportYear}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default {
  getPublicReports,
  getAdminReports,
  createReport,
  deleteReport,
  viewReport,
  downloadReport,
}
