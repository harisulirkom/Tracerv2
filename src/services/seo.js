const SITE_URL = 'https://cdc.uinkediri.ac.id'
const SITE_NAME = 'CDC UIN Syekh Wasil Kediri'
const DEFAULT_TITLE = 'CDC UIN Syekh Wasil Kediri'
const DEFAULT_DESCRIPTION =
  'Career Development Center UIN Syekh Wasil Kediri untuk tracer study, layanan karier, lowongan, berita, artikel, dan komunitas alumni.'
const DEFAULT_IMAGE = `${SITE_URL}/CDC.svg`

const PUBLIC_SEO = {
  Home: {
    title: 'CDC UIN Syekh Wasil Kediri | Career Development Center',
    description:
      'Portal Career Development Center UIN Syekh Wasil Kediri untuk tracer study, layanan karier, lowongan kerja, berita, dan informasi alumni.',
    path: '/',
    breadcrumbs: [{ name: 'Beranda', path: '/' }],
  },
  Layanan: {
    title: 'Layanan Karier dan Tracer Study | CDC UIN Syekh Wasil Kediri',
    description:
      'Informasi layanan karier, tracer study, pendampingan alumni, dan kemitraan industri CDC UIN Syekh Wasil Kediri.',
    path: '/layanan',
    breadcrumbs: [
      { name: 'Beranda', path: '/' },
      { name: 'Layanan dan Karier', path: '/layanan' },
    ],
  },
  Lowongan: {
    title: 'Lowongan Kerja | CDC UIN Syekh Wasil Kediri',
    description:
      'Temukan lowongan kerja, magang, dan peluang karier terbaru untuk mahasiswa dan alumni UIN Syekh Wasil Kediri.',
    path: '/lowongan',
    breadcrumbs: [
      { name: 'Beranda', path: '/' },
      { name: 'Lowongan', path: '/lowongan' },
    ],
  },
  Berita: {
    title: 'Berita CDC | UIN Syekh Wasil Kediri',
    description:
      'Berita dan pengumuman terbaru dari Career Development Center UIN Syekh Wasil Kediri.',
    path: '/berita',
    breadcrumbs: [
      { name: 'Beranda', path: '/' },
      { name: 'Berita', path: '/berita' },
    ],
  },
  BeritaDetail: {
    title: 'Detail Berita CDC | UIN Syekh Wasil Kediri',
    description:
      'Baca informasi lengkap terkait berita, pengumuman, tracer study, dan aktivitas CDC UIN Syekh Wasil Kediri.',
    dynamicCanonical: true,
    breadcrumbs: [
      { name: 'Beranda', path: '/' },
      { name: 'Berita', path: '/berita' },
    ],
  },
  Kuisioner: {
    title: 'Kuisioner Tracer Study | CDC UIN Syekh Wasil Kediri',
    description:
      'Pilih dan isi kuisioner tracer study untuk mendukung pemetaan karier alumni dan pengembangan layanan kampus.',
    path: '/kuisioner',
    breadcrumbs: [
      { name: 'Beranda', path: '/' },
      { name: 'Kuisioner', path: '/kuisioner' },
    ],
  },
  KuisionerAlumni: {
    title: 'Isi Kuisioner Alumni | CDC UIN Syekh Wasil Kediri',
    description:
      'Form kuisioner alumni untuk tracer study UIN Syekh Wasil Kediri.',
    path: '/kuisioner/alumni',
    breadcrumbs: [
      { name: 'Beranda', path: '/' },
      { name: 'Kuisioner Alumni', path: '/kuisioner/alumni' },
    ],
  },
  KuisionerPengguna: {
    title: 'Kuisioner Pengguna Alumni | CDC UIN Syekh Wasil Kediri',
    description:
      'Form penilaian pengguna alumni untuk mendukung evaluasi mutu lulusan UIN Syekh Wasil Kediri.',
    path: '/kuisioner/pengguna',
    breadcrumbs: [
      { name: 'Beranda', path: '/' },
      { name: 'Kuisioner Pengguna', path: '/kuisioner/pengguna' },
    ],
  },
  KuisionerUmum: {
    title: 'Kuisioner Umum | CDC UIN Syekh Wasil Kediri',
    description:
      'Form kuisioner umum CDC UIN Syekh Wasil Kediri untuk kebutuhan survei dan pengembangan layanan.',
    path: '/kuisioner/umum',
    breadcrumbs: [
      { name: 'Beranda', path: '/' },
      { name: 'Kuisioner Umum', path: '/kuisioner/umum' },
    ],
  },
  Tentang: {
    title: 'Profil CDC | UIN Syekh Wasil Kediri',
    description:
      'Profil Career Development Center UIN Syekh Wasil Kediri sebagai unit layanan karier, tracer study, dan kewirausahaan.',
    path: '/tentang',
    breadcrumbs: [
      { name: 'Beranda', path: '/' },
      { name: 'Profil CDC', path: '/tentang' },
    ],
  },
  StrukturOrganisasi: {
    title: 'Struktur Organisasi CDC | UIN Syekh Wasil Kediri',
    description:
      'Struktur organisasi Career Development Center UIN Syekh Wasil Kediri.',
    path: '/struktur-organisasi',
    breadcrumbs: [
      { name: 'Beranda', path: '/' },
      { name: 'Struktur Organisasi', path: '/struktur-organisasi' },
    ],
  },
  Artikel: {
    title: 'Artikel dan Tips Karier | CDC UIN Syekh Wasil Kediri',
    description:
      'Artikel, tips karier, panduan CV, wawancara kerja, dan pengembangan diri untuk mahasiswa dan alumni.',
    path: '/artikel',
    breadcrumbs: [
      { name: 'Beranda', path: '/' },
      { name: 'Artikel dan Tips', path: '/artikel' },
    ],
  },
  AlumniHub: {
    title: 'Pojok Alumni | CDC UIN Syekh Wasil Kediri',
    description:
      'Pojok Alumni UIN Syekh Wasil Kediri berisi galeri kegiatan, agenda acara, dan komunitas alumni.',
    path: '/alumni',
    breadcrumbs: [
      { name: 'Beranda', path: '/' },
      { name: 'Pojok Alumni', path: '/alumni' },
    ],
  },
  AlumniEvents: {
    title: 'Agenda dan Acara Alumni | CDC UIN Syekh Wasil Kediri',
    description:
      'Daftar agenda dan acara alumni UIN Syekh Wasil Kediri untuk jejaring, pengembangan diri, dan kontribusi kampus.',
    path: '/alumni/acara',
    breadcrumbs: [
      { name: 'Beranda', path: '/' },
      { name: 'Pojok Alumni', path: '/alumni' },
      { name: 'Agenda Alumni', path: '/alumni/acara' },
    ],
  },
  AlumniEventsLegacy: {
    title: 'Agenda dan Acara Alumni | CDC UIN Syekh Wasil Kediri',
    description:
      'Daftar agenda dan acara alumni UIN Syekh Wasil Kediri untuk jejaring, pengembangan diri, dan kontribusi kampus.',
    path: '/alumni/acara',
    breadcrumbs: [
      { name: 'Beranda', path: '/' },
      { name: 'Pojok Alumni', path: '/alumni' },
      { name: 'Agenda Alumni', path: '/alumni/acara' },
    ],
  },
}

