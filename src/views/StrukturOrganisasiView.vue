<script setup>
import { onMounted, ref } from 'vue'
import OrganizationTree from '../components/OrganizationTree.vue'
import organizationService from '../services/organizationService'
import { organizationApiError } from '../utils/organizationStructure'

const members = ref([])
const loading = ref(false)
const error = ref('')

const loadStructure = async () => {
  loading.value = true
  error.value = ''
  try {
    members.value = await organizationService.getOrganizationStructure()
  } catch (err) {
    error.value = organizationApiError(err, 'Struktur organisasi belum dapat dimuat.')
  } finally {
    loading.value = false
  }
}

onMounted(loadStructure)
</script>

<template>
  <div class="public-page relative overflow-hidden">
    <div class="pointer-events-none absolute -left-16 top-8 h-56 w-56 rounded-full bg-cyan-200/30 blur-3xl"></div>
    <div class="pointer-events-none absolute -right-20 top-24 h-64 w-64 rounded-full bg-violet-200/25 blur-3xl"></div>

    <section class="relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-white via-cyan-50/55 to-emerald-50/45 p-6 shadow-[0_18px_45px_-24px_rgba(2,132,199,0.35)] sm:p-8">
      <div class="grid items-center gap-8 lg:grid-cols-2">
        <div class="space-y-4">
          <span class="inline-flex rounded-full border border-cyan-200 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-700 backdrop-blur">Profil CDC</span>
          <h1 class="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">Struktur Organisasi</h1>
          <div class="h-1.5 w-24 rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500"></div>
          <p class="text-sm leading-relaxed text-slate-600 sm:text-base">Susunan organisasi UPA Pengembangan Karier dan Kewirausahaan dirancang untuk memperkuat tata kelola layanan tracer study, pengembangan karier, kolaborasi strategis, serta kewirausahaan mahasiswa secara terpadu.</p>
        </div>
        <div class="rounded-[26px] border border-white/70 bg-white/70 p-5 shadow-lg backdrop-blur">
          <div class="flex min-h-44 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 via-cyan-100 to-emerald-100">
            <div class="grid grid-cols-3 items-end gap-4 text-sky-700" aria-hidden="true"><span class="h-14 w-14 rounded-2xl bg-sky-300/60"></span><span class="h-20 w-20 rounded-3xl bg-sky-400/60"></span><span class="h-14 w-14 rounded-2xl bg-emerald-300/60"></span></div>
          </div>
          <p class="mt-4 text-center text-xs font-medium text-slate-600">Organisasi kolaboratif untuk ekosistem karier berkelanjutan.</p>
        </div>
      </div>
    </section>

    <section class="mt-8 rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.28)] backdrop-blur sm:p-8">
      <div v-if="loading" class="flex min-h-64 flex-col items-center justify-center gap-3 text-sm text-slate-500" role="status"><span class="h-9 w-9 animate-spin rounded-full border-4 border-sky-100 border-t-sky-600"></span>Memuat struktur organisasi...</div>
      <div v-else-if="error" class="mx-auto max-w-lg rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center"><p class="text-sm font-semibold text-rose-700">{{ error }}</p><button type="button" class="mt-4 rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white" @click="loadStructure">Coba lagi</button></div>
      <div v-else-if="!members.length" class="mx-auto max-w-lg rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">Struktur organisasi belum tersedia.</div>
      <OrganizationTree v-else :members="members" />
    </section>

    <section class="mt-8 rounded-[28px] border border-white/70 bg-gradient-to-r from-cyan-100/70 via-blue-100/65 to-emerald-100/70 p-6 shadow-[0_14px_35px_-20px_rgba(14,116,144,0.35)] sm:p-8">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p class="max-w-2xl text-sm font-medium leading-relaxed text-slate-700 sm:text-base">Bersama membangun ekosistem karier dan kewirausahaan yang unggul.</p><RouterLink to="/kuisioner" class="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-400/30 transition hover:brightness-110">Isi Kuisioner <span aria-hidden="true">→</span></RouterLink></div>
    </section>
  </div>
</template>
