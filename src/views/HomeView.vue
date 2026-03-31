<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCtaSlides } from '../stores/cta'
import { useSubmissions } from '../stores/submissions'
import { useQuestionnaires } from '../stores/questionnaires'
import { useJobs } from '../stores/jobs'
import { useNews } from '../stores/news'
import { useArticles } from '../stores/articles'
import { useAuth } from '../stores/auth'

const { slides, fetchSlides } = useCtaSlides()
const auth = useAuth()
const { locale } = useI18n()

const localeDate = computed(() => (locale.value === 'ar' ? 'ar-SA' : locale.value === 'en' ? 'en-US' : 'id-ID'))

const homeCopyByLocale = {
  id: {
    monthUnit: 'bulan',
    fallbackHero: {
      tag: 'Career Development Center',
      title: 'Selamat Datang di Career Development Center',
      highlight: 'UIN Syekh Wasil Kediri',
      subtitle: 'Konten CTA dapat diatur melalui halaman admin.',
      chips: ['Tracer study', 'Portal CDC', 'Kemitraan industri'],
      primaryLabel: 'Lihat layanan',
      secondaryLabel: 'Kembali ke portal',
      statsLeft: 'Program aktif',
      statsRight: 'Mitra industri',
      statsRemark: 'Update CTA di admin untuk menampilkan konten terbaru.',
      statsBadge: 'Live',
    },
    features: [
      { title: 'Pengumpulan Data Cepat', desc: 'Kirim kuisioner multi-channel dengan notifikasi otomatis.', badge: 'Realtime' },
      { title: 'Analitik dan Laporan', desc: 'Pantau tingkat respon, tren karier, dan persebaran alumni.', badge: 'Insight' },
      { title: 'Integrasi & Ekspor', desc: 'Ekspor ke CSV/Excel atau hubungkan ke BI tools favorit.', badge: 'Opsional' },
      { title: 'Keamanan Data', desc: 'Akses berbasis peran dan enkripsi untuk menjaga privasi.', badge: 'Keamanan' },
    ],
    labels: {
      slidePrev: 'Slide sebelumnya',
      slideNext: 'Slide berikutnya',
      slideSelect: 'Pilih slide',
      servicesTag: 'Layanan',
      servicesTitle: 'Semua yang dibutuhkan tracer study',
      startSurvey: 'Mulai isi kuisioner ->',
      statsTag: 'Statistik Tracer Study',
      statsTitle: 'Dashboard mini',
      statsDesc: 'Ringkasan cepat respon tracer: pekerjaan, waktu tunggu, gaji, dan industri.',
      liveUpdate: 'Live update',
      jobsTag: 'Job Update',
      jobsTitle: 'Lowongan Kerja Terbaru',
      jobsDesc: 'Kurasi 5 lowongan terbaru untuk alumni dan mahasiswa.',
      jobsAll: 'Lihat Semua Lowongan',
      jobsDetail: 'Lihat lengkap',
      newsTag: 'Berita',
      newsTitle: 'Kabar terbaru tracer study',
      newsFollow: 'Ikuti pengumuman ->',
      noNews: 'Belum ada berita dipublikasikan. Tambahkan dari halaman admin untuk tampil di sini.',
      readMore: 'Baca selengkapnya ->',
      testimonialsTag: 'Testimoni',
      testimonialsTitle: 'Suara alumni',
      testimonialSelect: 'Pilih testimoni',
      articleTag: 'Artikel & Tips Karier',
      articleTitle: 'Baca panduan terbaru',
      articleDesc: '6 artikel singkat untuk bantu persiapan karier dan lowongan.',
      seeAllTips: 'Lihat semua tips',
      noArticles: 'Belum ada artikel dipublikasikan. Tambahkan dari halaman admin untuk tampil di sini.',
      articleDetail: 'Lihat rincian',
      close: 'Tutup',
      published: 'Dipublikasikan',
      draft: 'Draft',
      noExtraContent: 'Tidak ada konten tambahan.',
    },
  },
  en: {
    monthUnit: 'months',
    fallbackHero: {
      tag: 'Career Development Center',
      title: 'Welcome to Career Development Center',
      highlight: 'UIN Syekh Wasil Kediri',
      subtitle: 'CTA content can be configured from the admin panel.',
      chips: ['Tracer study', 'CDC portal', 'Industry partnerships'],
      primaryLabel: 'View services',
      secondaryLabel: 'Back to portal',
      statsLeft: 'Active programs',
      statsRight: 'Industry partners',
      statsRemark: 'Update CTA in admin to show latest content.',
      statsBadge: 'Live',
    },
    features: [
      { title: 'Fast Data Collection', desc: 'Send multi-channel questionnaires with automatic notifications.', badge: 'Realtime' },
      { title: 'Analytics and Reports', desc: 'Monitor response rates, career trends, and alumni distribution.', badge: 'Insight' },
      { title: 'Integration & Export', desc: 'Export to CSV/Excel or connect to your favorite BI tools.', badge: 'Optional' },
      { title: 'Data Security', desc: 'Role-based access and encryption to protect privacy.', badge: 'Security' },
    ],
    labels: {
      slidePrev: 'Previous slide',
      slideNext: 'Next slide',
      slideSelect: 'Select slide',
      servicesTag: 'Services',
      servicesTitle: 'Everything for tracer study',
      startSurvey: 'Start questionnaire ->',
      statsTag: 'Tracer Study Statistics',
      statsTitle: 'Mini dashboard',
      statsDesc: 'Quick summary of responses: employment, waiting period, salary, and industry.',
      liveUpdate: 'Live update',
      jobsTag: 'Job Update',
      jobsTitle: 'Latest Job Vacancies',
      jobsDesc: 'Curated latest vacancies for alumni and students.',
      jobsAll: 'View All Vacancies',
      jobsDetail: 'View details',
      newsTag: 'News',
      newsTitle: 'Latest tracer study news',
      newsFollow: 'Follow announcements ->',
      noNews: 'No published news yet. Add news from admin panel to display here.',
      readMore: 'Read more ->',
      testimonialsTag: 'Testimonials',
      testimonialsTitle: 'Alumni voices',
      testimonialSelect: 'Select testimonial',
      articleTag: 'Career Articles & Tips',
      articleTitle: 'Read latest guides',
      articleDesc: '6 short articles to support career and job preparation.',
      seeAllTips: 'View all tips',
      noArticles: 'No published articles yet. Add from admin panel to display here.',
      articleDetail: 'View details',
      close: 'Close',
      published: 'Published',
      draft: 'Draft',
      noExtraContent: 'No additional content.',
    },
  },
  ar: {
    monthUnit: 'شهر',
    fallbackHero: {
      tag: 'مركز التطوير المهني',
      title: 'مرحبا بكم في مركز التطوير المهني',
      highlight: 'UIN Syekh Wasil Kediri',
      subtitle: 'يمكن ضبط محتوى CTA من لوحة الإدارة.',
      chips: ['دراسة التتبع', 'بوابة CDC', 'شراكات صناعية'],
      primaryLabel: 'عرض الخدمات',
      secondaryLabel: 'العودة للبوابة',
      statsLeft: 'البرامج النشطة',
      statsRight: 'الشركاء الصناعيون',
      statsRemark: 'حدّث CTA من الإدارة لعرض أحدث المحتوى.',
      statsBadge: 'مباشر',
    },
    features: [
      { title: 'جمع بيانات سريع', desc: 'أرسل الاستبيانات عبر قنوات متعددة مع إشعارات تلقائية.', badge: 'فوري' },
      { title: 'التحليلات والتقارير', desc: 'تابع معدل الاستجابة واتجاهات المسار المهني وانتشار الخريجين.', badge: 'رؤى' },
      { title: 'التكامل والتصدير', desc: 'تصدير إلى CSV/Excel أو الربط مع أدوات BI المفضلة.', badge: 'اختياري' },
      { title: 'أمن البيانات', desc: 'صلاحيات حسب الدور وتشفير لحماية الخصوصية.', badge: 'أمان' },
    ],
    labels: {
      slidePrev: 'الشريحة السابقة',
      slideNext: 'الشريحة التالية',
      slideSelect: 'اختر الشريحة',
      servicesTag: 'الخدمات',
      servicesTitle: 'كل ما تحتاجه دراسة التتبع',
      startSurvey: 'ابدأ الاستبيان ->',
      statsTag: 'إحصاءات دراسة التتبع',
      statsTitle: 'لوحة مصغرة',
      statsDesc: 'ملخص سريع للاستجابات: التوظيف، مدة الانتظار، الراتب، والقطاع.',
      liveUpdate: 'تحديث مباشر',
      jobsTag: 'تحديث الوظائف',
      jobsTitle: 'أحدث الوظائف',
      jobsDesc: 'مختارات من أحدث الوظائف للخريجين والطلبة.',
      jobsAll: 'عرض كل الوظائف',
      jobsDetail: 'عرض التفاصيل',
      newsTag: 'الأخبار',
      newsTitle: 'آخر أخبار دراسة التتبع',
      newsFollow: 'تابع الإعلانات ->',
      noNews: 'لا توجد أخبار منشورة حاليا. أضف أخبارا من لوحة الإدارة لعرضها هنا.',
      readMore: 'قراءة المزيد ->',
      testimonialsTag: 'الشهادات',
      testimonialsTitle: 'آراء الخريجين',
      testimonialSelect: 'اختر شهادة',
      articleTag: 'مقالات ونصائح مهنية',
      articleTitle: 'اقرأ أحدث الأدلة',
      articleDesc: '6 مقالات قصيرة لدعم التحضير المهني والوظيفي.',
      seeAllTips: 'عرض كل النصائح',
      noArticles: 'لا توجد مقالات منشورة حاليا. أضف من الإدارة لعرضها هنا.',
      articleDetail: 'عرض التفاصيل',
      close: 'إغلاق',
      published: 'منشور',
      draft: 'مسودة',
      noExtraContent: 'لا يوجد محتوى إضافي.',
    },
  },
}

