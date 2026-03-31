<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const copyByLocale = {
  id: {
    tag: 'Tentang',
    title: 'Tentang platform tracer study',
    desc: 'Kami membantu kampus mengumpulkan data alumni dengan cepat, aman, dan siap lapor.',
    missionTitle: 'Misi',
    missionDesc:
      'Memudahkan tracer study melalui automasi pengiriman kuisioner, dashboard realtime, dan publikasi laporan yang bisa langsung dipakai pimpinan.',
    teamTitle: 'Tim',
    teamDesc:
      'Berisi praktisi tracer, pengembang, dan analis data yang terbiasa mendampingi kampus menuntaskan kewajiban tracer nasional.',
    contactTag: 'Kontak',
    contactTitle: 'Butuh demo atau pendampingan?',
    contactDesc: 'Hubungi kami untuk jadwalkan sesi bersama tim tracer kampus Anda.',
    contactCta: 'Jadwalkan demo',
  },
  en: {
    tag: 'About',
    title: 'About the tracer study platform',
    desc: 'We help universities collect alumni data quickly, securely, and ready for reporting.',
    missionTitle: 'Mission',
    missionDesc:
      'Simplify tracer study through questionnaire automation, realtime dashboards, and report publishing for leadership use.',
    teamTitle: 'Team',
    teamDesc:
      'Consists of tracer practitioners, developers, and data analysts experienced in supporting universities.',
    contactTag: 'Contact',
    contactTitle: 'Need a demo or assistance?',
    contactDesc: 'Contact us to schedule a session with your campus tracer team.',
    contactCta: 'Schedule demo',
  },
  ar: {
    tag: 'حول',
    title: 'حول منصة دراسة التتبع',
    desc: 'نساعد الجامعات في جمع بيانات الخريجين بسرعة وبأمان مع جاهزية التقارير.',
    missionTitle: 'الرسالة',
    missionDesc:
      'تبسيط دراسة التتبع عبر أتمتة إرسال الاستبيانات ولوحات متابعة فورية ونشر التقارير للإدارة.',
    teamTitle: 'الفريق',
    teamDesc:
      'يضم متخصصي التتبع والمطورين ومحللي البيانات ذوي خبرة في دعم الجامعات.',
    contactTag: 'تواصل',
    contactTitle: 'تحتاج عرضا تجريبيا أو دعما؟',
    contactDesc: 'تواصل معنا لجدولة جلسة مع فريق التتبع في جامعتك.',
    contactCta: 'جدولة عرض تجريبي',
  },
}

const pageCopy = computed(() => copyByLocale[locale.value] || copyByLocale.id)
</script>

<template>
  <div class="public-page">
    <header class="public-hero-panel motion-card-sheen space-y-3 p-6 sm:p-8">
      <p class="public-kicker">{{ pageCopy.tag }}</p>
      <h1 class="public-section-title">{{ pageCopy.title }}</h1>
      <p class="public-section-subtitle">{{ pageCopy.desc }}</p>
    </header>

    <div class="grid gap-6 md:grid-cols-2">
      <div class="public-elevated-card motion-card-sheen motion-delay-item p-6" style="--stagger-index: 0">
        <h3 class="text-xl font-semibold text-slate-900">{{ pageCopy.missionTitle }}</h3>
        <p class="mt-3 text-sm text-slate-600">{{ pageCopy.missionDesc }}</p>
      </div>
      <div class="public-elevated-card motion-card-sheen motion-delay-item p-6" style="--stagger-index: 1">
        <h3 class="text-xl font-semibold text-slate-900">{{ pageCopy.teamTitle }}</h3>
        <p class="mt-3 text-sm text-slate-600">{{ pageCopy.teamDesc }}</p>
      </div>
    </div>

    <div class="public-hero-panel motion-card-sheen rounded-2xl p-[1px]">
      <div class="h-full rounded-[18px] bg-white p-6 shadow-sm sm:p-8">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="public-kicker">{{ pageCopy.contactTag }}</p>
            <h2 class="text-xl font-semibold text-slate-900">{{ pageCopy.contactTitle }}</h2>
            <p class="text-sm text-slate-700">{{ pageCopy.contactDesc }}</p>
          </div>
          <RouterLink
            to="/kuisioner"
            class="public-primary-button motion-card-sheen"
          >
            {{ pageCopy.contactCta }}
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
