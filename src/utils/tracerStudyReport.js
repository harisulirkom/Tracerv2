export const MAX_TRACER_REPORT_SIZE = 10 * 1024 * 1024

export const needsScopeName = (scopeType) => ['fakultas', 'prodi'].includes(scopeType)

export const validateTracerReportFile = (file) => {
  if (!file) return 'File PDF wajib dipilih.'

  const extensionIsPdf = String(file.name || '').toLowerCase().endsWith('.pdf')
  const mimeIsPdf = ['application/pdf', 'application/x-pdf'].includes(String(file.type || '').toLowerCase())
  if (!extensionIsPdf || !mimeIsPdf) return 'File harus berformat PDF.'
  if (file.size > MAX_TRACER_REPORT_SIZE) return 'Ukuran file PDF maksimal 10 MB.'

  return ''
}

export const formatFileSize = (bytes) => {
  const value = Number(bytes || 0)
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

export const scopeLabel = (report) => {
  const type = String(report?.scopeType || '').toLowerCase()
  const labels = {
    universitas: 'Universitas',
    fakultas: 'Fakultas',
    prodi: 'Program Studi',
  }
  const label = labels[type] || type || '-'
  return report?.scopeName ? `${label} · ${report.scopeName}` : label
}

export const tracerReportApiError = (error, fallback) => {
  const validation = error?.response?.data?.errors
  if (validation) return Object.values(validation).flat().join(' ')
  return error?.response?.data?.message || error?.message || fallback
}

export const confirmTracerReportDeletion = (report, confirmFn = window.confirm) =>
  confirmFn(`Hapus permanen laporan "${report.title}" beserta file PDF-nya?`)