const NOINDEX_ROUTE_NAMES = new Set([
  'Login',
  'NotFound',
  'ComingSoon',
  'DaftarKuisioner',
  'QuestionnaireList',
  'QuestionnaireCreate',
  'QuestionnaireDetail',
  'TracerAttempts',
  'TracerAttemptDetail',
  'TestApi',
])

const ensureMeta = (selector, attrs = {}) => {
  if (typeof document === 'undefined') return null
  let tag = document.head.querySelector(selector)
  if (!tag) {
    tag = document.createElement('meta')
    document.head.appendChild(tag)
  }
  Object.entries(attrs).forEach(([key, value]) => tag.setAttribute(key, value))
  return tag
}

const setMetaName = (name, content) =>
  ensureMeta(`meta[name="${name}"]`, { name, content })

const setMetaProperty = (property, content) =>
  ensureMeta(`meta[property="${property}"]`, { property, content })

const setLink = (rel, href) => {
  if (typeof document === 'undefined') return
  let tag = document.head.querySelector(`link[rel="${rel}"]`)
  if (!tag) {
    tag = document.createElement('link')
    tag.setAttribute('rel', rel)
    document.head.appendChild(tag)
  }
  tag.setAttribute('href', href)
}

const setJsonLd = (id, payload) => {
  if (typeof document === 'undefined') return
  let tag = document.getElementById(id)
  if (!tag) {
    tag = document.createElement('script')
    tag.id = id
    tag.type = 'application/ld+json'
    document.head.appendChild(tag)
  }
  tag.textContent = JSON.stringify(payload)
}

