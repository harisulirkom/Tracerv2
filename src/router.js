import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import LayananView from './views/LayananView.vue'
import LowonganView from './views/LowonganView.vue'
import BeritaView from './views/BeritaView.vue'
import KuisionerView from './views/KuisionerView.vue'
import KuisionerLandingView from './views/KuisionerLandingView.vue'
import KuisionerPenggunaView from './views/KuisionerPenggunaView.vue'
import KuisionerUmumView from './views/KuisionerUmumView.vue'
import TentangView from './views/TentangView.vue'
import BeritaDetailView from './views/BeritaDetailView.vue'
import DaftarKuisionerView from './views/DaftarKuisionerView.vue'
import LoginView from './views/LoginView.vue'
import AdminView from './views/AdminView.vue'
import PublicLayout from './views/PublicLayout.vue'
import AdminProfileView from './views/AdminProfileView.vue'
import AdminBeritaView from './views/AdminBeritaView.vue'
import AdminAlumniView from './views/AdminAlumniView.vue'
import AdminKuisionerView from './views/AdminKuisionerView.vue'
import AdminKuisionerQuestionsView from './views/AdminKuisionerQuestionsView.vue'
import AdminBankSoalView from './views/AdminBankSoalView.vue'
import AdminKuisionerDetailView from './views/AdminKuisionerDetailView.vue'
import AdminTracerAccreditationView from './views/AdminTracerAccreditationView.vue'
import AdminCtaView from './views/AdminCtaView.vue'
import AdminLowonganView from './views/AdminLowonganView.vue'
import AdminArtikelView from './views/AdminArtikelView.vue'
import ArtikelView from './views/ArtikelView.vue'
import AdminUserView from './views/AdminUserView.vue'
import AdminKuisionerResponsesView from './views/AdminKuisionerResponsesView.vue'
import NotFoundView from './views/NotFoundView.vue'
import UnderDevelopmentView from './views/UnderDevelopmentView.vue'
import TestApiView from './views/TestApi.vue'
import QuestionnaireListView from './views/Questionnaire/List.vue'
import QuestionnaireCreateView from './views/Questionnaire/Create.vue'
import QuestionnaireDetailView from './views/Questionnaire/Detail.vue'
import TracerAttemptsView from './views/Tracer/Attempts.vue'
import TracerAttemptDetailView from './views/Tracer/AttemptDetail.vue'
import { useAuth } from './stores/auth'
import { useUserManagement } from './stores/userManagement'
import TracerDashboardView from './views/Dashboard/TracerDashboard.vue'