const homeCopy = computed(() => homeCopyByLocale[locale.value] || homeCopyByLocale.id)

const homeExtraCopyByLocale = {
  id: {
    salaryPrefix: 'Rp',
    salarySuffix: 'jt',
    defaultStats: {
      topIndustryLabel: 'Teknologi & Startup',
      topIndustryPercent: 34,
      industries: ['Teknologi & Startup', 'Pendidikan', 'Keuangan', 'Pemerintahan/LSM', 'Lainnya'],
    },
    labels: {
      heroAria: 'Slider hero',
      responseIn: 'Respon masuk',
      target: 'Target',
      employedRate: 'Persentase lulusan bekerja',
      employedDesc: 'Telah terserap dalam 12 bulan setelah lulus.',
      waitTime: 'Lama tunggu kerja',
      waitTimeDesc: 'Median waktu sampai pekerjaan pertama.',
      salaryRange: 'Rentang gaji rata-rata',
      salaryRangeDesc: 'Gaji awal lulusan (P25 - P75).',
      topIndustry: 'Industri utama',
      topIndustryDesc: 'Bidang yang paling banyak menyerap lulusan.',
      industryChartTitle: 'Industri penyerap lulusan',
      miniChart: 'Mini chart',
      jobLocationChip: 'Lok',
      jobDeadlineChip: 'DL',
      jobDeadline: 'Deadline',
      jobDetailTitle: 'Rincian Lowongan',
      location: 'Lokasi',
      mode: 'Mode',
      positionSummary: 'Ringkasan Posisi',
      compensationBenefits: 'Kompensasi & Benefit',
      responsibilities: 'Tanggung Jawab Utama',
      qualifications: 'Kualifikasi & Persyaratan',
      education: 'Pendidikan',
      experience: 'Pengalaman',
      skills: 'Keterampilan',
      otherCriteria: 'Kriteria lain',
      jobDetails: 'Detail Pekerjaan',
      jobType: 'Jenis Pekerjaan',
      applyMethod: 'Cara Melamar',
      articleModalTag: 'Artikel & Tips',
    },
    partners: {
      tag: 'Mitra Industri',
      title: 'Didukung berbagai sektor',
      description:
        'Alumni dan tracer study terhubung dengan jaringan mitra dari perusahaan nasional hingga instansi pendidikan.',
      cards: [
        { code: 'PN', title: 'Perusahaan nasional', desc: 'Manufaktur, logistik, energi' },
        { code: 'BF', title: 'Perbankan & keuangan', desc: 'Bank, fintech, asuransi' },
        { code: 'SD', title: 'Startup digital', desc: 'Produk teknologi & SaaS' },
        { code: 'IP', title: 'Instansi pemerintah', desc: 'Kementerian & lembaga' },
        { code: 'LP', title: 'Lembaga pendidikan', desc: 'Sekolah, kampus, LKP' },
      ],
    },
    testimonials: [
      {
        name: 'Alya Putri Ramadhani',
        role: 'Alumni Akuntansi 2022',
        quote:
          'Proses isi kuisioner CDC cepat dan jelas. Saya langsung dapat informasi lowongan sesuai minat dan dibantu review CV.',
        avatar: 'https://ui-avatars.com/api/?name=Alya+Putri&background=6366f1&color=fff',
      },
      {
        name: 'Rama Hidayat',
        role: 'Alumni Teknik Informatika 2021',
        quote:
          'Reminder otomatisnya memudahkan, dan tim CDC sigap saat saya tanya soal magang ke mitra industri.',
        avatar: 'https://ui-avatars.com/api/?name=Rama+Hidayat&background=22d3ee&color=fff',
      },
      {
        name: 'Siti Maharani',
        role: 'Alumni Pendidikan Bahasa 2020',
        quote:
          'Setelah isi kuisioner, saya dihubungi CDC untuk coaching karier. Saya jadi yakin saat melamar ke mitra kampus.',
        avatar: 'https://ui-avatars.com/api/?name=Siti+Maharani&background=8b5cf6&color=fff',
      },
      {
        name: 'Arif Kurniawan',
        role: 'Alumni Manajemen 2019',
        quote:
          'CDC membantu koneksi ke mitra industri. Lowongan yang saya terima relevan dan prosesnya transparan.',
        avatar: 'https://ui-avatars.com/api/?name=Arif+Kurniawan&background=10b981&color=fff',
      },
      {
        name: 'Nadia Azzahra',
        role: 'Alumni Psikologi 2023',
        quote:
          'Selesai isi kuisioner, saya dapat undangan webinar karier dan sesi coaching. Sangat suportif untuk fresh graduate.',
        avatar: 'https://ui-avatars.com/api/?name=Nadia+Azzahra&background=f59e0b&color=fff',
      },
    ],
  },
  en: {
    salaryPrefix: 'IDR ',
    salarySuffix: 'million',
    defaultStats: {
      topIndustryLabel: 'Technology & Startups',
      topIndustryPercent: 34,
      industries: ['Technology & Startups', 'Education', 'Finance', 'Government/NGO', 'Others'],
    },
    labels: {
      heroAria: 'Hero slider',
      responseIn: 'Incoming responses',
      target: 'Target',
      employedRate: 'Graduate employment rate',
      employedDesc: 'Graduates absorbed within 12 months after graduation.',
      waitTime: 'Job waiting time',
      waitTimeDesc: 'Median time to first job.',
      salaryRange: 'Average salary range',
      salaryRangeDesc: 'Graduate starting salary (P25 - P75).',
      topIndustry: 'Top industry',
      topIndustryDesc: 'Sector that absorbs the most graduates.',
      industryChartTitle: 'Graduate absorbing industries',
      miniChart: 'Mini chart',
      jobLocationChip: 'Loc',
      jobDeadlineChip: 'Due',
      jobDeadline: 'Deadline',
      jobDetailTitle: 'Vacancy Details',
      location: 'Location',
      mode: 'Mode',
      positionSummary: 'Role Summary',
      compensationBenefits: 'Compensation & Benefits',
      responsibilities: 'Main Responsibilities',
      qualifications: 'Qualifications & Requirements',
      education: 'Education',
      experience: 'Experience',
      skills: 'Skills',
      otherCriteria: 'Other criteria',
      jobDetails: 'Job Details',
      jobType: 'Job Type',
      applyMethod: 'How to Apply',
      articleModalTag: 'Article & Tips',
    },
    partners: {
      tag: 'Industry Partners',
      title: 'Supported by multiple sectors',
      description:
        'Alumni and tracer study are connected with partner networks from national companies to educational institutions.',
      cards: [
        { code: 'PN', title: 'National companies', desc: 'Manufacturing, logistics, energy' },
        { code: 'BF', title: 'Banking & finance', desc: 'Banks, fintech, insurance' },
        { code: 'SD', title: 'Digital startups', desc: 'Technology products & SaaS' },
        { code: 'IP', title: 'Government agencies', desc: 'Ministries & institutions' },
        {
          code: 'LP',
          title: 'Educational institutions',
          desc: 'Schools, universities, training centers',
        },
      ],
    },
    testimonials: [
      {
        name: 'Alya Putri Ramadhani',
        role: 'Accounting Alumni 2022',
        quote:
          'The CDC questionnaire process is fast and clear. I quickly received relevant vacancy updates and CV review support.',
        avatar: 'https://ui-avatars.com/api/?name=Alya+Putri&background=6366f1&color=fff',
      },
      {
        name: 'Rama Hidayat',
        role: 'Informatics Alumni 2021',
        quote:
          'Automatic reminders help a lot, and the CDC team is responsive whenever I ask about internship opportunities.',
        avatar: 'https://ui-avatars.com/api/?name=Rama+Hidayat&background=22d3ee&color=fff',
      },
      {
        name: 'Siti Maharani',
        role: 'Language Education Alumni 2020',
        quote:
          'After submitting the questionnaire, CDC invited me to career coaching. It increased my confidence when applying to partner institutions.',
        avatar: 'https://ui-avatars.com/api/?name=Siti+Maharani&background=8b5cf6&color=fff',
      },
      {
        name: 'Arif Kurniawan',
        role: 'Management Alumni 2019',
        quote:
          'CDC helped me connect with industry partners. The vacancies I received were relevant and the process was transparent.',
        avatar: 'https://ui-avatars.com/api/?name=Arif+Kurniawan&background=10b981&color=fff',
      },
      {
        name: 'Nadia Azzahra',
        role: 'Psychology Alumni 2023',
        quote:
          'After finishing the questionnaire, I received invitations to career webinars and coaching sessions. Very supportive for fresh graduates.',
        avatar: 'https://ui-avatars.com/api/?name=Nadia+Azzahra&background=f59e0b&color=fff',
      },
    ],
  },
  ar: {
    salaryPrefix: 'ر.إ ',
    salarySuffix: 'مليون',
    defaultStats: {
      topIndustryLabel: 'التقنية والشركات الناشئة',
      topIndustryPercent: 34,
      industries: ['التقنية والشركات الناشئة', 'التعليم', 'التمويل', 'الحكومة/المنظمات', 'أخرى'],
    },
    labels: {
      heroAria: 'شريط البطل',
      responseIn: 'الردود الواردة',
      target: 'الهدف',
      employedRate: 'نسبة توظيف الخريجين',
      employedDesc: 'تم توظيف الخريجين خلال 12 شهرًا بعد التخرج.',
      waitTime: 'مدة انتظار الوظيفة',
      waitTimeDesc: 'متوسط الوقت للوصول إلى أول وظيفة.',
      salaryRange: 'متوسط نطاق الراتب',
      salaryRangeDesc: 'راتب البداية للخريجين (P25 - P75).',
      topIndustry: 'القطاع الأبرز',
      topIndustryDesc: 'القطاع الأكثر استيعابًا للخريجين.',
      industryChartTitle: 'قطاعات استيعاب الخريجين',
      miniChart: 'مخطط مصغر',
      jobLocationChip: 'موقع',
      jobDeadlineChip: 'موعد',
      jobDeadline: 'الموعد النهائي',
      jobDetailTitle: 'تفاصيل الوظيفة',
      location: 'الموقع',
      mode: 'النمط',
      positionSummary: 'ملخص الدور',
      compensationBenefits: 'التعويضات والمزايا',
      responsibilities: 'المسؤوليات الرئيسية',
      qualifications: 'المؤهلات والمتطلبات',
      education: 'التعليم',
      experience: 'الخبرة',
      skills: 'المهارات',
      otherCriteria: 'معايير أخرى',
      jobDetails: 'تفاصيل العمل',
      jobType: 'نوع الوظيفة',
      applyMethod: 'طريقة التقديم',
      articleModalTag: 'مقالة ونصائح',
    },
    partners: {
      tag: 'الشركاء الصناعيون',
      title: 'مدعوم من قطاعات متعددة',
      description:
        'يرتبط الخريجون ودراسة التتبع بشبكة شركاء من الشركات الوطنية حتى المؤسسات التعليمية.',
      cards: [
        { code: 'PN', title: 'شركات وطنية', desc: 'تصنيع، لوجستيات، طاقة' },
        { code: 'BF', title: 'مصارف وتمويل', desc: 'بنوك، فينتك، تأمين' },
        { code: 'SD', title: 'شركات رقمية ناشئة', desc: 'منتجات تقنية وSaaS' },
        { code: 'IP', title: 'جهات حكومية', desc: 'وزارات ومؤسسات' },
        { code: 'LP', title: 'مؤسسات تعليمية', desc: 'مدارس، جامعات، مراكز تدريب' },
      ],
    },
    testimonials: [
      {
        name: 'Alya Putri Ramadhani',
        role: 'خريجة المحاسبة 2022',
        quote:
          'عملية تعبئة استبيان CDC سريعة وواضحة. حصلت فورًا على فرص مناسبة وتم دعم سيرتي الذاتية.',
        avatar: 'https://ui-avatars.com/api/?name=Alya+Putri&background=6366f1&color=fff',
      },
      {
        name: 'Rama Hidayat',
        role: 'خريج تقنية المعلومات 2021',
        quote:
          'التذكير التلقائي مفيد جدًا، وفريق CDC سريع الاستجابة عندما أسأل عن فرص التدريب مع الشركاء.',
        avatar: 'https://ui-avatars.com/api/?name=Rama+Hidayat&background=22d3ee&color=fff',
      },
      {
        name: 'Siti Maharani',
        role: 'خريجة تعليم اللغة 2020',
        quote:
          'بعد تعبئة الاستبيان تواصل معي CDC لجلسات إرشاد مهني، مما زاد ثقتي عند التقديم على فرص الشركاء.',
        avatar: 'https://ui-avatars.com/api/?name=Siti+Maharani&background=8b5cf6&color=fff',
      },
      {
        name: 'Arif Kurniawan',
        role: 'خريج الإدارة 2019',
        quote:
          'ساعدني CDC على التواصل مع شركاء الصناعة. الفرص التي وصلتني كانت مناسبة والإجراءات واضحة.',
        avatar: 'https://ui-avatars.com/api/?name=Arif+Kurniawan&background=10b981&color=fff',
      },
      {
        name: 'Nadia Azzahra',
        role: 'خريجة علم النفس 2023',
        quote:
          'بعد الانتهاء من الاستبيان تلقيت دعوات لندوات وجلسات تدريب مهني. دعم ممتاز للخريجين الجدد.',
        avatar: 'https://ui-avatars.com/api/?name=Nadia+Azzahra&background=f59e0b&color=fff',
      },
    ],
  },
}

