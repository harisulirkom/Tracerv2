import router from '../src/router'
import { useAuth } from '../src/stores/auth'

const adminCreds = { email: 'admin@tracer.local', password: 'admin123' }

const resetRouter = async () => {
  try {
    await router.replace('/')
  } catch (error) {
    // ignore NavigationDuplicated errors
    if (error?.type !== 16) {
      throw error
    }
  }
  await router.isReady()
}

describe('login and logout navigation flow', () => {
  beforeEach(async () => {
    localStorage.clear()
    const auth = useAuth()
    if (auth.isAuthenticated.value) {
      auth.logout()
    }
    await resetRouter()
  })

  it('redirects tamu ke halaman login saat membuka /admin', async () => {
    await router.push('/admin')
    expect(router.currentRoute.value.fullPath).toBe('/login?redirect=/admin')
  })

  it('mengarahkan admin ke dashboard setelah login', async () => {
    const auth = useAuth()
    await expect(auth.login(adminCreds.email, adminCreds.password)).resolves.toBe(true)
    await router.push('/admin')
    expect(router.currentRoute.value.fullPath).toBe('/admin')
  })

  it('mengembalikan admin ke dashboard jika mencoba membuka /login', async () => {
    const auth = useAuth()
    await auth.login(adminCreds.email, adminCreds.password)
    await router.push('/login')
    expect(router.currentRoute.value.fullPath).toBe('/admin')
  })

  it('mengembalikan pengguna ke login setelah logout saat menuju admin', async () => {
    const auth = useAuth()
    await auth.login(adminCreds.email, adminCreds.password)
    auth.logout()
    await router.push('/admin')
    expect(router.currentRoute.value.fullPath).toBe('/login?redirect=/admin')
  })
})
