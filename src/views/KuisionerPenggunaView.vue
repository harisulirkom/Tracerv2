<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useSubmissions } from '../stores/submissions'
import { useQuestionnaires } from '../stores/questionnaires'

const { addSubmission } = useSubmissions()
const { activeQuestionnairesByAudience, resetQuestionnaires } = useQuestionnaires()

const form = reactive({
  organisasi: '',
  bidang: '',
  pic: '',
  jabatan: '',
  kontak: '',
  lokasi: '',
  kinerja: '',
  kompetensi: '',
  pengembangan: '',
  jumlahAlumni: '',
  peran: '',
  waktu: '',
  catatan: '',
  dynamicAnswers: {},
})

const success = ref('')

const defaultProfilFields = [
  'Nama perusahaan/instansi',
  'Bidang industri',
  'Nama PIC',
  'Jabatan PIC',
  'Email / No. kontak',
  'Kota/kabupaten',
]

const defaultPenilaianFields = ['Kinerja alumni kami', 'Kompetensi paling menonjol', 'Area pengembangan yang diharapkan']
const defaultKebutuhanFields = ['Jumlah alumni yang direkrut', 'Peran atau divisi', 'Waktu kebutuhan tenaga kerja']

const defaultSections = [
  { id: 'profil', title: 'A. Profil Organisasi', fields: defaultProfilFields },
  { id: 'penilaian', title: 'B. Penilaian Alumni', fields: defaultPenilaianFields },
  { id: 'kebutuhan', title: 'C. Rencana Rekrutmen', fields: defaultKebutuhanFields },
]

const fallbackPengguna = computed(() => ({
  title: 'Kuisioner pengguna alumni',
  chipText: 'Tracer Study - Kuisioner pengguna dibuka',
  description: 'Berikan penilaian terhadap performa alumni dan kebutuhan rekrutmen instansi Anda.',
  estimatedTime: '+/-5 menit',
  questions: defaultSections,
  extraQuestions: [],
}))

const activePengguna = computed(
  () => activeQuestionnairesByAudience.value.pengguna || fallbackPengguna.value,
)

const questionSections = computed(() => activePengguna.value?.questions || defaultSections)

const profilSection = computed(() => questionSections.value.find((s) => s.id === 'profil'))
const penilaianSection = computed(() => questionSections.value.find((s) => s.id === 'penilaian'))
const kebutuhanSection = computed(() => questionSections.value.find((s) => s.id === 'kebutuhan'))

const profilLabels = computed(() => {
  const fields = profilSection.value?.fields || defaultProfilFields
  return {
    organisasi: fields[0] || defaultProfilFields[0],
    bidang: fields[1] || defaultProfilFields[1],
    pic: fields[2] || defaultProfilFields[2],
    jabatan: fields[3] || defaultProfilFields[3],
    kontak: fields[4] || defaultProfilFields[4],
    lokasi: fields[5] || defaultProfilFields[5],
  }
})

const penilaianLabels = computed(() => {
  const fields = penilaianSection.value?.fields || defaultPenilaianFields
  return {
    kinerja: fields[0] || defaultPenilaianFields[0],
    kompetensi: fields[1] || defaultPenilaianFields[1],
    pengembangan: fields[2] || defaultPenilaianFields[2],
  }
})

const kebutuhanLabels = computed(() => {
  const fields = kebutuhanSection.value?.fields || defaultKebutuhanFields
  return {
    jumlahAlumni: fields[0] || defaultKebutuhanFields[0],
    peran: fields[1] || defaultKebutuhanFields[1],
    waktu: fields[2] || defaultKebutuhanFields[2],
  }
})

const otherSections = computed(() =>
  questionSections.value.filter(
    (section) => !['profil', 'penilaian', 'kebutuhan'].includes(section.id),
  ),
)

const extraQuestions = computed(() => activePengguna.value?.extraQuestions || [])

const headerTitle = computed(() => activePengguna.value?.title || 'Kuisioner pengguna alumni')
const headerChip = computed(() => activePengguna.value?.chipText || 'Tracer Study - Kuisioner pengguna dibuka')
const headerDescription = computed(
  () =>
    activePengguna.value?.description ||
    'Berikan penilaian terhadap performa alumni dan kebutuhan rekrutmen instansi Anda.',
)
const estimatedTimeLabel = computed(() => activePengguna.value?.estimatedTime || '+/-5 menit')
const disabled = computed(() => false)

onMounted(() => {
  resetQuestionnaires()
})