const homeExtraCopy = computed(() => homeExtraCopyByLocale[locale.value] || homeExtraCopyByLocale.id)

const contentLocales = ['id', 'en', 'ar']
const activeContentLocale = computed(() =>
  contentLocales.includes(locale.value) ? locale.value : 'id',
)

const runtimeTranslateEnabled =
  String(import.meta.env.VITE_ENABLE_RUNTIME_TRANSLATE || 'false').trim().toLowerCase() === 'true'
const runtimeTranslationCache = ref({})
const runtimeTranslationInFlight = new Set()

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const toText = (value) => (value === null || value === undefined ? '' : String(value).trim())
const containsLatinLetters = (value) => /[A-Za-z\u00C0-\u024F]/.test(String(value || ''))
const toUpperLocale = (value) => String(value || '').toUpperCase()

const getPathValue = (source, path) => {
  if (!source || !path) return undefined
  return String(path)
    .split('.')
    .reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), source)
}

const getLocalizedPathCandidates = (path, localeCode) => {
  const cleanPath = String(path || '').trim()
  if (!cleanPath) return []
  const parts = cleanPath.split('.')
  const leaf = parts[parts.length - 1]
  const parent = parts.slice(0, -1)
  const localeCap = localeCode.charAt(0).toUpperCase() + localeCode.slice(1)
  const leafSnake = `${leaf}_${localeCode}`
  const leafCamel = `${leaf}${localeCap}`

  if (!parent.length) {
    return [leafSnake, leafCamel]
  }

  const parentPath = parent.join('.')
  const nestedPath = `${parentPath}.${leaf}`
  return [`${parentPath}.${leafSnake}`, `${parentPath}.${leafCamel}`, `${nestedPath}_${localeCode}`]
}

const getFromTranslationBucket = (source, path, localeCode) => {
  const translations = source?.translations
  if (!isPlainObject(translations)) return null

  const bucket = translations[localeCode] || translations[toUpperLocale(localeCode)]
  const flatPath = String(path || '').replace(/\./g, '_')
  if (isPlainObject(bucket)) {
    const nested = getPathValue(bucket, path)
    if (nested !== undefined && nested !== null && nested !== '') return nested
    const flat = bucket[flatPath]
    if (flat !== undefined && flat !== null && flat !== '') return flat
  }

  const byField = translations[path] || translations[flatPath]
  if (isPlainObject(byField)) {
    const scoped = byField[localeCode] || byField[toUpperLocale(localeCode)]
    if (scoped !== undefined && scoped !== null && scoped !== '') return scoped
  }

  return null
}

const resolveLocaleValue = (source, path, localeCode) => {
  if (!source || !path) return null

  const direct = getPathValue(source, path)
  if (isPlainObject(direct)) {
    const localized = direct[localeCode] ?? direct[toUpperLocale(localeCode)]
    if (localized !== undefined && localized !== null && localized !== '') return localized
  }

  const candidatePaths = getLocalizedPathCandidates(path, localeCode)
  for (const candidatePath of candidatePaths) {
    const value = getPathValue(source, candidatePath)
    if (value !== undefined && value !== null && value !== '') return value
  }

  const bucketValue = getFromTranslationBucket(source, path, localeCode)
  if (bucketValue !== null && bucketValue !== undefined && bucketValue !== '') return bucketValue

  return null
}

