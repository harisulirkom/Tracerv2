<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminShell from '../components/AdminShell.vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import { useCtaSlides } from '../stores/cta'

const router = useRouter()
const {
  slides,
  addSlide,
  updateSlide,
  deleteSlide,
  reorderSlides,
  resetToDefault,
  fetchSlides,
  syncSlides,
  loading,
} = useCtaSlides()

const mode = ref('create')
const editingId = ref(null)
const saving = ref(false)
const deleting = ref(false)
const resetting = ref(false)
const message = ref('')
const error = ref('')
const confirmSaveOpen = ref(false)
const confirmDeleteOpen = ref(false)
const confirmResetOpen = ref(false)
const deleteTarget = ref(null)

const clampProgress = (value) => Math.min(100, Math.max(0, Number(value) || 0))

const form = reactive({
  tag: '',
  title: '',
  highlight: '',
  subtitle: '',
  chipsInput: '',
  primaryLabel: '',
  primaryTo: '/layanan',
  secondaryLabel: '',
  secondaryTo: '/layanan',
  statsLabelLeft: 'Program aktif',
  statsValueLeft: '',
  statsLabelRight: 'Mitra industri',
  statsValueRight: '',
  statsProgress: 70,
  statsRemark: '',
  statsBadge: 'Live',
})

const resetForm = (clearFeedback = false) => {
  form.tag = ''
  form.title = ''
  form.highlight = ''
  form.subtitle = ''
  form.chipsInput = ''
  form.primaryLabel = ''
  form.primaryTo = '/layanan'
  form.secondaryLabel = ''
  form.secondaryTo = '/layanan'
  form.statsLabelLeft = 'Program aktif'
  form.statsValueLeft = ''
  form.statsLabelRight = 'Mitra industri'
  form.statsValueRight = ''
  form.statsProgress = 70
  form.statsRemark = ''
  form.statsBadge = 'Live'
  mode.value = 'create'
  editingId.value = null
  confirmSaveOpen.value = false
  confirmDeleteOpen.value = false
  confirmResetOpen.value = false
  deleteTarget.value = null
  if (clearFeedback) {
    message.value = ''
    error.value = ''
  }
}

const chipsFromInput = () =>
  form.chipsInput
    ? form.chipsInput
        .split(',')
        .map((chip) => chip.trim())
        .filter(Boolean)
    : []

const previewSlide = computed(() => {
  const chips = chipsFromInput().length
    ? chipsFromInput()
    : ['Konseling & coaching karier', 'Tracer study terintegrasi', 'Kemitraan industri kampus']

  return {
    tag: form.tag || 'CDC UIN Kediri',
    title: form.title || 'Selamat Datang di Career Development Center',
    highlight: form.highlight || 'UIN Syekh Wasil Kediri',
    subtitle:
      form.subtitle || 'Sesuaikan CTA dari admin untuk menjaga konsistensi pesan portal tracer dan layanan CDC.',
    chips,
    primary: { label: form.primaryLabel || 'Masuk Portal CDC', to: form.primaryTo || '/layanan' },
    secondary: { label: form.secondaryLabel || 'Lihat layanan ->', to: form.secondaryTo || '/layanan' },
    stats: {
      labelLeft: form.statsLabelLeft || 'Program aktif',
      valueLeft: form.statsValueLeft || '12',
      labelRight: form.statsLabelRight || 'Mitra industri',
      valueRight: form.statsValueRight || '34',
      progress: clampProgress(form.statsProgress),
      remark: form.statsRemark || 'Kolaborasi kampus x industri untuk kesiapan karier.',
      badge: form.statsBadge || 'Live',
    },
  }
})

