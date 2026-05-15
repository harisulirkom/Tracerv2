<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const copyByLocale = {
  id: {
    tag: 'Tentang CDC',
    title: 'Unit Pengembangan Karier dan Kewirausahaan (CDC)',
    desc:
      'Unit Penunjang Akademik (UPA) Pengembangan Karier dan Kewirausahaan, dikenal sebagai Career Development Center (CDC), merupakan unit baru sejak 2026. Berdasarkan Peraturan Menteri Agama Republik Indonesia Nomor 19 Tahun 2025, unit ini melaksanakan perencanaan, pelaksanaan, dan evaluasi pengembangan karier serta kewirausahaan mahasiswa.',
    visionTitle: 'Visi',
    visionDesc:
      'Menjadi pusat pengembangan karier dan kewirausahaan yang unggul, inovatif, dan berdaya saing global dalam membentuk lulusan UIN Syekh Wasil Kediri yang profesional, adaptif, berjiwa entrepreneur, serta berlandaskan nilai-nilai keislaman dan kebangsaan.',
    missionTitle: 'Misi',
    missionList: [
      'Menyelenggarakan layanan pengembangan karier yang profesional guna meningkatkan kesiapan dan daya saing lulusan di dunia kerja.',
      'Mengembangkan budaya kewirausahaan di lingkungan kampus melalui pendidikan, pelatihan, pendampingan, dan inkubasi bisnis berbasis inovasi dan teknologi.',
      'Membangun jejaring kemitraan strategis dengan dunia usaha, dunia industri, lembaga pemerintah, alumni, dan komunitas profesional untuk mendukung pengembangan karier mahasiswa dan alumni.',
      'Memfasilitasi mahasiswa dan alumni dalam pengembangan kompetensi soft skills dan hard skills sesuai kebutuhan dunia kerja dan industri modern.',
      'Mendorong terciptanya lulusan yang mandiri, kreatif, dan mampu menciptakan lapangan kerja berbasis nilai-nilai Islam moderat dan kebermanfaatan sosial.',
      'Mengoptimalkan pemanfaatan teknologi digital dalam layanan informasi karier, tracer study, rekrutmen, dan pengembangan kewirausahaan.',
      'Menjadi pusat informasi dan pengembangan potensi mahasiswa serta alumni dalam bidang karier, profesionalitas, dan kewirausahaan berkelanjutan.',
    ],
    ctaTitle: 'Butuh demo atau pendampingan?',
    ctaDesc: 'Hubungi kami untuk jadwalkan sesi bersama tim tracer kampus Anda.',
    ctaButton: 'Jadwalkan Demo',
  },
  en: {
    tag: 'About CDC',
    title: 'Career and Entrepreneurship Development Unit (CDC)',
    desc:
      'The Academic Support Unit (UPA) for Career and Entrepreneurship Development, known as the Career Development Center (CDC), was established in 2026. Under the Regulation of the Minister of Religious Affairs of the Republic of Indonesia Number 19 of 2025, this unit is responsible for planning, implementing, and evaluating student career and entrepreneurship development programs.',
    visionTitle: 'Vision',
    visionDesc:
      'To become an excellent, innovative, and globally competitive center for career and entrepreneurship development in shaping UIN Syekh Wasil Kediri graduates who are professional, adaptive, entrepreneurial, and grounded in Islamic and national values.',
    missionTitle: 'Mission',
    missionList: [
      'Provide professional career development services to improve graduate readiness and competitiveness in the labor market.',
      'Develop an entrepreneurship culture on campus through education, training, mentoring, and innovation-driven business incubation.',
      'Build strategic partnerships with business, industry, government institutions, alumni, and professional communities.',
      'Facilitate students and alumni in strengthening both soft skills and hard skills aligned with modern industry needs.',
      'Encourage independent, creative graduates capable of creating opportunities with social impact and moderate Islamic values.',
      'Optimize digital technology for career information services, tracer study, recruitment, and entrepreneurship development.',
      'Serve as a center for information and potential development in career, professionalism, and sustainable entrepreneurship.',
    ],
    ctaTitle: 'Need a demo or mentoring support?',
    ctaDesc: 'Contact us to schedule a session with your campus tracer team.',
    ctaButton: 'Schedule Demo',
  },
  ar: {
    tag: 'About CDC',
    title: 'Career and Entrepreneurship Development Unit (CDC)',
    desc:
      'The Academic Support Unit (UPA) for Career and Entrepreneurship Development, known as the Career Development Center (CDC), was established in 2026. Under the Regulation of the Minister of Religious Affairs of the Republic of Indonesia Number 19 of 2025, this unit is responsible for planning, implementing, and evaluating student career and entrepreneurship development programs.',
    visionTitle: 'Vision',
    visionDesc:
      'To become an excellent, innovative, and globally competitive center for career and entrepreneurship development in shaping UIN Syekh Wasil Kediri graduates who are professional, adaptive, entrepreneurial, and grounded in Islamic and national values.',
    missionTitle: 'Mission',
    missionList: [
      'Provide professional career development services to improve graduate readiness and competitiveness in the labor market.',
      'Develop an entrepreneurship culture on campus through education, training, mentoring, and innovation-driven business incubation.',
      'Build strategic partnerships with business, industry, government institutions, alumni, and professional communities.',
      'Facilitate students and alumni in strengthening both soft skills and hard skills aligned with modern industry needs.',
      'Encourage independent, creative graduates capable of creating opportunities with social impact and moderate Islamic values.',
      'Optimize digital technology for career information services, tracer study, recruitment, and entrepreneurship development.',
      'Serve as a center for information and potential development in career, professionalism, and sustainable entrepreneurship.',
    ],
    ctaTitle: 'Need a demo or mentoring support?',
    ctaDesc: 'Contact us to schedule a session with your campus tracer team.',
    ctaButton: 'Schedule Demo',
  },
}

