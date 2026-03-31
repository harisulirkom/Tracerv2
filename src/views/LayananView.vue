<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const copyByLocale = {
  id: {
    tag: 'Layanan',
    title: 'Paket lengkap untuk tracer study',
    desc: 'Pilih layanan yang relevan untuk tim tracer, akademik, dan pusat karier.',
    consultTag: 'Konsultasi',
    consultTitle: 'Butuh penyesuaian khusus?',
    consultDesc: 'Kami bisa bantu audit kuisioner, integrasi data lulusan, atau publikasi laporan tahunan.',
    consultCta: 'Hubungi tim tracer',
    consultLink: 'Lihat detail layanan ->',
    features: [
      { title: 'Pengumpulan Data Cepat', desc: 'Kirim kuisioner multi-channel dengan pengingat otomatis.', badge: 'Realtime' },
      { title: 'Analitik dan Laporan', desc: 'Grafik tren karier, persebaran pekerjaan, dan ringkasan cohort.', badge: 'Insight' },
      { title: 'Integrasi & Ekspor', desc: 'Ekspor CSV/Excel atau sambungkan ke BI tools.', badge: 'Opsional' },
      { title: 'Keamanan Data', desc: 'Hak akses berbasis peran, enkripsi, dan audit log.', badge: 'Keamanan' },
      { title: 'Template Kuisioner', desc: 'Template siap pakai menyesuaikan pedoman tracer study.', badge: 'Template' },
      { title: 'Support Implementasi', desc: 'Bantuan setup domain, sinkronisasi lulusan, dan pelatihan.', badge: 'Support' },
    ],
  },
  en: {
    tag: 'Services',
    title: 'Complete package for tracer study',
    desc: 'Choose services that match tracer, academic, and career center teams.',
    consultTag: 'Consultation',
    consultTitle: 'Need custom adjustments?',
    consultDesc: 'We can assist questionnaire audit, graduate data integration, and annual report publishing.',
    consultCta: 'Contact tracer team',
    consultLink: 'See service details ->',
    features: [
      { title: 'Fast Data Collection', desc: 'Send multi-channel questionnaires with automatic reminders.', badge: 'Realtime' },
      { title: 'Analytics & Reports', desc: 'Career trend charts, job distribution, and cohort summaries.', badge: 'Insight' },
      { title: 'Integration & Export', desc: 'Export to CSV/Excel or connect to BI tools.', badge: 'Optional' },
      { title: 'Data Security', desc: 'Role-based access, encryption, and audit logs.', badge: 'Security' },
      { title: 'Questionnaire Templates', desc: 'Ready-to-use templates aligned with tracer study guidelines.', badge: 'Template' },
      { title: 'Implementation Support', desc: 'Support for domain setup, graduate sync, and training.', badge: 'Support' },
    ],
  },
  ar: {
    tag: 'الخدمات',
    title: 'حزمة متكاملة لدراسة التتبع',
    desc: 'اختر الخدمات المناسبة لفريق التتبع والفريق الأكاديمي ومركز التطوير المهني.',
    consultTag: 'استشارة',
    consultTitle: 'تحتاج تخصيصا خاصا؟',
    consultDesc: 'نساعد في تدقيق الاستبيان، تكامل بيانات الخريجين، ونشر التقارير السنوية.',
    consultCta: 'تواصل مع فريق التتبع',
    consultLink: 'عرض تفاصيل الخدمات ->',
    features: [
      { title: 'جمع بيانات سريع', desc: 'إرسال الاستبيانات عبر قنوات متعددة مع تذكير تلقائي.', badge: 'فوري' },
      { title: 'التحليلات والتقارير', desc: 'رسوم اتجاهات المسار المهني وتوزيع الوظائف وملخصات الدفعات.', badge: 'رؤى' },
      { title: 'التكامل والتصدير', desc: 'تصدير CSV/Excel أو الربط مع أدوات BI.', badge: 'اختياري' },
      { title: 'أمن البيانات', desc: 'صلاحيات حسب الدور وتشفير وسجل تدقيق.', badge: 'أمان' },
      { title: 'قوالب الاستبيان', desc: 'قوالب جاهزة وفق إرشادات دراسة التتبع.', badge: 'قالب' },
      { title: 'دعم التنفيذ', desc: 'مساعدة في إعداد النطاق ومزامنة الخريجين والتدريب.', badge: 'دعم' },
    ],
  },
}

const pageCopy = computed(() => copyByLocale[locale.value] || copyByLocale.id)
const features = computed(() => pageCopy.value.features)
</script>

<template>
  <div class="public-page">
    <header class="public-hero-panel motion-card-sheen space-y-3 p-6 sm:p-8">
      <p class="public-kicker">{{ pageCopy.tag }}</p>
      <h1 class="public-section-title">{{ pageCopy.title }}</h1>
      <p class="public-section-subtitle">{{ pageCopy.desc }}</p>
    </header>

    <div class="grid gap-5 sm:grid-cols-2">
      <article
        v-for="(item, itemIdx) in features"
        :key="item.title"
        class="public-elevated-card motion-card-sheen motion-delay-item p-5"
        :style="{ '--stagger-index': itemIdx }"
      >
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-400" />
          <div class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{{ item.badge }}</div>
        </div>
        <h3 class="mt-3 text-xl font-semibold text-slate-900">{{ item.title }}</h3>
        <p class="mt-2 text-sm text-slate-600">{{ item.desc }}</p>
      </article>
    </div>

    <div class="public-hero-panel motion-card-sheen rounded-2xl p-[1px]">
      <div class="h-full rounded-[18px] bg-white p-6 sm:p-8 shadow-sm">
        <div class="grid gap-6 lg:grid-cols-3">
          <div class="lg:col-span-2 space-y-3">
            <p class="public-kicker">{{ pageCopy.consultTag }}</p>
            <h2 class="text-2xl font-semibold text-slate-900">{{ pageCopy.consultTitle }}</h2>
            <p class="text-sm text-slate-700">{{ pageCopy.consultDesc }}</p>
          </div>
          <div class="flex flex-col gap-3 lg:items-end lg:text-right">
            <RouterLink
              to="/kuisioner"
              class="public-primary-button motion-card-sheen"
            >
              {{ pageCopy.consultCta }}
            </RouterLink>
            <RouterLink
              to="/tentang"
              class="motion-underline-link text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              {{ pageCopy.consultLink }}
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
