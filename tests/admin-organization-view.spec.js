import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import AdminStrukturOrganisasiView from '../src/views/AdminStrukturOrganisasiView.vue'
import organizationService from '../src/services/organizationService'

vi.mock('../src/components/AdminShell.vue', () => ({
  default: { template: '<main><slot /></main>' },
}))

vi.mock('../src/services/organizationService', () => ({
  default: {
    getAdminOrganizationMembers: vi.fn(),
    createOrganizationMember: vi.fn(),
    updateOrganizationMember: vi.fn(),
    reorderOrganizationMembers: vi.fn(),
    deleteOrganizationMember: vi.fn(),
  },
}))

const flushPromises = async () => {
  await Promise.resolve()
  await Promise.resolve()
  await nextTick()
}

describe('AdminStrukturOrganisasiView', () => {
  let app
  let root

  beforeEach(() => {
    root = document.createElement('div')
    document.body.appendChild(root)
    window.scrollTo = vi.fn()
    organizationService.getAdminOrganizationMembers.mockResolvedValue([])
    organizationService.createOrganizationMember.mockResolvedValue({ id: 10 })
  })

  afterEach(() => {
    app?.unmount()
    root?.remove()
    vi.clearAllMocks()
  })

  it('shows loading and then an empty state', async () => {
    let finishLoading
    organizationService.getAdminOrganizationMembers.mockReturnValue(
      new Promise((resolve) => {
        finishLoading = resolve
      }),
    )

    app = createApp(AdminStrukturOrganisasiView)
    app.mount(root)
    await nextTick()
    expect(root.textContent).toContain('Memuat struktur organisasi')

    finishLoading([])
    await flushPromises()
    expect(root.textContent).toContain('Belum ada anggota organisasi')
  })

  it('submits a complete create form and reports success', async () => {
    app = createApp(AdminStrukturOrganisasiView)
    app.mount(root)
    await flushPromises()

    const requiredInputs = root.querySelectorAll('input[required]')
    requiredInputs[0].value = 'Siti Rahma'
    requiredInputs[0].dispatchEvent(new Event('input'))
    requiredInputs[1].value = 'Kepala Divisi'
    requiredInputs[1].dispatchEvent(new Event('input'))
    await nextTick()

    root.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(organizationService.createOrganizationMember).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Siti Rahma',
        position: 'Kepala Divisi',
        is_active: true,
      }),
    )
    expect(root.textContent).toContain('Anggota organisasi berhasil ditambahkan')
  })

  it('renders an API loading error', async () => {
    organizationService.getAdminOrganizationMembers.mockRejectedValue({
      response: { data: { message: 'Layanan struktur tidak tersedia.' } },
    })

    app = createApp(AdminStrukturOrganisasiView)
    app.mount(root)
    await flushPromises()

    expect(root.textContent).toContain('Layanan struktur tidak tersedia.')
  })
})