const pageCopy = computed(() => copyByLocale[locale.value] || copyByLocale.id)
</script>

<template>
  <div class="public-page relative overflow-hidden">
    <div class="pointer-events-none absolute -left-20 top-8 h-52 w-52 rounded-full bg-cyan-200/30 blur-3xl"></div>
    <div class="pointer-events-none absolute -right-16 top-44 h-60 w-60 rounded-full bg-indigo-200/35 blur-3xl"></div>

    <section class="relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-white via-cyan-50/50 to-blue-50 p-6 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.25)] sm:p-8">
      <div class="grid items-center gap-8 lg:grid-cols-2">
        <div class="space-y-4">
          <span class="inline-flex rounded-full border border-cyan-200 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-700 backdrop-blur">
            {{ pageCopy.tag }}
          </span>
          <h1 class="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">{{ pageCopy.title }}</h1>
          <div class="h-1.5 w-24 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500"></div>
          <p class="text-sm leading-relaxed text-slate-600 sm:text-base">
            {{ pageCopy.desc }}
          </p>
          <div class="flex flex-wrap gap-2 pt-1">
            <span class="rounded-full bg-blue-100/70 px-3 py-1 text-xs font-medium text-blue-700">Karier</span>
            <span class="rounded-full bg-emerald-100/70 px-3 py-1 text-xs font-medium text-emerald-700">Kewirausahaan</span>
            <span class="rounded-full bg-indigo-100/70 px-3 py-1 text-xs font-medium text-indigo-700">Tracer Study</span>
          </div>
        </div>

        <div class="relative">
          <div class="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-gradient-to-br from-cyan-200/70 to-blue-200/60 blur-2xl"></div>
          <div class="relative rounded-[26px] border border-white/70 bg-white/65 p-6 shadow-lg backdrop-blur">
            <div class="rounded-2xl bg-gradient-to-br from-cyan-100 to-indigo-100 p-5">
              <svg viewBox="0 0 320 200" class="h-44 w-full text-cyan-700">
                <rect x="28" y="86" width="264" height="82" rx="12" fill="currentColor" fill-opacity="0.18"/>
                <rect x="48" y="62" width="224" height="30" rx="8" fill="currentColor" fill-opacity="0.28"/>
                <rect x="70" y="32" width="180" height="34" rx="6" fill="currentColor" fill-opacity="0.38"/>
                <rect x="94" y="104" width="24" height="50" rx="4" fill="currentColor" fill-opacity="0.42"/>
                <rect x="130" y="104" width="24" height="50" rx="4" fill="currentColor" fill-opacity="0.42"/>
                <rect x="166" y="104" width="24" height="50" rx="4" fill="currentColor" fill-opacity="0.42"/>
                <rect x="202" y="104" width="24" height="50" rx="4" fill="currentColor" fill-opacity="0.42"/>
              </svg>
            </div>
            <div class="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm">
              <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">✦</span>
              Bersama CDC, karier bertumbuh lebih terarah.
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="mt-8 rounded-[28px] border border-white/60 bg-gradient-to-r from-blue-50 via-cyan-50 to-indigo-50 p-6 shadow-[0_12px_35px_-22px_rgba(14,116,144,0.35)] sm:p-8">
      <div class="grid items-start gap-5 lg:grid-cols-[auto,1fr,auto] lg:gap-8">
        <div class="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 text-cyan-700 shadow-sm">
          <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 7v5l3 3"/>
          </svg>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">{{ pageCopy.visionTitle }}</p>
          <p class="mt-2 text-sm leading-relaxed text-slate-700 sm:text-base">{{ pageCopy.visionDesc }}</p>
        </div>
        <div class="hidden lg:block">
          <div class="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-xs font-semibold text-slate-600 backdrop-blur">Arah tujuan strategis</div>
        </div>
      </div>
    </section>

    <section class="mt-8 rounded-[28px] border border-emerald-100/70 bg-gradient-to-br from-white via-emerald-50/55 to-cyan-50/45 p-6 shadow-[0_12px_35px_-22px_rgba(5,150,105,0.25)] sm:p-8">
      <div class="mb-4 flex items-center gap-3">
        <span class="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M5 19 19 5"/>
            <path d="M9 5h10v10"/>
          </svg>
        </span>
        <h2 class="text-2xl font-semibold text-slate-900">{{ pageCopy.missionTitle }}</h2>
      </div>

      <ol class="space-y-3">
        <li
          v-for="(item, idx) in pageCopy.missionList"
          :key="idx"
          class="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur"
        >
          <span class="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white">{{ idx + 1 }}</span>
          <p class="text-sm leading-relaxed text-slate-700">{{ item }}</p>
        </li>
      </ol>
    </section>

    <section class="mt-8 rounded-[28px] border border-white/60 bg-gradient-to-r from-cyan-100/70 via-blue-100/65 to-indigo-100/70 p-6 shadow-[0_12px_35px_-20px_rgba(30,64,175,0.3)] sm:p-8">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-800">Kolaborasi</p>
          <h3 class="mt-1 text-2xl font-semibold text-slate-900">{{ pageCopy.ctaTitle }}</h3>
          <p class="mt-1 text-sm text-slate-700">{{ pageCopy.ctaDesc }}</p>
        </div>
        <RouterLink
          to="/kuisioner"
          class="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-400/30 transition hover:brightness-110"
        >
          {{ pageCopy.ctaButton }}
          <span aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </section>
  </div>
</template>
