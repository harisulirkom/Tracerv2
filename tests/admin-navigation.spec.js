import { describe, expect, it } from 'vitest'
import { createAdminNavigation } from '../src/constants/adminNavigation'

describe('shared admin navigation', () => {
  it('includes the central-only organization structure menu in regular admin pages', () => {
    const navigation = createAdminNavigation()
    const structure = navigation.find((item) => item.route === '/admin/struktur-organisasi')

    expect(navigation[0]).toMatchObject({ label: 'Ikhtisar', route: '/admin' })
    expect(structure).toMatchObject({
      label: 'Struktur Organisasi',
      icon: 'structure',
      centralOnly: true,
    })
  })

  it('uses an overview target on the Ikhtisar page without dropping shared menus', () => {
    const navigation = createAdminNavigation({ overviewTarget: true })

    expect(navigation[0]).toMatchObject({ label: 'Ikhtisar', target: 'overview' })
    expect(navigation.some((item) => item.route === '/admin/struktur-organisasi')).toBe(true)
  })
})