const resetForm = () => {
  form.organisasi = ''
  form.bidang = ''
  form.pic = ''
  form.jabatan = ''
  form.kontak = ''
  form.lokasi = ''
  form.kinerja = ''
  form.kompetensi = ''
  form.pengembangan = ''
  form.jumlahAlumni = ''
  form.peran = ''
  form.waktu = ''
  form.catatan = ''
  form.dynamicAnswers = {}
}

const onSubmit = () => {
  if (disabled.value) {
    success.value = 'Kuisioner belum aktif dari admin.'
    return
  }
  addSubmission({
    type: 'pengguna_alumni',
    nama: form.organisasi,
    prodi: form.peran || form.bidang,
    fakultas: form.lokasi,
    ...form,
  })
  success.value = 'Terima kasih, penilaian Anda sudah tersimpan.'
  resetForm()
  setTimeout(() => {
    success.value = ''
  }, 3000)
}
</script>

<template>
  <div class="space-y-8">
    <header class="space-y-3">
      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">Kuisioner</p>
      <h1 class="text-3xl font-semibold text-slate-900">
        {{ headerTitle }}
      </h1>
      <p class="text-slate-600">
        {{ headerDescription }}
      </p>
      <p v-if="disabled" class="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
        Belum ada kuisioner pengguna alumni yang aktif. Aktifkan dari admin untuk membuka formulir ini.
      </p>
    </header>

    <div class="rounded-3xl border border-slate-200 bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100 p-[1px]">
      <div class="h-full rounded-[22px] bg-white p-8 shadow-sm">
        <form
          class="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-md"
          @submit.prevent="onSubmit"
        >
          <div class="mb-2 flex flex-wrap items-center gap-2">
            <div
              class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700"
            >
              <span class="h-2 w-2 rounded-full bg-emerald-500" />
              {{ headerChip }}
            </div>
            <span class="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-emerald-700">
              {{ estimatedTimeLabel }}
            </span>
          </div>

          <div class="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            A. Profil Organisasi
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="text-sm font-semibold text-slate-900">{{ profilLabels.organisasi }}</label>
              <input
                v-model="form.organisasi"
                type="text"
                class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none"
                placeholder="Nama perusahaan atau instansi"
                required
                :disabled="disabled"
              />
            </div>
            <div>
              <label class="text-sm font-semibold text-slate-900">{{ profilLabels.bidang }}</label>
              <input
                v-model="form.bidang"
                type="text"
                class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none"
                placeholder="Contoh: Teknologi, Pendidikan, Kesehatan"
                :disabled="disabled"
              />
            </div>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="text-sm font-semibold text-slate-900">{{ profilLabels.pic }}</label>
              <input
                v-model="form.pic"
                type="text"
                class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none"
                placeholder="Nama penanggung jawab"
                :disabled="disabled"
              />
            </div>
            <div>
              <label class="text-sm font-semibold text-slate-900">{{ profilLabels.jabatan }}</label>
              <input
                v-model="form.jabatan"
                type="text"
                class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none"
                placeholder="Jabatan penanggung jawab"
                :disabled="disabled"
              />
            </div>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="text-sm font-semibold text-slate-900">{{ profilLabels.kontak }}</label>
              <input
                v-model="form.kontak"
                type="text"
                class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none"
                placeholder="Email atau nomor telepon"
                :disabled="disabled"
              />
            </div>
            <div>
              <label class="text-sm font-semibold text-slate-900">{{ profilLabels.lokasi }}</label>
              <input
                v-model="form.lokasi"
                type="text"
                class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none"
                placeholder="Kota atau kabupaten"
                :disabled="disabled"
              />
            </div>
          </div>

          <div class="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            B. Penilaian Alumni
          </div>
          <div class="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
            <div>
              <label class="text-sm font-semibold text-slate-900">{{ penilaianLabels.kinerja }}</label>
              <textarea
                v-model="form.kinerja"
                rows="2"
                class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
                placeholder="Bagaimana kinerja alumni kami?"
                :disabled="disabled"
              />
            </div>
            <div>
              <label class="text-sm font-semibold text-slate-900">{{ penilaianLabels.kompetensi }}</label>
              <textarea
                v-model="form.kompetensi"
                rows="2"
                class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
                placeholder="Kompetensi yang paling menonjol dari alumni"
                :disabled="disabled"
              />
            </div>
            <div>
              <label class="text-sm font-semibold text-slate-900">{{ penilaianLabels.pengembangan }}</label>
              <textarea
                v-model="form.pengembangan"
                rows="2"
                class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
                placeholder="Area peningkatan yang diharapkan"
                :disabled="disabled"
              />
            </div>
          </div>

          <div class="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            C. Rencana Rekrutmen
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="text-sm font-semibold text-slate-900">{{ kebutuhanLabels.jumlahAlumni }}</label>
              <input
                v-model="form.jumlahAlumni"
                type="text"
                class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none"
                placeholder="Jumlah alumni atau rencana penerimaan"
                :disabled="disabled"
              />
            </div>
            <div>
              <label class="text-sm font-semibold text-slate-900">{{ kebutuhanLabels.peran }}</label>
              <input
                v-model="form.peran"
                type="text"
                class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none"
                placeholder="Posisi atau divisi yang dibutuhkan"
                :disabled="disabled"
              />
            </div>
          </div>
          <div>
            <label class="text-sm font-semibold text-slate-900">{{ kebutuhanLabels.waktu }}</label>
            <input
              v-model="form.waktu"
              type="text"
              class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none"
              placeholder="Contoh: Q2 2025 atau secepatnya"
              :disabled="disabled"
            />
          </div>

          <div
            v-for="section in otherSections"
            :key="section.id"
            class="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {{ section.title }}
            </p>
            <div
              v-for="(fieldLabel, idx) in section.fields || []"
              :key="`${section.id}-${idx}`"
              class="space-y-1"
            >
              <label class="text-sm font-semibold text-slate-900">
                {{ fieldLabel }}
              </label>
              <input
                v-model="form.dynamicAnswers[`${section.id}-${idx}`]"
                type="text"
                class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
                placeholder="Tulis jawaban Anda..."
                :disabled="disabled"
              />
            </div>
          </div>

          <div v-if="extraQuestions.length" class="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Pertanyaan tambahan
          </div>
          <div
            v-for="question in extraQuestions"
            :key="question.id"
            class="space-y-2 rounded-2xl bg-slate-50 p-4 text-sm"
          >
            <label class="text-sm font-semibold text-slate-900">
              {{ question.label || 'Pertanyaan' }}
              <span v-if="question.required" class="text-rose-500">*</span>
            </label>

            <div v-if="question.type === 'textarea'">
              <textarea
                v-model="form.dynamicAnswers[question.id]"
                rows="3"
                class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
                placeholder="Tulis jawaban Anda..."
                :disabled="disabled"
              />
            </div>
            <div v-else-if="question.type === 'select'">
              <select
                v-model="form.dynamicAnswers[question.id]"
                class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
                :disabled="disabled"
              >
                <option value="">Pilih salah satu</option>
                <option
                  v-for="opt in question.options || []"
                  :key="opt"
                  :value="opt"
                >
                  {{ opt }}
                </option>
              </select>
            </div>
            <div v-else-if="question.type === 'multichoice'">
              <div class="mt-1 space-y-2">
                <label
                  v-for="opt in question.options || []"
                  :key="opt"
                  class="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                >
                  <input
                    v-model="form.dynamicAnswers[question.id]"
                    type="checkbox"
                    :value="opt"
                    class="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    :disabled="disabled"
                  />
                  <span>{{ opt }}</span>
                </label>
              </div>
            </div>
            <div v-else>
              <input
                v-model="form.dynamicAnswers[question.id]"
                type="text"
                class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
                placeholder="Tulis jawaban Anda..."
                :disabled="disabled"
              />
            </div>
          </div>

          <div>
            <label class="text-sm font-semibold text-slate-900">Catatan atau masukan tambahan</label>
            <textarea
              v-model="form.catatan"
              rows="3"
              class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none"
              placeholder="Masukan untuk kerja sama, magang, atau rekrutmen"
              :disabled="disabled"
            ></textarea>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex flex-wrap items-center gap-3 text-xs text-emerald-700">
              <span class="rounded-full bg-emerald-50 px-3 py-1">{{ estimatedTimeLabel }}</span>
              <span class="rounded-full bg-emerald-50 px-3 py-1">Data aman</span>
              <span class="rounded-full bg-emerald-50 px-3 py-1">Tidak perlu login</span>
            </div>
            <button
              class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              type="submit"
              :disabled="disabled"
            >
              Kirim penilaian
            </button>
          </div>
          <p v-if="success" class="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {{ success }}
          </p>
        </form>
      </div>
    </div>
  </div>
</template>