const buildPayload = () => ({
  tag: form.tag,
  title: form.title,
  highlight: form.highlight,
  subtitle: form.subtitle,
  chips: chipsFromInput(),
  primary: { label: form.primaryLabel, to: form.primaryTo },
  secondary: { label: form.secondaryLabel, to: form.secondaryTo },
  stats: {
    labelLeft: form.statsLabelLeft,
    valueLeft: form.statsValueLeft,
    labelRight: form.statsLabelRight,
    valueRight: form.statsValueRight,
    progress: clampProgress(form.statsProgress),
    remark: form.statsRemark,
    badge: form.statsBadge,
  },
})

const performSave = async () => {
  message.value = ''
  error.value = ''

  saving.value = true
  try {
    const payload = buildPayload()
    if (editingId.value) {
      updateSlide(editingId.value, payload)
      message.value = 'CTA berhasil diperbarui.'
    } else {
      addSlide(payload)
      message.value = 'CTA baru ditambahkan.'
    }
    await syncSlides()
    resetForm()
  } catch (e) {
    error.value = 'Terjadi kesalahan saat menyimpan CTA.'
  } finally {
    saving.value = false
  }
}

const handleSubmit = () => {
  if (saving.value) return
  message.value = ''
  error.value = ''

  if (!form.title.trim() || !form.highlight.trim()) {
    error.value = 'Judul dan highlight CTA wajib diisi.'
    return
  }

  confirmSaveOpen.value = true
}

const closeSaveConfirm = () => {
  confirmSaveOpen.value = false
}

const confirmSave = async () => {
  confirmSaveOpen.value = false
  await performSave()
}

const handleEdit = (item) => {
  editingId.value = item.id
  mode.value = 'edit'
  message.value = ''
  error.value = ''
  form.tag = item.tag || ''
  form.title = item.title || ''
  form.highlight = item.highlight || ''
  form.subtitle = item.subtitle || ''
  form.chipsInput = (item.chips || []).join(', ')
  form.primaryLabel = item.primary?.label || ''
  form.primaryTo = item.primary?.to || '/'
  form.secondaryLabel = item.secondary?.label || ''
  form.secondaryTo = item.secondary?.to || '/layanan'
  form.statsLabelLeft = item.stats?.labelLeft || 'Program aktif'
  form.statsValueLeft = item.stats?.valueLeft || ''
  form.statsLabelRight = item.stats?.labelRight || 'Mitra industri'
  form.statsValueRight = item.stats?.valueRight || ''
  form.statsProgress = clampProgress(item.stats?.progress ?? 70)
  form.statsRemark = item.stats?.remark || ''
  form.statsBadge = item.stats?.badge || 'Live'
}

const handleDelete = async (id) => {
  if (slides.value.length <= 1) {
    error.value = 'Minimal satu slide CTA harus tersedia.'
    return
  }
  deleteSlide(id)
  await syncSlides()
  message.value = 'CTA dihapus.'
  error.value = ''
  if (editingId.value === id) {
    resetForm()
  }
}

const requestDelete = (item) => {
  if (!item?.id || deleting.value) return
  if (slides.value.length <= 1) {
    error.value = 'Minimal satu slide CTA harus tersedia.'
    return
  }
  deleteTarget.value = {
    id: item.id,
    title: item.title || '',
  }
  confirmDeleteOpen.value = true
}

const closeDeleteConfirm = () => {
  if (deleting.value) return
  confirmDeleteOpen.value = false
  deleteTarget.value = null
}

const confirmDelete = async () => {
  if (deleting.value || !deleteTarget.value?.id) return
  deleting.value = true
  try {
    await handleDelete(deleteTarget.value.id)
    confirmDeleteOpen.value = false
    deleteTarget.value = null
  } finally {
    deleting.value = false
  }
}

const handleReorder = async (index, direction) => {
  const target = index + direction
  if (target < 0 || target >= slides.value.length) return
  reorderSlides(index, target)
  await syncSlides()
}

const handleResetDefault = async () => {
  resetToDefault()
  await syncSlides()
  message.value = 'CTA dikembalikan ke konten default.'
  error.value = ''
  resetForm()
}

