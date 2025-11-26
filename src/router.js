import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import LayananView from './views/LayananView.vue'
import LowonganView from './views/LowonganView.vue'
import BeritaView from './views/BeritaView.vue'
import KuisionerView from './views/KuisionerView.vue'
import KuisionerLandingView from './views/KuisionerLandingView.vue'
import KuisionerPenggunaView from './views/KuisionerPenggunaView.vue'
import TentangView from './views/TentangView.vue'
import BeritaDetailView from './views/BeritaDetailView.vue'
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
import AdminCtaView from './views/AdminCtaView.vue'
import AdminLowonganView from './views/AdminLowonganView.vue'
import AdminArtikelView from './views/AdminArtikelView.vue'
import ArtikelView from './views/ArtikelView.vue'
import AdminUserView from './views/AdminUserView.vue'
import AdminKuisionerResponsesView from './views/AdminKuisionerResponsesView.vue'
import NotFoundView from './views/NotFoundView.vue'
import UnderDevelopmentView from './views/UnderDevelopmentView.vue'
import { useAuth } from './stores/auth'

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
      { path: 'tentang', name: 'Tentang', component: TentangView },
      { path: 'artikel', name: 'Artikel', component: ArtikelView },
      { path: 'coming-soon/:slug?', name: 'ComingSoon', component: UnderDevelopmentView },
      { path: 'login', name: 'Login', component: LoginView, meta: { guestOnly: true } },
    ],
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
  const { isAuthenticated, isTokenExpired, logout } = useAuth()

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

  next()
})

export default router