const routes = [
  {
    path: '/',
    component: PublicLayout,
    children: [
      { path: '', name: 'Home', component: HomeView },
      { path: 'layanan', name: 'Layanan', component: LayananView },
      { path: 'lowongan', name: 'Lowongan', component: LowonganView },
      { path: 'berita', name: 'Berita', component: BeritaView },
      { path: 'berita/:id', name: 'BeritaDetail', component: BeritaDetailView },
      { path: 'kuisioner', name: 'Kuisioner', component: KuisionerLandingView },
      { path: 'kuisioner/alumni', name: 'KuisionerAlumni', component: KuisionerView },
      { path: 'kuisioner/pengguna', name: 'KuisionerPengguna', component: KuisionerPenggunaView },
      { path: 'kuisioner/umum', name: 'KuisionerUmum', component: KuisionerUmumView },
      { path: 'daftar-kuisioner', name: 'DaftarKuisioner', component: DaftarKuisionerView },
      { path: 'tentang', name: 'Tentang', component: TentangView },
      { path: 'artikel', name: 'Artikel', component: ArtikelView },
      { path: 'questionnaires', name: 'QuestionnaireList', component: QuestionnaireListView },
      { path: 'questionnaires/create', name: 'QuestionnaireCreate', component: QuestionnaireCreateView },
      {
        path: 'questionnaires/:id',
        name: 'QuestionnaireDetail',
        component: QuestionnaireDetailView,
        props: true,
      },
      { path: 'tracer/attempts', name: 'TracerAttempts', component: TracerAttemptsView },
      {
        path: 'tracer/attempts/:id',
        name: 'TracerAttemptDetail',
        component: TracerAttemptDetailView,
        props: true,
      },
      { path: 'test-api', name: 'TestApi', component: TestApiView },
      { path: 'coming-soon/:slug?', name: 'ComingSoon', component: UnderDevelopmentView },
      { path: 'login', name: 'Login', component: LoginView, meta: { guestOnly: true } },
    ],
  },
  { path: '/admin/dashboard-tracer', name: 'TracerDashboard', component: TracerDashboardView, meta: { requiresAuth: true } },
  {
    path: '/admin/tracer-akreditasi',
    name: 'AdminTracerAccreditation',
    component: AdminTracerAccreditationView,
    meta: { requiresAuth: true },
  },
  { path: '/admin', name: 'Admin', component: AdminView, meta: { requiresAuth: true } },
  { path: '/admin/profile', name: 'AdminProfile', component: AdminProfileView, meta: { requiresAuth: true } },
  { path: '/admin/berita', name: 'AdminBerita', component: AdminBeritaView, meta: { requiresAuth: true } },
  { path: '/admin/alumni', name: 'AdminAlumni', component: AdminAlumniView, meta: { requiresAuth: true } },
  { path: '/admin/bank-soal', name: 'AdminBankSoal', component: AdminBankSoalView, meta: { requiresAuth: true } },
  { path: '/admin/cta', name: 'AdminCta', component: AdminCtaView, meta: { requiresAuth: true } },
  { path: '/admin/lowongan', name: 'AdminLowongan', component: AdminLowonganView, meta: { requiresAuth: true } },
  { path: '/admin/artikel', name: 'AdminArtikel', component: AdminArtikelView, meta: { requiresAuth: true } },
  { path: '/admin/user', name: 'AdminUser', component: AdminUserView, meta: { requiresAuth: true } },
  {
    path: '/admin/kuisioner',
    name: 'AdminKuisioner',
    component: AdminKuisionerView,
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/kuisioner/:id/pertanyaan',
    name: 'AdminKuisionerQuestions',
    component: AdminKuisionerQuestionsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/kuisioner/:id/jawaban',
    name: 'AdminKuisionerResponses',
    component: AdminKuisionerResponsesView,
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/kuisioner/:id/detail',
    name: 'AdminKuisionerDetail',
    component: AdminKuisionerDetailView,
    meta: { requiresAuth: true },
  },
  {
    path: '/404',
    component: PublicLayout,
    children: [{ path: '', name: 'NotFound', component: NotFoundView }],
  },
  { path: '/:pathMatch(.*)*', redirect: '/404' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to, from, next) => {
  const auth = useAuth()
  const { isAuthenticated, isTokenExpired, logout } = auth
  const { accessControl, permissions } = useUserManagement()

  if (to.meta.requiresAuth && (!isAuthenticated.value || isTokenExpired())) {
    if (isTokenExpired()) logout()
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.guestOnly && isAuthenticated.value) {
    const redirectTarget =
      typeof to.query?.redirect === 'string' && to.query.redirect ? to.query.redirect : '/admin'
    next(redirectTarget)
    return
  }

  const normalizeRole = (role) => String(role || '').trim().toLowerCase()
  const extractRoleLabel = (role) => {
    if (role && typeof role === 'object') {
      return (
        role.role_name ||
        role.roleName ||
        role.role_id ||
        role.roleId ||
        role.name ||
        role.label ||
        role.title ||
        role.role ||
        role.nama ||
        role.id ||
        ''
      )
    }
    return role
  }
  const ROLE_ID_MAP = {
    1: 'Super Admin',
    2: 'Admin Universitas',
    3: 'Admin Fakultas',
    4: 'Admin Prodi',
  }
  const ROLE_MAP = {
    'super admin': 'Super Admin',
    'superadmin': 'Super Admin',
    admin: 'Admin Universitas',
    'admin universitas': 'Admin Universitas',
    'admin fakultas': 'Admin Fakultas',
    'admin prodi': 'Admin Prodi',
    'admin program studi': 'Admin Prodi',
  }
  const resolveRoleKey = (role) => {
    const extracted = extractRoleLabel(role)
    const extractedNumber =
      typeof extracted === 'number'
        ? extracted
        : typeof extracted === 'string' && extracted.trim() && !Number.isNaN(Number(extracted))
          ? Number(extracted)
          : null
    if (extractedNumber !== null) {
      return ROLE_ID_MAP[extractedNumber] || String(extractedNumber)
    }
    const normalized = normalizeRole(extracted)
    return ROLE_MAP[normalized] || (extracted ? String(extracted).trim() : '')
  }
  const roleKey = resolveRoleKey(auth.user.value?.role)
  const role = normalizeRole(roleKey)
  const rolePermissions = permissions[roleKey] || {}
  const isSuperAdmin = role === 'super admin'
  const applyRestrictedMenu =
    accessControl.value?.restrictFacultyMenu &&
    (role === 'admin fakultas' || role === 'admin prodi')
  if (to.meta.requiresAuth && applyRestrictedMenu) {
    const path = to.path
    const isAllowed =
      path === '/admin' ||
      path === '/admin/profile' ||
      path === '/admin/kuisioner' ||
      path.startsWith('/admin/kuisioner/') ||
      path === '/admin/tracer-akreditasi' ||
      path.startsWith('/admin/tracer-akreditasi/') ||
      path === '/admin/alumni' ||
      path.startsWith('/admin/alumni/') ||
      path === '/admin/bank-soal' ||
      path.startsWith('/admin/bank-soal/')
    if (!isAllowed) {
      next('/admin')
      return
    }
  }

  if (to.meta.requiresAuth && !isSuperAdmin) {
    const path = to.path
    const permissionMap = [
      { pattern: /^\/admin$/, key: 'ikhtisar' },
      { pattern: /^\/admin\/dashboard-tracer/, key: 'kuisioner' },
      { pattern: /^\/admin\/tracer-akreditasi/, key: 'kuisioner' },
      { pattern: /^\/admin\/kuisioner/, key: 'kuisioner' },
      { pattern: /^\/admin\/bank-soal/, key: 'bankSoal' },
      { pattern: /^\/admin\/alumni/, key: 'alumni' },
      { pattern: /^\/admin\/lowongan/, key: 'lowongan' },
      { pattern: /^\/admin\/cta/, key: 'cta' },
      { pattern: /^\/admin\/artikel/, key: 'artikel' },
      { pattern: /^\/admin\/berita/, key: 'berita' },
      { pattern: /^\/admin\/user/, key: 'user' },
    ]
    const match = permissionMap.find((item) => item.pattern.test(path))
    if (match && rolePermissions && typeof rolePermissions === 'object') {
      if (!rolePermissions[match.key]) {
        const fallbackCandidates = applyRestrictedMenu
          ? [
              { key: 'ikhtisar', path: '/admin' },
              { key: 'kuisioner', path: '/admin/kuisioner' },
              { key: 'alumni', path: '/admin/alumni' },
              { key: 'bankSoal', path: '/admin/bank-soal' },
            ]
          : [
              { key: 'ikhtisar', path: '/admin' },
              { key: 'kuisioner', path: '/admin/kuisioner' },
              { key: 'alumni', path: '/admin/alumni' },
              { key: 'bankSoal', path: '/admin/bank-soal' },
              { key: 'lowongan', path: '/admin/lowongan' },
              { key: 'cta', path: '/admin/cta' },
              { key: 'artikel', path: '/admin/artikel' },
              { key: 'user', path: '/admin/user' },
              { key: 'berita', path: '/admin/berita' },
            ]
        const fallback =
          fallbackCandidates.find((item) => rolePermissions[item.key])?.path || '/admin/profile'
        if (fallback !== path) {
          next(fallback)
          return
        }
      }
    }
  }

  next()
})

export default router
