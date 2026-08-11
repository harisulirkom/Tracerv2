const commonAdminNavigation = [
  { label: 'Struktur Organisasi', route: '/admin/struktur-organisasi', icon: 'structure', centralOnly: true },
  { label: 'Kuisioner', route: '/admin/kuisioner', icon: 'kuisioner', permissionKey: 'kuisioner' },
  { label: 'Akreditasi tracer', route: '/admin/tracer-akreditasi', icon: 'akreditasi', permissionKey: 'kuisioner' },
  { label: 'Laporan Tracer Study', route: '/admin/laporan-tracer', icon: 'laporan', centralOnly: true },
  { label: 'Daftar alumni', route: '/admin/alumni', icon: 'alumni', permissionKey: 'alumni' },
  { label: 'Konten Alumni', route: '/admin/alumni-hub', icon: 'alumni', permissionKey: 'alumni' },
  { label: 'Bank soal', route: '/admin/bank-soal', icon: 'bank', permissionKey: 'bankSoal' },
  { label: 'Popup Banner', route: '/admin/popup-banner', icon: 'cta', permissionKey: 'popupBanner' },
  { label: 'CTA Slider', route: '/admin/cta', icon: 'cta', permissionKey: 'cta' },
  { label: 'Kelola lowongan', route: '/admin/lowongan', icon: 'lowongan', permissionKey: 'lowongan' },
  { label: 'Artikel & tips', route: '/admin/artikel', icon: 'artikel', permissionKey: 'artikel' },
  {
    label: 'User',
    route: '/admin/user',
    icon: 'user',
    permissionKey: 'user',
    children: [
      { label: 'Tambah user', route: { path: '/admin/user', query: { tab: 'tambah' } }, permissionKey: 'user' },
      { label: 'Role & Akses', route: { path: '/admin/user', query: { tab: 'role' } }, permissionKey: 'user' },
      { label: 'Mapping Organisasi', route: { path: '/admin/user', query: { tab: 'mapping' } }, permissionKey: 'user' },
      { label: 'Import/Export', route: { path: '/admin/user', query: { tab: 'import' } }, permissionKey: 'user' },
      { label: 'Log Aktivitas', route: { path: '/admin/user', query: { tab: 'log' } }, permissionKey: 'user' },
    ],
  },
  { label: 'Berita', route: '/admin/berita', icon: 'berita', permissionKey: 'berita' },
]

const cloneNavigation = (items) =>
  items.map((item) => ({
    ...item,
    route: item.route && typeof item.route === 'object' ? { ...item.route, query: { ...item.route.query } } : item.route,
    children: item.children ? cloneNavigation(item.children) : undefined,
  }))

export const createAdminNavigation = ({ overviewTarget = false } = {}) => [
  overviewTarget
    ? { label: 'Ikhtisar', target: 'overview', icon: 'overview', permissionKey: 'ikhtisar' }
    : { label: 'Ikhtisar', route: '/admin', icon: 'overview', permissionKey: 'ikhtisar' },
  ...cloneNavigation(commonAdminNavigation),
]

export default createAdminNavigation