const decodeHtmlEntities = (value) =>
  String(value || '')
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCharCode(Number(decimal)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')

const splitForTranslation = (value, maxLength = 800) => {
  const text = String(value || '')
  if (!text) return []
  if (text.length <= maxLength) return [text]

  const chunks = []
  let start = 0

  while (start < text.length) {
    let end = Math.min(text.length, start + maxLength)
    if (end < text.length) {
      const part = text.slice(start, end)
      const breakAt = Math.max(part.lastIndexOf('\n'), part.lastIndexOf('. '), part.lastIndexOf(', '))
      if (breakAt > Math.floor(maxLength * 0.45)) {
        end = start + breakAt + 1
      }
    }
    chunks.push(text.slice(start, end))
    start = end
  }

  return chunks
}

const hashText = (value) => {
  let hash = 0
  const input = String(value || '')
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}

const translateChunk = async (text, targetLocale) => {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'auto',
    tl: targetLocale,
    dt: 't',
    q: text,
  })

  const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`)
  if (!response.ok) throw new Error('Failed to translate text')

  const payload = await response.json()
  const translated = Array.isArray(payload?.[0]) ? payload[0].map((segment) => segment?.[0] || '').join('') : ''
  return decodeHtmlEntities(translated).trim()
}

const translateTextRuntime = async (text, targetLocale) => {
  const chunks = splitForTranslation(text)
  if (!chunks.length) return ''

  const translatedChunks = []
  for (const chunk of chunks) {
    if (!toText(chunk)) {
      translatedChunks.push(chunk)
      continue
    }
    const translated = await translateChunk(chunk, targetLocale)
    translatedChunks.push(translated || chunk)
  }

  return translatedChunks.join('').trim()
}

const getRuntimeTranslation = (text, targetLocale) => {
  const clean = toText(text)
  if (!clean) return ''
  if (!runtimeTranslateEnabled || targetLocale === 'id' || !containsLatinLetters(clean)) return clean

  const cacheKey = `${targetLocale}:${clean.length}:${hashText(clean)}`
  const cached = runtimeTranslationCache.value[cacheKey]
  if (cached) return cached

  if (!runtimeTranslationInFlight.has(cacheKey)) {
    runtimeTranslationInFlight.add(cacheKey)
    translateTextRuntime(clean, targetLocale)
      .then((translated) => {
        runtimeTranslationCache.value[cacheKey] = toText(translated) || clean
      })
      .catch(() => {
        runtimeTranslationCache.value[cacheKey] = clean
      })
      .finally(() => {
        runtimeTranslationInFlight.delete(cacheKey)
      })
  }

  return clean
}

const normalizeTextArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => toText(entry)).filter(Boolean)
  }

  const text = toText(value)
  if (!text) return []

  if (text.includes('\n')) {
    return text
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  if (text.includes(',')) {
    return text
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  return [text]
}

const resolveLocalizedString = (source, path) => {
  const targetLocale = activeContentLocale.value
  const localized = toText(resolveLocaleValue(source, path, targetLocale))
  if (localized) return localized

  const base = toText(resolveLocaleValue(source, path, 'id') ?? getPathValue(source, path))
  if (!base) return ''
  if (targetLocale === 'id') return base

  return getRuntimeTranslation(base, targetLocale)
}

const resolveLocalizedArray = (source, path) => {
  const targetLocale = activeContentLocale.value
  const localized = normalizeTextArray(resolveLocaleValue(source, path, targetLocale))
  if (localized.length) return localized

  const base = normalizeTextArray(resolveLocaleValue(source, path, 'id') ?? getPathValue(source, path))
  if (targetLocale === 'id') return base

  return base
    .map((entry) => getRuntimeTranslation(entry, targetLocale))
    .filter(Boolean)
}

const resolvePublishedStatus = (value) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return ['1', 'true', 'publish', 'published', 'aktif', 'active'].includes(normalized)
  }
  return !!value
}

const resolveSummary = (source) => {
  const summary = resolveLocalizedString(source, 'summary')
  if (summary) return summary

  const content = resolveLocalizedString(source, 'content')
  if (!content) return ''
  return content.length > 160 ? `${content.slice(0, 157)}...` : content
}

const mapLocalizedHeroSlide = (item, index) => ({
  ...item,
  id: item?.id || `slide-${index}`,
  tag: resolveLocalizedString(item, 'tag'),
  title: resolveLocalizedString(item, 'title'),
  highlight: resolveLocalizedString(item, 'highlight'),
  subtitle: resolveLocalizedString(item, 'subtitle'),
  chips: resolveLocalizedArray(item, 'chips'),
  primary: {
    ...item?.primary,
    label: resolveLocalizedString(item, 'primary.label') || homeCopy.value.fallbackHero.primaryLabel,
    to: toText(item?.primary?.to) || '/',
  },
  secondary: {
    ...item?.secondary,
    label: resolveLocalizedString(item, 'secondary.label') || homeCopy.value.fallbackHero.secondaryLabel,
    to: toText(item?.secondary?.to) || '/',
  },
  stats: {
    ...item?.stats,
    labelLeft: resolveLocalizedString(item, 'stats.labelLeft') || homeCopy.value.fallbackHero.statsLeft,
    valueLeft: resolveLocalizedString(item, 'stats.valueLeft') || '-',
    labelRight: resolveLocalizedString(item, 'stats.labelRight') || homeCopy.value.fallbackHero.statsRight,
    valueRight: resolveLocalizedString(item, 'stats.valueRight') || '-',
    progress: Number.isFinite(Number(item?.stats?.progress)) ? Number(item.stats.progress) : 0,
    remark: resolveLocalizedString(item, 'stats.remark'),
    badge: resolveLocalizedString(item, 'stats.badge') || homeCopy.value.fallbackHero.statsBadge,
  },
})

const mapLocalizedJob = (item, options = {}) => {
  const detailed = options?.detailed === true
  return {
    ...item,
    title: resolveLocalizedString(item, 'title'),
    company: resolveLocalizedString(item, 'company'),
    companyProfile: detailed ? resolveLocalizedString(item, 'companyProfile') : toText(item?.companyProfile),
    location: resolveLocalizedString(item, 'location'),
    workMode: resolveLocalizedString(item, 'workMode'),
    jobType: resolveLocalizedString(item, 'jobType'),
    summary: detailed ? resolveLocalizedString(item, 'summary') : toText(item?.summary),
    deadline: toText(item?.deadline),
    compensation: detailed ? resolveLocalizedString(item, 'compensation') : '',
    benefits: detailed ? resolveLocalizedArray(item, 'benefits') : [],
    responsibilities: detailed ? resolveLocalizedArray(item, 'responsibilities') : [],
    qualifications: {
      education: detailed ? resolveLocalizedString(item, 'qualifications.education') : '',
      experience: detailed ? resolveLocalizedString(item, 'qualifications.experience') : '',
      skills: detailed ? resolveLocalizedArray(item, 'qualifications.skills') : [],
      other: detailed ? resolveLocalizedArray(item, 'qualifications.other') : [],
    },
    apply: detailed ? resolveLocalizedString(item, 'apply') : '',
  }
}

const mapLocalizedNews = (item, options = {}) => {
  const detailed = options?.detailed === true
  return {
    ...item,
    title: resolveLocalizedString(item, 'title'),
    summary: resolveSummary(item),
    content: detailed ? resolveLocalizedString(item, 'content') : toText(item?.content),
    imageUrl: toText(item?.imageUrl || item?.image_url),
    createdAt: item?.createdAt || item?.created_at || item?.date || '',
    published: resolvePublishedStatus(item?.published),
  }
}

const mapLocalizedArticle = (item, options = {}) => {
  const detailed = options?.detailed === true
  return {
    ...item,
    title: resolveLocalizedString(item, 'title'),
    summary: resolveSummary(item),
    content: detailed ? resolveLocalizedString(item, 'content') : toText(item?.content),
    imageUrl: toText(item?.imageUrl || item?.image_url),
    createdAt: item?.createdAt || item?.created_at || item?.date || '',
    published: resolvePublishedStatus(item?.published),
  }
}

const heroSlides = computed(() => slides.value.map((item, index) => mapLocalizedHeroSlide(item, index)))
const fallbackHero = computed(() => ({
  tag: homeCopy.value.fallbackHero.tag,
  title: homeCopy.value.fallbackHero.title,
  highlight: homeCopy.value.fallbackHero.highlight,
  subtitle: homeCopy.value.fallbackHero.subtitle,
  chips: homeCopy.value.fallbackHero.chips,
  primary: { label: homeCopy.value.fallbackHero.primaryLabel, to: '/layanan' },
  secondary: { label: homeCopy.value.fallbackHero.secondaryLabel, to: '/' },
  stats: {
    labelLeft: homeCopy.value.fallbackHero.statsLeft,
    valueLeft: '-',
    labelRight: homeCopy.value.fallbackHero.statsRight,
    valueRight: '-',
    progress: 0,
    remark: homeCopy.value.fallbackHero.statsRemark,
    badge: homeCopy.value.fallbackHero.statsBadge,
  },
}))
const activeHeroIndex = ref(0)
const activeHero = computed(() => {
  if (!heroSlides.value.length) return fallbackHero.value
  const index = Math.min(activeHeroIndex.value, heroSlides.value.length - 1)
  return heroSlides.value[index] || fallbackHero.value
})

watch(
  heroSlides,
  (items) => {
    if (!items.length) return
    if (activeHeroIndex.value >= items.length) {
      activeHeroIndex.value = 0
    }
  },
  { immediate: true },
)

const goNextHero = () => {
  if (!heroSlides.value.length) return
  activeHeroIndex.value = (activeHeroIndex.value + 1) % heroSlides.value.length
}
const goPrevHero = () => {
  if (!heroSlides.value.length) return
  activeHeroIndex.value =
    activeHeroIndex.value === 0 ? heroSlides.value.length - 1 : activeHeroIndex.value - 1
}
const goToHero = (index) => {
  if (index >= 0 && index < heroSlides.value.length) activeHeroIndex.value = index
}

const { submissions, fetchSubmissions } = useSubmissions()
const { fetchActiveQuestionnaire } = useQuestionnaires()
const { jobs, fetchJobs } = useJobs()
const { news, fetchNews } = useNews()
const { articles, fetchArticles } = useArticles()

const industryPalette = [
  { colorFrom: 'from-indigo-500', colorTo: 'to-sky-500' },
  { colorFrom: 'from-emerald-500', colorTo: 'to-teal-500' },
  { colorFrom: 'from-amber-400', colorTo: 'to-orange-400' },
  { colorFrom: 'from-slate-500', colorTo: 'to-slate-600' },
  { colorFrom: 'from-fuchsia-500', colorTo: 'to-purple-500' },
]

const defaultTracerStats = computed(() => ({
  employedPercent: 76,
  waitMonths: 2.8,
  salaryMin: 4.5,
  salaryMax: 7.2,
  topIndustryLabel: homeExtraCopy.value.defaultStats.topIndustryLabel,
  topIndustryPercent: homeExtraCopy.value.defaultStats.topIndustryPercent,
  industries: homeExtraCopy.value.defaultStats.industries.map((label, index) => ({
    label,
    value: [34, 22, 18, 12, 14][index] ?? 0,
    ...industryPalette[index % industryPalette.length],
  })),
}))

const parseMonths = (value) => {
  if (value === null || value === undefined) return null
  const num = Number(String(value).replace(',', '.'))
  if (!Number.isFinite(num) || num <= 0) return null
  return num
}

const formatMonths = (months) => {
  if (months === null || months === undefined) return '-'
  const rounded = Number.isInteger(months) ? months.toString() : months.toFixed(1).replace('.0', '')
  return `${rounded} ${homeCopy.value.monthUnit}`
}

const parseSalaryToJt = (value) => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return null
    return value >= 1000000 ? value / 1000000 : value
  }
  const raw = String(value).trim()
  if (!raw) return null
  const digits = raw.replace(/[^0-9]/g, '')
  if (!digits) return null
  let numeric = null
  if (digits.length <= 3 && /[.,]/.test(raw)) {
    const candidate = Number(raw.replace(/[^0-9.,]/g, '').replace(',', '.'))
    if (Number.isFinite(candidate)) numeric = candidate
  }
  if (numeric === null) {
    numeric = Number(digits)
  }
  if (!Number.isFinite(numeric) || numeric <= 0) return null
  return numeric >= 1000000 ? numeric / 1000000 : numeric
}

const formatSalaryValue = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10
  const digits = new Intl.NumberFormat(localeDate.value, {
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(rounded)
  return `${homeExtraCopy.value.salaryPrefix}${digits} ${homeExtraCopy.value.salarySuffix}`
}

const formatSalaryRange = (min, max) => {
  if (min === null && max === null) return '-'
  if (min === null) return formatSalaryValue(max)
  if (max === null) return formatSalaryValue(min)
  if (Math.abs(max - min) < 0.1) return formatSalaryValue(min)
  return `${formatSalaryValue(min)} - ${formatSalaryValue(max)}`
}

const getFormData = (item) =>
  item?.form_data ||
  item?.formData ||
  item?.raw?.form_data ||
  item?.raw?.formData ||
  item?.raw?.form_data ||
  {}

const findAnswerByKeywords = (item, keywords = []) => {
  const answers = item?.answers || item?.raw?.answers || []
  if (!Array.isArray(answers)) return null
  const lowered = keywords.map((kw) => String(kw).toLowerCase())
  const match = answers.find((answer) => {
    const questionText =
      typeof answer?.question === 'object'
        ? String(answer?.question?.pertanyaan || answer?.question?.label || '')
        : String(answer?.question || '')
    const haystack = questionText.toLowerCase()
    return lowered.some((kw) => haystack.includes(kw))
  })
  return match ? match.jawaban : null
}

const extractStatus = (item) => {
  const form = getFormData(item)
  const raw =
    item?.status ||
    form.status ||
    item?.raw?.status ||
    findAnswerByKeywords(item, ['status'])
  return String(raw || '').trim().toLowerCase()
}

const extractWaitMonths = (item) => {
  const form = getFormData(item)
  const raw =
    item?.waitMonths ||
    form.bekerja_bulanDapat ||
    form.bekerja_bulanTidak ||
    form.mencari_mulaiSetelah ||
    form.mencari_mulaiSebelum ||
    item?.bekerja_bulanDapat ||
    item?.bekerja_bulanTidak ||
    item?.mencari_mulaiSetelah ||
    item?.mencari_mulaiSebelum ||
    findAnswerByKeywords(item, ['bulan', 'waktu tunggu', 'lama menunggu'])
  return parseMonths(raw)
}

const extractSalary = (item) => {
  const form = getFormData(item)
  const raw =
    item?.salary ||
    form.bekerja_pendapatan ||
    item?.bekerja_pendapatan ||
    item?.raw?.bekerja_pendapatan ||
    findAnswerByKeywords(item, ['pendapatan', 'gaji', 'penghasilan'])
  return parseSalaryToJt(raw)
}

const extractIndustry = (item) => {
  const form = getFormData(item)
  const raw =
    item?.industry ||
    form.bekerja_jenisPerusahaan ||
    form.wira_jenisPerusahaan ||
    form.wira_bidang ||
    item?.bekerja_jenisPerusahaan ||
    item?.wira_jenisPerusahaan ||
    item?.wira_bidang ||
    findAnswerByKeywords(item, ['jenis perusahaan', 'bidang usaha', 'industri', 'perusahaan'])
  return String(raw || '').trim()
}

const alumniResponses = computed(() => {
  const list = Array.isArray(submissions.items) ? submissions.items : []
  return list.filter((item) => {
    const type = String(item?.type || item?.audience || item?.targetAudience || '').trim().toLowerCase()
    return !type || type === 'alumni'
  })
})

const percentile = (values, percent) => {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const idx = (sorted.length - 1) * percent
  const lower = Math.floor(idx)
  const upper = Math.ceil(idx)
  if (lower === upper) return sorted[lower]
  const weight = idx - lower
  return sorted[lower] + (sorted[upper] - sorted[lower]) * weight
}

const buildIndustryList = (items = [], total = 0) => {
  const bucket = new Map()
  items.forEach((label) => {
    if (!label) return
    const key = label.toLowerCase()
    const current = bucket.get(key) || { label, count: 0 }
    current.count += 1
    bucket.set(key, current)
  })
  const sorted = Array.from(bucket.values()).sort((a, b) => b.count - a.count).slice(0, 5)
  if (!sorted.length) return defaultTracerStats.value.industries
  return sorted.map((item, index) => ({
    label: item.label,
    value: total ? Math.round((item.count / total) * 100) : 0,
    ...industryPalette[index % industryPalette.length],
  }))
}

const getDotClass = (colorFrom) => {
  if (!colorFrom) return 'bg-slate-400'
  return colorFrom.replace('from-', 'bg-')
}

const tracerSummary = computed(() => {
  const records = alumniResponses.value
  const total = records.length
  if (!total) return { ...defaultTracerStats.value }

  const statusList = records.map(extractStatus)
  const employedCount = statusList.filter((status) =>
    ['bekerja', 'wira', 'wiraswasta'].some((keyword) => status.includes(keyword)),
  ).length

  const waitMonthsList = records
    .map(extractWaitMonths)
    .filter((val) => val !== null && val !== undefined)
  const salaryList = records
    .map(extractSalary)
    .filter((val) => val !== null && val !== undefined)
  const industryList = records.map(extractIndustry).filter(Boolean)

  const employedPercent = (employedCount / total) * 100
  const waitMonths = percentile(waitMonthsList, 0.5) ?? defaultTracerStats.value.waitMonths
  const salaryMin = percentile(salaryList, 0.25) ?? defaultTracerStats.value.salaryMin
  const salaryMax = percentile(salaryList, 0.75) ?? defaultTracerStats.value.salaryMax
  const industries = buildIndustryList(industryList, total)
  const topIndustryLabel = industries[0]?.label || defaultTracerStats.value.topIndustryLabel
  const topIndustryPercent = industries[0]?.value ?? defaultTracerStats.value.topIndustryPercent

  return {
    employedPercent,
    waitMonths,
    salaryMin,
    salaryMax,
    topIndustryLabel,
    topIndustryPercent,
    industries,
  }
})

const animatedStats = ref({
  employedPercent: 0,
  waitMonths: 0,
  salaryMin: 0,
  salaryMax: 0,
})
const miniChartAnimated = ref(false)
const miniDashboardSectionRef = ref(null)
const miniDashboardVisible = ref(false)
let miniStatsFrame = null
let miniDashboardObserver = null

const animateMiniStats = (target) => {
  if (!target) return
  if (miniStatsFrame) cancelAnimationFrame(miniStatsFrame)
  const start = { ...animatedStats.value }
  const end = {
    employedPercent: Number.isFinite(target.employedPercent) ? target.employedPercent : 0,
    waitMonths: Number.isFinite(target.waitMonths) ? target.waitMonths : 0,
    salaryMin: Number.isFinite(target.salaryMin) ? target.salaryMin : 0,
    salaryMax: Number.isFinite(target.salaryMax) ? target.salaryMax : 0,
  }
  const duration = 900
  const startTime = performance.now()
  const step = (now) => {
    const progress = Math.min(1, (now - startTime) / duration)
    const ease = 1 - Math.pow(1 - progress, 3)
    animatedStats.value = {
      employedPercent: start.employedPercent + (end.employedPercent - start.employedPercent) * ease,
      waitMonths: start.waitMonths + (end.waitMonths - start.waitMonths) * ease,
      salaryMin: start.salaryMin + (end.salaryMin - start.salaryMin) * ease,
      salaryMax: start.salaryMax + (end.salaryMax - start.salaryMax) * ease,
    }
    if (progress < 1) {
      miniStatsFrame = requestAnimationFrame(step)
    }
  }
  miniStatsFrame = requestAnimationFrame(step)
}

const displayTracerStats = computed(() => ({
  employedPercent: `${Math.round(animatedStats.value.employedPercent)}%`,
  waitTime: formatMonths(animatedStats.value.waitMonths),
  salaryRange: formatSalaryRange(animatedStats.value.salaryMin, animatedStats.value.salaryMax),
  topIndustry: `${tracerSummary.value.topIndustryLabel} (${Math.round(tracerSummary.value.topIndustryPercent)}%)`,
  industries: tracerSummary.value.industries,
}))

const triggerMiniChartAnimation = () => {
  miniChartAnimated.value = false
  requestAnimationFrame(() => {
    miniChartAnimated.value = true
  })
}

const runMiniDashboardAnimation = (target, options = {}) => {
  if (!target) return
  const { reset = false } = options
  if (reset) {
    animatedStats.value = {
      employedPercent: 0,
      waitMonths: 0,
      salaryMin: 0,
      salaryMax: 0,
    }
  }
  animateMiniStats(target)
  triggerMiniChartAnimation()
}

const loadTracerResponses = async () => {
  if (!auth.isAuthenticated.value) return
  try {
    const active = await fetchActiveQuestionnaire('alumni', {
      silent: true,
      requestConfig: { skipAuthRedirect: true, timeout: 800 },
    })
    const questionnaireId = active?.id || active?.data?.id || null
    if (questionnaireId) {
      await fetchSubmissions(
        { questionnaireId, all: true },
        { silent: true, requestConfig: { skipAuthRedirect: true, timeout: 1000 } },
      )
    }
  } catch (error) {
  }
}

watch(
  tracerSummary,
  (value) => {
    if (miniDashboardVisible.value) {
      runMiniDashboardAnimation(value)
    }
  },
  { immediate: false },
)

const features = computed(() => homeCopy.value.features)
const partnerSection = computed(() => homeExtraCopy.value.partners)
const testimonials = computed(() => homeExtraCopy.value.testimonials || [])
const heroSlideLabel = (idx) => `${homeCopy.value.labels.slideSelect} ${idx + 1}`
const testimonialSlideLabel = (idx) => `${homeCopy.value.labels.testimonialSelect} ${idx + 1}`

const findItemById = (items = [], id) =>
  items.find((entry) => String(entry?.id) === String(id)) || null

const jobUpdates = computed(() => jobs.value.slice(0, 4).map((item) => mapLocalizedJob(item)))

const jobModalOpen = ref(false)
const selectedJobId = ref(null)
const selectedJob = computed(() => {
  if (selectedJobId.value === null || selectedJobId.value === undefined) return null
  const raw = findItemById(jobs.value, selectedJobId.value)
  if (!raw) return null
  return mapLocalizedJob(raw, { detailed: true })
})

const openJob = (job) => {
  selectedJobId.value = job?.id ?? null
  jobModalOpen.value = true
}

const closeJobModal = () => {
  jobModalOpen.value = false
  selectedJobId.value = null
}

const publishedNews = computed(() =>
  news.value
    .filter((item) => resolvePublishedStatus(item?.published))
    .slice(0, 3)
    .map((item) => mapLocalizedNews(item)),
)
const newsModalOpen = ref(false)
const selectedNewsId = ref(null)
const selectedNews = computed(() => {
  if (selectedNewsId.value === null || selectedNewsId.value === undefined) return null
  const raw = findItemById(news.value, selectedNewsId.value)
  if (!raw) return null
  return mapLocalizedNews(raw, { detailed: true })
})

const formatNewsDate = (value) => {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString(localeDate.value, { day: '2-digit', month: 'short', year: 'numeric' })
  } catch (e) {
    return value
  }
}

const openNews = (item) => {
  selectedNewsId.value = item?.id ?? null
  newsModalOpen.value = true
}

const closeNewsModal = () => {
  newsModalOpen.value = false
  selectedNewsId.value = null
}

const publishedArticles = computed(() =>
  articles.value.filter((item) => resolvePublishedStatus(item?.published)),
)
const featuredArticles = computed(() =>
  publishedArticles.value
    .slice(0, 6)
    .map((item) => mapLocalizedArticle(item)),
)
const articleModalOpen = ref(false)
const selectedArticleId = ref(null)
const selectedArticle = computed(() => {
  if (selectedArticleId.value === null || selectedArticleId.value === undefined) return null
  const raw = findItemById(articles.value, selectedArticleId.value)
  if (!raw) return null
  return mapLocalizedArticle(raw, { detailed: true })
})

const openArticle = (item) => {
  selectedArticleId.value = item?.id ?? null
  articleModalOpen.value = true
}

const closeArticleModal = () => {
  articleModalOpen.value = false
  selectedArticleId.value = null
}

const activeTestimonialIndex = ref(0)
const activeTestimonial = computed(
  () => testimonials.value[activeTestimonialIndex.value] || testimonials.value[0] || {},
)
let testimonialTimer = null

const stopTestimonialAuto = () => {
  if (testimonialTimer) {
    clearInterval(testimonialTimer)
    testimonialTimer = null
  }
}

const startTestimonialAuto = () => {
  stopTestimonialAuto()
  if (testimonials.value.length <= 1) return
  testimonialTimer = setInterval(() => {
    activeTestimonialIndex.value = (activeTestimonialIndex.value + 1) % testimonials.value.length
  }, 2000)
}

watch(
  testimonials,
  (items) => {
    if (!items.length) {
      activeTestimonialIndex.value = 0
      stopTestimonialAuto()
      return
    }
    if (activeTestimonialIndex.value >= items.length) {
      activeTestimonialIndex.value = 0
    }
    if (testimonialTimer) {
      startTestimonialAuto()
    }
  },
  { immediate: true },
)

onMounted(() => {
  startTestimonialAuto()
  fetchSlides()
  fetchJobs()
  fetchNews()
  fetchArticles()
  setTimeout(() => {
    void loadTracerResponses()
  }, 250)

  if (typeof window !== 'undefined' && miniDashboardSectionRef.value) {
    if (typeof window.IntersectionObserver !== 'function') {
      miniDashboardVisible.value = true
      runMiniDashboardAnimation(tracerSummary.value, { reset: true })
      return
    }

    miniDashboardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          miniDashboardVisible.value = true
          runMiniDashboardAnimation(tracerSummary.value, { reset: true })
          if (miniDashboardObserver && miniDashboardSectionRef.value) {
            miniDashboardObserver.unobserve(miniDashboardSectionRef.value)
            miniDashboardObserver.disconnect()
            miniDashboardObserver = null
          }
        })
      },
      {
        threshold: 0.25,
        rootMargin: '0px 0px -10% 0px',
      },
    )

    miniDashboardObserver.observe(miniDashboardSectionRef.value)
  }
})

onBeforeUnmount(() => {
  stopTestimonialAuto()
  if (miniStatsFrame) cancelAnimationFrame(miniStatsFrame)
  if (miniDashboardObserver) {
    miniDashboardObserver.disconnect()
    miniDashboardObserver = null
  }
})

</script>

<template>
  <div class="public-page">
    <section
      class="public-hero-panel p-6 sm:p-10"
      :aria-label="homeExtraCopy.labels.heroAria"
    >
      <div class="pointer-events-none absolute inset-0 opacity-70">
        <div class="absolute -left-12 -top-12 h-64 w-64 rounded-full bg-sky-100 blur-3xl" />
        <div class="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-indigo-50 blur-3xl" />
      </div>
      <div class="relative grid items-center gap-8 lg:grid-cols-2">
        <div class="space-y-4">
          <div class="public-kicker">
            <span class="h-2 w-2 rounded-full bg-emerald-500" />
            {{ activeHero.tag }}
          </div>
          <div class="space-y-2">
            <h1 class="public-section-title">
              {{ activeHero.title }}
              <span class="bg-gradient-to-r from-indigo-500 to-sky-500 bg-clip-text text-transparent">
                {{ activeHero.highlight }}
              </span>
            </h1>
            <p class="public-section-subtitle sm:text-lg">
              {{ activeHero.subtitle }}
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <RouterLink
              :to="activeHero.primary.to"
              class="public-primary-button"
            >
              {{ activeHero.primary.label }}
            </RouterLink>
            <RouterLink
              :to="activeHero.secondary.to"
              class="public-ghost-button"
            >
              {{ activeHero.secondary.label }}
            </RouterLink>
          </div>

          <div class="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
            <span
              v-for="chip in activeHero.chips"
              :key="chip"
              class="public-soft-chip"
            >
              {{ chip }}
            </span>
          </div>
        </div>

        <div class="motion-float-soft relative">
          <div class="absolute inset-0 rounded-2xl bg-white/80 blur" />
          <div class="public-elevated-card motion-card-sheen relative p-5">
            <div class="flex items-center justify-between text-sm font-semibold text-slate-700">
              <span>{{ homeExtraCopy.labels.responseIn }}</span>
              <span
                class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
              >
                <span class="h-2 w-2 rounded-full bg-emerald-500" />
                {{ activeHero.stats.badge }}
              </span>
            </div>
            <div class="mt-3 space-y-2 text-xs font-semibold text-slate-500">
              <div class="flex items-center justify-between">
                <span>{{ homeExtraCopy.labels.target }}</span>
                <span>{{ activeHero.stats.progress }}%</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500"
                  :style="{ width: `${activeHero.stats.progress}%` }"
                />
              </div>
            </div>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <div class="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                <p class="text-xs font-semibold text-slate-500">{{ activeHero.stats.labelLeft }}</p>
                <p class="text-xl font-semibold text-slate-900">{{ activeHero.stats.valueLeft }}</p>
              </div>
              <div class="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                <p class="text-xs font-semibold text-slate-500">{{ activeHero.stats.labelRight }}</p>
                <p class="text-xl font-semibold text-slate-900">{{ activeHero.stats.valueRight }}</p>
              </div>
            </div>
            <div class="mt-3 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700">
              "{{ activeHero.stats.remark }}"
            </div>
          </div>
        </div>
      </div>

      <div class="relative mt-5 flex items-center justify-between gap-3 sm:mt-6">
        <div class="hero-cta-arrow-group">
          <button
            type="button"
            class="hero-cta-arrow"
            @click="goPrevHero"
            :aria-label="homeCopy.labels.slidePrev"
          >
            <span aria-hidden="true" class="hero-cta-arrow-icon">&lt;</span>
          </button>
          <button
            type="button"
            class="hero-cta-arrow"
            @click="goNextHero"
            :aria-label="homeCopy.labels.slideNext"
          >
            <span aria-hidden="true" class="hero-cta-arrow-icon">&gt;</span>
          </button>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-for="(slide, idx) in heroSlides"
            :key="slide.id"
            type="button"
            class="h-2 rounded-full transition"
            :class="idx === activeHeroIndex ? 'w-8 bg-slate-900 motion-dot-breathe' : 'w-2 bg-slate-300'"
            @click="goToHero(idx)"
            :aria-label="heroSlideLabel(idx)"
          />
        </div>
      </div>
    </section>

    <section class="space-y-8">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="public-kicker">{{ homeCopy.labels.servicesTag }}</p>
          <h2 class="public-section-title mt-2">{{ homeCopy.labels.servicesTitle }}</h2>
        </div>
        <RouterLink class="public-inline-link motion-underline-link" to="/kuisioner"
          >{{ homeCopy.labels.startSurvey }}</RouterLink
         >
      </div>
      <div class="grid gap-5 md:grid-cols-2">
        <article
          v-for="(feature, featureIdx) in features"
          :key="feature.title"
          class="public-elevated-card motion-card-sheen motion-delay-item p-5"
          :style="{ '--stagger-index': featureIdx }"
        >
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-400" />
            <div class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {{ feature.badge }}
            </div>
          </div>
          <h3 class="mt-3 text-xl font-semibold text-slate-900">{{ feature.title }}</h3>
          <p class="mt-2 text-sm text-slate-600">{{ feature.desc }}</p>
        </article>
      </div>
    </section>

    <section
      ref="miniDashboardSectionRef"
      class="public-hero-panel p-6 sm:p-8"
    >
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="public-kicker">{{ homeCopy.labels.statsTag }}</p>
          <h2 class="public-section-title mt-2">{{ homeCopy.labels.statsTitle }}</h2>
          <p class="public-section-subtitle">{{ homeCopy.labels.statsDesc }}</p>
        </div>
        <span class="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-emerald-600 ring-1 ring-emerald-100">{{ homeCopy.labels.liveUpdate }}</span>
      </div>

      <div class="mt-5 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="public-elevated-card motion-card-sheen p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{{ homeExtraCopy.labels.employedRate }}</p>
            <p class="mt-2 text-3xl font-semibold text-slate-900">{{ displayTracerStats.employedPercent }}</p>
            <p class="text-sm text-slate-600">{{ homeExtraCopy.labels.employedDesc }}</p>
          </div>
          <div class="public-elevated-card motion-card-sheen p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{{ homeExtraCopy.labels.waitTime }}</p>
            <p class="mt-2 text-3xl font-semibold text-slate-900">{{ displayTracerStats.waitTime }}</p>
            <p class="text-sm text-slate-600">{{ homeExtraCopy.labels.waitTimeDesc }}</p>
          </div>
          <div class="public-elevated-card motion-card-sheen p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{{ homeExtraCopy.labels.salaryRange }}</p>
            <p class="mt-2 text-3xl font-semibold text-slate-900">{{ displayTracerStats.salaryRange }}</p>
            <p class="text-sm text-slate-600">{{ homeExtraCopy.labels.salaryRangeDesc }}</p>
          </div>
          <div class="public-elevated-card motion-card-sheen p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{{ homeExtraCopy.labels.topIndustry }}</p>
            <p class="mt-2 text-lg font-semibold text-slate-900">{{ displayTracerStats.topIndustry }}</p>
            <p class="text-sm text-slate-600">{{ homeExtraCopy.labels.topIndustryDesc }}</p>
          </div>
        </div>

        <div class="public-elevated-card motion-card-sheen p-5">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-slate-900">{{ homeExtraCopy.labels.industryChartTitle }}</p>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">{{ homeExtraCopy.labels.miniChart }}</span>
          </div>
          <div class="mt-4 space-y-3">
            <div
              v-for="sector in displayTracerStats.industries"
              :key="sector.label"
              class="space-y-1"
            >
              <div class="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>{{ sector.label }}</span>
                <span>{{ sector.value }}%</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out"
                  :class="`${sector.colorFrom} ${sector.colorTo}`"
                  :style="{ width: miniChartAnimated ? `${sector.value}%` : '0%' }"
                />
              </div>
            </div>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-2 text-[11px] text-slate-600 sm:grid-cols-4">
            <span
              v-for="sector in displayTracerStats.industries.slice(0, 4)"
              :key="`legend-${sector.label}`"
              class="flex items-center gap-1"
            >
              <span class="h-2 w-2 rounded-full" :class="getDotClass(sector.colorFrom)" />
              {{ sector.label }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <section class="space-y-8">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="public-kicker">{{ homeCopy.labels.jobsTag }}</p>
          <h2 class="public-section-title mt-2">{{ homeCopy.labels.jobsTitle }}</h2>
          <p class="public-section-subtitle">{{ homeCopy.labels.jobsDesc }}</p>
        </div>
        <RouterLink
          to="/lowongan#lowongan-terbaru"
          class="public-ghost-button"
        >
          {{ homeCopy.labels.jobsAll }}
        </RouterLink>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <article
          v-for="(job, idx) in jobUpdates"
          :key="job.title"
          class="public-elevated-card motion-card-sheen motion-delay-item p-5"
          :style="{ '--stagger-index': idx }"
        >
          <div class="flex items-start justify-between">
            <div class="flex flex-col gap-1">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">#{{ (idx + 1).toString().padStart(2, '0') }}</p>
              <h3 class="text-lg font-semibold text-slate-900">{{ job.title }}</h3>
              <p class="text-sm font-semibold text-slate-700">{{ job.company }}</p>
            </div>
            <span class="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <div class="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <div class="flex items-center gap-2">
              <span class="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-700">{{ homeExtraCopy.labels.jobLocationChip }}</span>
              <span>{{ job.location }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-xs font-semibold text-indigo-700">{{ homeExtraCopy.labels.jobDeadlineChip }}</span>
              <span>{{ homeExtraCopy.labels.jobDeadline }}: {{ job.deadline }}</span>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-500 sm:col-span-2"
              @click="openJob(job)"
            >
              {{ homeCopy.labels.jobsDetail }}
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </article>
      </div>
    </section>

    <div
      v-if="jobModalOpen && selectedJob"
      class="public-dialog-backdrop"
      @click.self="closeJobModal"
    >
      <div class="public-dialog-panel max-w-4xl p-6 sm:p-8">
        <button
          type="button"
          class="public-dialog-close"
          @click="closeJobModal"
        >
          &times;
        </button>

        <div class="space-y-3">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">{{ homeExtraCopy.labels.jobDetailTitle }}</p>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-2xl font-semibold text-slate-900">{{ selectedJob.title }}</h3>
              <p class="text-sm font-semibold text-slate-700">{{ selectedJob.company }}</p>
              <p class="text-xs text-slate-500">{{ selectedJob.companyProfile }}</p>
            </div>
            <div class="flex gap-2 text-xs font-semibold text-slate-700">
              <span class="rounded-full bg-slate-100 px-3 py-1">{{ homeExtraCopy.labels.location }}: {{ selectedJob.location }}</span>
              <span class="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">{{ homeExtraCopy.labels.mode }}: {{ selectedJob.workMode }}</span>
              <span class="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">{{ selectedJob.jobType }}</span>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{{ homeExtraCopy.labels.positionSummary }}</p>
              <p class="mt-2 text-sm text-slate-700">{{ selectedJob.summary }}</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{{ homeExtraCopy.labels.compensationBenefits }}</p>
              <p class="mt-2 text-sm font-semibold text-slate-800">{{ selectedJob.compensation }}</p>
              <ul v-if="selectedJob.benefits && selectedJob.benefits.length" class="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700">
                <li v-for="benefit in selectedJob.benefits" :key="benefit">{{ benefit }}</li>
              </ul>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-100 bg-white p-4">
            <p class="text-sm font-semibold text-slate-900">{{ homeExtraCopy.labels.responsibilities }}</p>
            <ul class="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700">
              <li v-for="item in selectedJob.responsibilities" :key="item">{{ item }}</li>
            </ul>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-2xl border border-slate-100 bg-white p-4">
              <p class="text-sm font-semibold text-slate-900">{{ homeExtraCopy.labels.qualifications }}</p>
              <div class="mt-2 space-y-2 text-sm text-slate-700">
                <div>
                  <p class="font-semibold text-slate-800">{{ homeExtraCopy.labels.education }}</p>
                  <p>{{ selectedJob.qualifications.education }}</p>
                </div>
                <div>
                  <p class="font-semibold text-slate-800">{{ homeExtraCopy.labels.experience }}</p>
                  <p>{{ selectedJob.qualifications.experience }}</p>
                </div>
                <div>
                  <p class="font-semibold text-slate-800">{{ homeExtraCopy.labels.skills }}</p>
                  <ul class="mt-1 list-disc space-y-1 pl-4">
                    <li v-for="skill in selectedJob.qualifications.skills" :key="skill">{{ skill }}</li>
                  </ul>
                </div>
                <div v-if="selectedJob.qualifications.other && selectedJob.qualifications.other.length">
                  <p class="font-semibold text-slate-800">{{ homeExtraCopy.labels.otherCriteria }}</p>
                  <ul class="mt-1 list-disc space-y-1 pl-4">
                    <li v-for="other in selectedJob.qualifications.other" :key="other">{{ other }}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-100 bg-white p-4">
              <p class="text-sm font-semibold text-slate-900">{{ homeExtraCopy.labels.jobDetails }}</p>
              <div class="mt-2 space-y-2 text-sm text-slate-700">
                <p><span class="font-semibold text-slate-800">{{ homeExtraCopy.labels.location }}:</span> {{ selectedJob.location }} ({{ selectedJob.workMode }})</p>
                <p><span class="font-semibold text-slate-800">{{ homeExtraCopy.labels.jobType }}:</span> {{ selectedJob.jobType }}</p>
                <p><span class="font-semibold text-slate-800">{{ homeExtraCopy.labels.jobDeadline }}:</span> {{ selectedJob.deadline }}</p>
                <p><span class="font-semibold text-slate-800">{{ homeExtraCopy.labels.applyMethod }}:</span> {{ selectedJob.apply }}</p>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              @click="closeJobModal"
            >
              {{ homeCopy.labels.close }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <section class="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-indigo-100 via-sky-100 to-cyan-100 p-[1px]">
      <div class="h-full rounded-[22px] bg-white p-8 shadow-sm lg:px-10">
        <div class="space-y-6">
          <div class="flex flex-col gap-2">
            <p class="public-kicker">{{ partnerSection.tag }}</p>
            <h2 class="public-section-title mt-2">{{ partnerSection.title }}</h2>
            <p class="public-section-subtitle">
              {{ partnerSection.description }}
            </p>
          </div>
          <div class="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <div
              v-for="(partner, idx) in partnerSection.cards"
              :key="partner.code"
              class="public-elevated-card motion-card-sheen motion-delay-item flex items-center justify-center gap-3 p-4"
              :style="{ '--stagger-index': idx }"
            >
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                :class="
                  idx === 0
                    ? 'bg-gradient-to-br from-indigo-500 to-sky-500'
                    : idx === 1
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-400'
                      : idx === 2
                        ? 'bg-gradient-to-br from-fuchsia-500 to-purple-500'
                        : idx === 3
                          ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                          : 'bg-gradient-to-br from-slate-600 to-slate-800'
                "
              >{{ partner.code }}</div>
              <div>
                <p class="text-sm font-semibold text-slate-900">{{ partner.title }}</p>
                <p class="text-xs text-slate-600">{{ partner.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="space-y-8">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="public-kicker">{{ homeCopy.labels.newsTag }}</p>
          <h2 class="public-section-title mt-2">{{ homeCopy.labels.newsTitle }}</h2>
        </div>
        <RouterLink class="public-inline-link motion-underline-link" to="/berita">{{ homeCopy.labels.newsFollow }}</RouterLink>
      </div>
      <div v-if="!publishedNews.length" class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        {{ homeCopy.labels.noNews }}
      </div>
      <div v-else class="grid gap-5 md:grid-cols-3">
        <article
          v-for="(berita, newsIdx) in publishedNews"
          :key="berita.id"
          class="public-news-card motion-card-sheen motion-delay-item p-5"
          :style="{ '--stagger-index': newsIdx }"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{{ formatNewsDate(berita.createdAt) }}</p>
          <h3 class="mt-2 text-lg font-semibold text-slate-900">{{ berita.title }}</h3>
          <p class="mt-2 text-sm text-slate-600 line-clamp-3">{{ berita.summary }}</p>
          <button
            type="button"
            class="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            @click="openNews(berita)"
          >
            {{ homeCopy.labels.readMore }}
          </button>
        </article>
      </div>
    </section>

    <div
      v-if="newsModalOpen && selectedNews"
      class="public-dialog-backdrop"
      @click.self="closeNewsModal"
    >
      <div class="public-dialog-panel max-w-4xl p-6 sm:p-8">
        <button
          type="button"
          class="public-dialog-close"
          @click="closeNewsModal"
        >
          &times;
        </button>
        <div class="space-y-3">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">{{ homeCopy.labels.newsTag }}</p>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {{ formatNewsDate(selectedNews.createdAt) }}
              </p>
              <h3 class="text-2xl font-semibold text-slate-900">{{ selectedNews.title }}</h3>
            </div>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
              {{ selectedNews.published ? homeCopy.labels.published : homeCopy.labels.draft }}
            </span>
          </div>
          <div v-if="selectedNews.imageUrl" class="overflow-hidden rounded-2xl border border-slate-100">
            <img :src="selectedNews.imageUrl" :alt="selectedNews.title" class="h-64 w-full object-cover" loading="lazy" />
          </div>
          <p class="text-sm font-semibold text-slate-800">{{ selectedNews.summary }}</p>
          <div class="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
            {{ selectedNews.content || homeCopy.labels.noExtraContent }}
          </div>
          <div class="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              @click="closeNewsModal"
            >
              {{ homeCopy.labels.close }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <section class="space-y-8">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="public-kicker">{{ homeCopy.labels.testimonialsTag }}</p>
          <h2 class="public-section-title mt-2">{{ homeCopy.labels.testimonialsTitle }}</h2>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-for="(testimonial, idx) in testimonials"
            :key="testimonial.name"
            type="button"
            class="h-2 rounded-full transition"
            :class="idx === activeTestimonialIndex ? 'w-8 bg-slate-900 motion-dot-breathe' : 'w-2 bg-slate-300'"
            @click="activeTestimonialIndex = idx"
            :aria-label="testimonialSlideLabel(idx)"
          />
        </div>
      </div>
      <div
        class="public-elevated-card motion-card-sheen relative overflow-hidden p-5 sm:p-6"
        @mouseenter="stopTestimonialAuto"
        @mouseleave="startTestimonialAuto"
      >
        <div
          class="pointer-events-none absolute inset-0 opacity-60"
          :style="{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.1), transparent 35%), radial-gradient(circle at 80% 0%, rgba(14,165,233,0.12), transparent 30%), linear-gradient(135deg, rgba(148,163,184,0.08) 0%, rgba(255,255,255,0) 50%)',
          }"
        />
        <transition name="fade" mode="out-in">
          <article :key="activeTestimonial.name">
            <p class="text-sm text-slate-700">"{{ activeTestimonial.quote }}"</p>
            <div class="mt-4 flex items-center gap-3">
              <img
                v-if="activeTestimonial.avatar"
                :src="activeTestimonial.avatar"
                :alt="activeTestimonial.name"
                class="h-12 w-12 rounded-full border border-slate-100 object-cover"
                loading="lazy"
              />
              <div v-else class="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-sky-400" />
              <div>
                <p class="font-semibold text-slate-900">{{ activeTestimonial.name }}</p>
                <p class="text-sm text-slate-600">{{ activeTestimonial.role }}</p>
              </div>
            </div>
          </article>
        </transition>
      </div>
    </section>

    <section class="space-y-6">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="public-kicker">{{ homeCopy.labels.articleTag }}</p>
          <h2 class="public-section-title mt-2">{{ homeCopy.labels.articleTitle }}</h2>
          <p class="public-section-subtitle">{{ homeCopy.labels.articleDesc }}</p>
        </div>
        <RouterLink
          to="/artikel"
          class="public-ghost-button"
        >
          {{ homeCopy.labels.seeAllTips }}
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </RouterLink>
      </div>
      <div v-if="!featuredArticles.length" class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        {{ homeCopy.labels.noArticles }}
      </div>
      <div v-else class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="(article, articleIdx) in featuredArticles"
          :key="article.id"
          class="public-news-card motion-card-sheen motion-delay-item group"
          :style="{ '--stagger-index': articleIdx }"
        >
          <div v-if="article.imageUrl" class="relative h-36 w-full overflow-hidden">
            <img
              :src="article.imageUrl"
              :alt="article.title"
              class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent" />
          </div>
          <div class="space-y-2 p-4">
            <h3 class="text-lg font-semibold text-slate-900 group-hover:text-indigo-600">{{ article.title }}</h3>
            <p class="text-sm text-slate-600 line-clamp-3">{{ article.summary }}</p>
            <button
              type="button"
              class="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
              @click="openArticle(article)"
            >
              {{ homeCopy.labels.articleDetail }}
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </article>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-if="articleModalOpen && selectedArticle"
        class="public-dialog-backdrop"
        @click.self="closeArticleModal"
      >
        <div class="public-dialog-panel max-w-4xl p-6 sm:p-8">
          <button
            type="button"
            class="public-dialog-close"
            @click="closeArticleModal"
          >
            &times;
          </button>
          <div class="space-y-3">
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">{{ homeExtraCopy.labels.articleModalTag }}</p>
            <h3 class="text-2xl font-semibold text-slate-900">{{ selectedArticle.title }}</h3>
            <p class="text-sm font-semibold text-slate-800">{{ selectedArticle.summary }}</p>
            <div v-if="selectedArticle.imageUrl" class="overflow-hidden rounded-2xl border border-slate-100">
              <img :src="selectedArticle.imageUrl" :alt="selectedArticle.title" class="h-64 w-full object-cover" loading="lazy" />
            </div>
            <div class="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
              {{ selectedArticle.content || homeCopy.labels.noExtraContent }}
            </div>
            <div class="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                @click="closeArticleModal"
              >
                {{ homeCopy.labels.close }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