const requestResetDefault = () => {
  if (resetting.value) return
  confirmResetOpen.value = true
}

const closeResetConfirm = () => {
  if (resetting.value) return
  confirmResetOpen.value = false
}

const confirmResetDefault = async () => {
  if (resetting.value) return
  resetting.value = true
  try {
    await handleResetDefault()
    confirmResetOpen.value = false
  } finally {
    resetting.value = false
  }
}

const goBack = () => {
  router.push('/admin')
}

onMounted(() => {
  fetchSlides()
})

resetForm(true)
</script>

<template>
  <AdminShell>
    <div class="max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-10">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">CTA Slider</p>
          <h1 class="mt-1 text-2xl font-semibold text-slate-900">Kelola konten CTA di halaman publik</h1>
          <p class="mt-1 text-xs text-slate-500">
            Perbarui teks, highlight, chips, dan statistik CTA agar selalu relevan di beranda.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            @click="goBack"
          >
            Kembali ke dashboard
          </button>
          <button
            type="button"
            class="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 shadow-sm transition hover:bg-amber-100"
            @click="requestResetDefault"
          >
            Reset ke default
          </button>
        </div>
      </header>

      <section class="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-3">
            <h2 class="text-sm font-semibold text-slate-900">Urutan CTA</h2>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
              {{ slides.length }} slide
            </span>
          </div>
          <p class="text-xs text-slate-500">
            Gunakan tombol naik/turun untuk mengatur prioritas tampilan slider.
          </p>
        </div>

        <div v-if="!slides.length" class="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          Belum ada konten CTA. Tambahkan melalui formulir di bawah.
        </div>

        <div v-else class="mt-4 grid gap-3 lg:grid-cols-2">
          <article
            v-for="(item, idx) in slides"
            :key="item.id"
            class="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-700 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3">
                <span
                  class="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-sm font-semibold text-white shadow"
                >
                  {{ (idx + 1).toString().padStart(2, '0') }}
                </span>
                <div class="space-y-1">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-600">{{ item.tag }}</p>
                  <p class="text-base font-semibold text-slate-900">{{ item.title }}</p>
                  <p class="text-sm font-semibold text-indigo-600">{{ item.highlight }}</p>
                  <p class="text-[13px] text-slate-600">{{ item.subtitle }}</p>
                </div>
              </div>
              <span class="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-inner">
                Urutan {{ idx + 1 }}
              </span>
            </div>
            <div class="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
              <span
                v-for="chip in item.chips"
                :key="chip"
                class="rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-slate-100"
              >
                {{ chip }}
              </span>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                :disabled="idx === 0"
                @click="handleReorder(idx, -1)"
              >
                Naik
              </button>
              <button
                type="button"
                class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                :disabled="idx === slides.length - 1"
                @click="handleReorder(idx, 1)"
              >
                Turun
              </button>
              <button
                type="button"
                class="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
                @click="handleEdit(item)"
              >
                Edit
              </button>
              <button
                type="button"
                class="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                @click="requestDelete(item)"
              >
                Hapus
              </button>
            </div>
          </article>
        </div>
      </section>

      <div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section class="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70">
          <form class="space-y-5" @submit.prevent="handleSubmit">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Form CTA</p>
                <h2 class="text-lg font-semibold text-slate-900">
                  {{ mode === 'edit' ? 'Ubah' : 'Tambah' }} konten CTA
                </h2>
                <p class="text-xs text-slate-500">Sesuaikan teks dan tautan tanpa mengubah desain slider.</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  @click="resetForm(true)"
                >
                  Bersihkan
                </button>
                <button
                  type="submit"
                  class="rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:brightness-110"
                  :disabled="saving"
                >
                  {{ saving ? 'Menyimpan...' : 'Simpan CTA' }}
                </button>
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <label class="space-y-1 text-sm text-slate-700">
                <span class="text-xs font-semibold text-slate-600">Tag</span>
                <input
                  v-model="form.tag"
                  type="text"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="CDC UIN Kediri"
                />
              </label>
              <label class="space-y-1 text-sm text-slate-700">
                <span class="text-xs font-semibold text-slate-600">Highlight</span>
                <input
                  v-model="form.highlight"
                  type="text"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="UIN Syekh Wasil Kediri"
                  required
                />
              </label>
              <label class="md:col-span-2 space-y-1 text-sm text-slate-700">
                <span class="text-xs font-semibold text-slate-600">Judul</span>
                <input
                  v-model="form.title"
                  type="text"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="Selamat Datang di Career Development Center"
                  required
                />
              </label>
              <label class="md:col-span-2 space-y-1 text-sm text-slate-700">
                <span class="text-xs font-semibold text-slate-600">Subjudul</span>
                <textarea
                  v-model="form.subtitle"
                  rows="2"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="Wadah Pengembangan Karier, Tracer Study & Kemitraan Industri."
                />
              </label>
              <label class="md:col-span-2 space-y-1 text-sm text-slate-700">
                <span class="text-xs font-semibold text-slate-600">Chips (pisahkan dengan koma)</span>
                <input
                  v-model="form.chipsInput"
                  type="text"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="Konseling & coaching karier, Tracer study terintegrasi, Kemitraan industri kampus"
                />
              </label>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <label class="space-y-1 text-sm text-slate-700">
                <span class="text-xs font-semibold text-slate-600">Tombol utama - label</span>
                <input
                  v-model="form.primaryLabel"
                  type="text"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="Masuk Portal CDC"
                />
              </label>
              <label class="space-y-1 text-sm text-slate-700">
                <span class="text-xs font-semibold text-slate-600">Tombol utama - tautan</span>
                <input
                  v-model="form.primaryTo"
                  type="text"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="/layanan"
                />
              </label>
              <label class="space-y-1 text-sm text-slate-700">
                <span class="text-xs font-semibold text-slate-600">Tombol sekunder - label</span>
                <input
                  v-model="form.secondaryLabel"
                  type="text"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="Lihat layanan ->"
                />
              </label>
              <label class="space-y-1 text-sm text-slate-700">
                <span class="text-xs font-semibold text-slate-600">Tombol sekunder - tautan</span>
                <input
                  v-model="form.secondaryTo"
                  type="text"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="/layanan"
                />
              </label>
            </div>

            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label class="space-y-1 text-sm text-slate-700">
                <span class="text-xs font-semibold text-slate-600">Stat kiri - label</span>
                <input
                  v-model="form.statsLabelLeft"
                  type="text"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="Program aktif"
                />
              </label>
              <label class="space-y-1 text-sm text-slate-700">
                <span class="text-xs font-semibold text-slate-600">Stat kiri - angka</span>
                <input
                  v-model="form.statsValueLeft"
                  type="text"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="12"
                />
              </label>
              <label class="space-y-1 text-sm text-slate-700">
                <span class="text-xs font-semibold text-slate-600">Stat kanan - label</span>
                <input
                  v-model="form.statsLabelRight"
                  type="text"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="Mitra industri"
                />
              </label>
              <label class="space-y-1 text-sm text-slate-700">
                <span class="text-xs font-semibold text-slate-600">Stat kanan - angka</span>
                <input
                  v-model="form.statsValueRight"
                  type="text"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="34"
                />
              </label>
              <label class="space-y-1 text-sm text-slate-700">
                <span class="text-xs font-semibold text-slate-600">Badge</span>
                <input
                  v-model="form.statsBadge"
                  type="text"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="Live"
                />
              </label>
              <label class="space-y-1 text-sm text-slate-700">
                <span class="text-xs font-semibold text-slate-600">Progress (%)</span>
                <input
                  v-model.number="form.statsProgress"
                  type="range"
                  min="0"
                  max="100"
                  class="w-full accent-indigo-500"
                />
                <span class="text-xs font-semibold text-slate-600">Target tercapai: {{ clampProgress(form.statsProgress) }}%</span>
              </label>
            </div>

            <label class="space-y-1 text-sm text-slate-700">
              <span class="text-xs font-semibold text-slate-600">Catatan/remark</span>
              <textarea
                v-model="form.statsRemark"
                rows="2"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                placeholder="Kolaborasi kampus x industri untuk kesiapan karier."
              />
            </label>

            <div class="space-y-2">
              <p v-if="message" class="rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
                {{ message }}
              </p>
              <p v-if="error" class="rounded-2xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                {{ error }}
              </p>
            </div>
          </form>
        </section>

        <section
          class="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 shadow-lg shadow-indigo-500/10 sm:p-8"
          aria-label="Preview CTA"
        >
          <div class="pointer-events-none absolute inset-0 opacity-60">
            <div class="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-sky-100 blur-3xl" />
            <div class="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-indigo-50 blur-3xl" />
          </div>
          <div class="relative grid gap-6 lg:grid-cols-2">
            <div class="space-y-4">
              <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
                <span class="h-2 w-2 rounded-full bg-emerald-500" />
                {{ previewSlide.tag }}
              </div>
              <div class="space-y-2">
                <h3 class="text-2xl font-semibold text-slate-900">
                  {{ previewSlide.title }}
                  <span class="bg-gradient-to-r from-indigo-500 to-sky-500 bg-clip-text text-transparent">
                    {{ previewSlide.highlight }}
                  </span>
                </h3>
                <p class="text-sm text-slate-600">
                  {{ previewSlide.subtitle }}
                </p>
              </div>
              <div class="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                <span
                  v-for="chip in previewSlide.chips"
                  :key="chip"
                  class="rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-slate-100"
                >
                  {{ chip }}
                </span>
              </div>
              <div class="flex flex-wrap gap-3">
                <span
                  class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20"
                >
                  {{ previewSlide.primary.label }}
                </span>
                <span
                  class="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm"
                >
                  {{ previewSlide.secondary.label }}
                </span>
              </div>
            </div>
            <div class="relative">
              <div class="absolute inset-0 rounded-2xl bg-white/80 blur" />
              <div class="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/10">
                <div class="flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>Respon masuk</span>
                  <span
                    class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                  >
                    <span class="h-2 w-2 rounded-full bg-emerald-500" />
                    {{ previewSlide.stats.badge }}
                  </span>
                </div>
                <div class="mt-3 space-y-2 text-xs font-semibold text-slate-500">
                  <div class="flex items-center justify-between">
                    <span>Target</span>
                    <span>{{ clampProgress(previewSlide.stats.progress) }}%</span>
                  </div>
                  <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500"
                      :style="{ width: `${clampProgress(previewSlide.stats.progress)}%` }"
                    />
                  </div>
                </div>
                <div class="mt-4 grid gap-3 sm:grid-cols-2">
                  <div class="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                    <p class="text-xs font-semibold text-slate-500">{{ previewSlide.stats.labelLeft }}</p>
                    <p class="text-xl font-semibold text-slate-900">{{ previewSlide.stats.valueLeft }}</p>
                  </div>
                  <div class="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                    <p class="text-xs font-semibold text-slate-500">{{ previewSlide.stats.labelRight }}</p>
                    <p class="text-xl font-semibold text-slate-900">{{ previewSlide.stats.valueRight }}</p>
                  </div>
                </div>
                <div class="mt-3 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700">
                  "{{ previewSlide.stats.remark }}"
                </div>
                <div class="pointer-events-none absolute -right-10 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-gradient-to-br from-indigo-200/60 via-purple-200/60 to-cyan-200/60 blur-3xl" />
                <div class="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-2xl bg-gradient-to-br from-white/60 via-indigo-100/70 to-sky-100/70 shadow-lg shadow-indigo-500/20" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </AdminShell>
  <LoadingOverlay :active="loading" />

  <Transition name="alert-dialog">
    <div
      v-if="confirmSaveOpen"
      class="alert-dialog-backdrop fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4 py-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="cta-save-confirm-title"
      aria-describedby="cta-save-confirm-desc"
      @click.self="closeSaveConfirm"
    >
      <div class="alert-dialog-panel w-full max-w-md rounded-2xl bg-white p-6 shadow-xl shadow-slate-900/20">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600">Konfirmasi</p>
              <h3 id="cta-save-confirm-title" class="text-lg font-semibold text-slate-900">
                {{ editingId ? 'Simpan perubahan CTA?' : 'Simpan CTA baru?' }}
              </h3>
            <p id="cta-save-confirm-desc" class="mt-2 text-sm text-slate-600">
              CTA dengan judul
              <span class="font-semibold text-slate-900">{{ form.title || 'tanpa judul' }}</span>
              akan langsung tampil di halaman publik setelah disimpan.
            </p>
          </div>
          <button
            type="button"
            class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            @click="closeSaveConfirm"
          >
            Tutup
          </button>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            @click="closeSaveConfirm"
          >
            Batal
          </button>
          <button
            type="button"
            class="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
            :disabled="saving"
            @click="confirmSave"
          >
            {{ saving ? 'Menyimpan...' : 'Ya, simpan' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
  <Transition name="alert-dialog">
    <div
      v-if="confirmDeleteOpen"
      class="alert-dialog-backdrop fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4 py-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="cta-delete-confirm-title"
      aria-describedby="cta-delete-confirm-desc"
      @click.self="closeDeleteConfirm"
    >
      <div class="alert-dialog-panel w-full max-w-md rounded-2xl bg-white p-6 shadow-xl shadow-slate-900/20">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600">Konfirmasi</p>
            <h3 id="cta-delete-confirm-title" class="text-lg font-semibold text-slate-900">
              Hapus slide CTA ini?
            </h3>
            <p id="cta-delete-confirm-desc" class="mt-2 text-sm text-slate-600">
              CTA
              <span class="font-semibold text-slate-900">{{ deleteTarget?.title || 'tanpa judul' }}</span>
              akan dihapus dari slider publik.
            </p>
          </div>
          <button
            type="button"
            class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            @click="closeDeleteConfirm"
          >
            Tutup
          </button>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            @click="closeDeleteConfirm"
          >
            Batal
          </button>
          <button
            type="button"
            class="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-60"
            :disabled="deleting"
            @click="confirmDelete"
          >
            {{ deleting ? 'Menghapus...' : 'Ya, hapus' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
  <Transition name="alert-dialog">
    <div
      v-if="confirmResetOpen"
      class="alert-dialog-backdrop fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4 py-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="cta-reset-confirm-title"
      aria-describedby="cta-reset-confirm-desc"
      @click.self="closeResetConfirm"
    >
      <div class="alert-dialog-panel w-full max-w-md rounded-2xl bg-white p-6 shadow-xl shadow-slate-900/20">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600">Konfirmasi</p>
            <h3 id="cta-reset-confirm-title" class="text-lg font-semibold text-slate-900">
              Kembalikan CTA ke konten bawaan?
            </h3>
            <p id="cta-reset-confirm-desc" class="mt-2 text-sm text-slate-600">
              Semua konfigurasi CTA saat ini akan diganti dengan konten default.
            </p>
          </div>
          <button
            type="button"
            class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            @click="closeResetConfirm"
          >
            Tutup
          </button>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            @click="closeResetConfirm"
          >
            Batal
          </button>
          <button
            type="button"
            class="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-60"
            :disabled="resetting"
            @click="confirmResetDefault"
          >
            {{ resetting ? 'Memproses...' : 'Ya, reset' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
