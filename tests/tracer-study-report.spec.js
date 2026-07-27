import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import TracerStudyReportsSection from '../src/components/TracerStudyReportsSection.vue'
import reportService from '../src/services/tracerStudyReportService'
import {
  confirmTracerReportDeletion,
  MAX_TRACER_REPORT_SIZE,
  needsScopeName,
  tracerReportApiError,
  validateTracerReportFile,
} from '../src/utils/tracerStudyReport'

vi.mock('../src/services/tracerStudyReportService', () => ({
  default: {
    getPublicReports: vi.fn(),
    viewReport: vi.fn(),
    downloadReport: vi.fn(),
  },
}))

describe('tracer study report file validation', () => {
  it('accepts a PDF no larger than 10 MB', () => {
    const file = new File(['%PDF-1.4'], 'laporan.pdf', { type: 'application/pdf' })
    expect(validateTracerReportFile(file)).toBe('')
  })

  it('rejects a non-PDF and an oversized PDF', () => {
    const text = new File(['data'], 'laporan.txt', { type: 'text/plain' })
    const oversized = {
      name: 'besar.pdf',
      type: 'application/pdf',
      size: MAX_TRACER_REPORT_SIZE + 1,
    }

    expect(validateTracerReportFile(text)).toMatch(/PDF/)
    expect(validateTracerReportFile(oversized)).toMatch(/10 MB/)
  })

  it('requires organization names only for faculty and program scopes', () => {
    expect(needsScopeName('universitas')).toBe(false)
    expect(needsScopeName('fakultas')).toBe(true)
    expect(needsScopeName('prodi')).toBe(true)
  })

  it('formats upload validation errors and requires deletion confirmation', () => {
    const uploadError = {
      response: {
        data: {
          errors: {
            file: ['File harus berformat PDF.', 'Ukuran maksimal 10 MB.'],
          },
        },
      },
    }
    expect(tracerReportApiError(uploadError, 'Gagal mengunggah.')).toContain('File harus berformat PDF.')

    const confirm = vi.fn().mockReturnValue(false)
    expect(confirmTracerReportDeletion({ title: 'Laporan 2025' }, confirm)).toBe(false)
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('Hapus permanen'))
  })
})

describe('TracerStudyReportsSection', () => {
  let root
  let app

  beforeEach(() => {
    reportService.getPublicReports.mockResolvedValue({
      items: [
        {
          id: 1,
          title: 'Laporan Tracer Study 2025',
          description: 'Ringkasan hasil tracer.',
          reportYear: 2025,
          scopeType: 'universitas',
          scopeName: null,
          originalName: 'laporan.pdf',
          fileSize: 1024,
          downloadCount: 3,
        },
      ],
      meta: { current_page: 1, last_page: 1 },
    })
    reportService.downloadReport.mockResolvedValue()
    reportService.viewReport.mockResolvedValue()
    root = document.createElement('div')
    document.body.appendChild(root)
  })

  afterEach(() => {
    app?.unmount()
    root?.remove()
    vi.clearAllMocks()
  })

  it('renders reports, applies filters, and downloads a selected report', async () => {
    app = createApp(TracerStudyReportsSection)
    app.use(createI18n({ legacy: false, locale: 'id', messages: { id: {} } }))
    app.mount(root)
    await nextTick()
    await nextTick()

    expect(root.textContent).toContain('Laporan Tracer Study 2025')
    expect(root.textContent).toContain('Universitas')

    const yearInput = root.querySelector('input[type="number"]')
    yearInput.value = '2025'
    yearInput.dispatchEvent(new Event('input'))
    const buttons = [...root.querySelectorAll('button')]
    buttons.find((button) => button.textContent.includes('Terapkan')).click()
    await nextTick()

    expect(reportService.getPublicReports).toHaveBeenLastCalledWith(
      expect.objectContaining({ year: 2025, page: 1 }),
    )

    buttons.find((button) => button.textContent.includes('Unduh PDF')).click()
    await nextTick()
    expect(reportService.downloadReport).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 }),
    )

    buttons.find((button) => button.textContent.includes('Lihat PDF')).click()
    await nextTick()
    expect(reportService.viewReport).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 }),
    )
  })

  it('shows an empty state when no reports are returned', async () => {
    reportService.getPublicReports.mockResolvedValue({
      items: [],
      meta: { current_page: 1, last_page: 1 },
    })
    app = createApp(TracerStudyReportsSection)
    app.use(createI18n({ legacy: false, locale: 'id', messages: { id: {} } }))
    app.mount(root)
    await nextTick()
    await nextTick()

    expect(root.textContent).toContain('Belum ada laporan tracer study')
  })
})