const normalizePath = (path = '/') => {
  if (!path || path === '/') return '/'
  return `/${String(path).replace(/^\/+|\/+$/g, '')}`
}

const absoluteUrl = (path = '/') => `${SITE_URL}${normalizePath(path) === '/' ? '' : normalizePath(path)}`

const buildBreadcrumbJsonLd = (breadcrumbs = []) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: breadcrumbs.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
})

const applyBaseStructuredData = () => {
  setJsonLd('seo-organization-jsonld', {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: SITE_NAME,
    alternateName: 'Career Development Center UIN Syekh Wasil Kediri',
    url: SITE_URL,
    logo: DEFAULT_IMAGE,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Kediri',
      addressRegion: 'Jawa Timur',
      addressCountry: 'ID',
    },
  })

  setJsonLd('seo-website-jsonld', {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/berita?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  })
}

export const applyRouteSeo = (route) => {
  if (typeof document === 'undefined') return

  const routeName = String(route?.name || '')
  const isAdmin = String(route?.path || '').startsWith('/admin')
  const seo = PUBLIC_SEO[routeName]
  const shouldNoIndex = isAdmin || NOINDEX_ROUTE_NAMES.has(routeName) || !seo
  const title = seo?.title || DEFAULT_TITLE
  const description = seo?.description || DEFAULT_DESCRIPTION
  const canonical = absoluteUrl(seo?.dynamicCanonical ? route?.path : seo?.path || route?.path || '/')

  document.documentElement.lang = 'id'
  document.title = title
  setMetaName('description', description)
  setMetaName(
    'keywords',
    'CDC UIN Kediri, CDC UIN Syekh Wasil Kediri, tracer study, career development center, alumni UIN Kediri, lowongan kerja Kediri',
  )
  setMetaName('robots', shouldNoIndex ? 'noindex,nofollow' : 'index,follow')
  setMetaName('googlebot', shouldNoIndex ? 'noindex,nofollow' : 'index,follow')
  setMetaName('author', SITE_NAME)
  setLink('canonical', canonical)

  setMetaProperty('og:type', 'website')
  setMetaProperty('og:site_name', SITE_NAME)
  setMetaProperty('og:title', title)
  setMetaProperty('og:description', description)
  setMetaProperty('og:url', canonical)
  setMetaProperty('og:image', DEFAULT_IMAGE)
  setMetaProperty('og:locale', 'id_ID')

  setMetaName('twitter:card', 'summary_large_image')
  setMetaName('twitter:title', title)
  setMetaName('twitter:description', description)
  setMetaName('twitter:image', DEFAULT_IMAGE)

  applyBaseStructuredData()
  if (seo?.breadcrumbs?.length) {
    setJsonLd('seo-breadcrumb-jsonld', buildBreadcrumbJsonLd(seo.breadcrumbs))
  }
}
