<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuestionnaires } from '../stores/questionnaires'
import AdminShell from '../components/AdminShell.vue'

const router = useRouter()
const {
  questionnaires,
  setActiveQuestionnaire,
  fetchQuestionnaires,
  createQuestionnaireApi,
  updateQuestionnaireApi,
  deleteQuestionnaireApi,
  loading,
  error: loadError,
} = useQuestionnaires()

const mode = ref('create') // 'create' | 'edit'
const editingId = ref(null)
const saving = ref(false)
const message = ref('')
const error = ref('')

const form = reactive({
  title: '',
  chipText: '',
  description: '',
  estimatedTime: '',
  active: true,
  audience: 'alumni',
})

const filterStatus = ref('all') // all | active | inactive
const filterAudience = ref('all') // all | alumni | pengguna | umum

const resetForm = () => {
  form.title = ''
  form.chipText = ''
  form.description = ''
  form.estimatedTime = ''
  form.active = true
  form.audience = 'alumni'
  editingId.value = null
  mode.value = 'create'
  message.value = ''
  error.value = ''
}

const startCreate = () => {
  resetForm()
}

const startEdit = (item) => {
  editingId.value = item.id
  mode.value = 'edit'
  form.title = item.title || ''
  form.chipText = item.chipText || ''
  form.description = item.description || ''
  form.estimatedTime = item.estimatedTime || ''
  form.active = !!item.active
  form.audience = item.audience || 'alumni'
  message.value = ''
  error.value = ''
}

const handleSubmit = async () => {
  saving.value = true
  message.value = ''
  error.value = ''

  if (!form.title.trim()) {
    error.value = 'Judul kuisioner wajib diisi.'
    saving.value = false
    return
  }

  const payload = {
    title: form.title,
    chipText: form.chipText,
    description: form.description,
    estimatedTime: form.estimatedTime,
    active: form.active,
    audience: form.audience,
  }

  try {
    if (editingId.value) {
      await updateQuestionnaireApi(editingId.value, payload)
      message.value = 'Kuisioner berhasil diperbarui.'
    } else {
      await createQuestionnaireApi(payload)
      message.value = 'Kuisioner baru berhasil ditambahkan.'
    }

    if (!editingId.value) {
      resetForm()
    }
  } catch (e) {
    error.value = 'Terjadi kesalahan saat menyimpan kuisioner.'
  } finally {
    saving.value = false
  }
}

const handleDelete = async (id) => {
  // eslint-disable-next-line no-alert
  const confirmed = window.confirm('Hapus kuisioner ini? Semua pengaturan terkait akan dihapus dari admin.')
  if (!confirmed) return
  await deleteQuestionnaireApi(id)
  if (editingId.value === id) resetForm()
}

const handleSetActive = async (id) => {
  try {
    await updateQuestionnaireApi(id, { active: true })
    setActiveQuestionnaire(id)
    message.value = 'Kuisioner diaktifkan.'
  } catch (err) {
    error.value = err?.message || 'Gagal mengaktifkan kuisioner.'
  }
}

const goToResponses = (id) => {
  router.push({ name: 'AdminKuisionerResponses', params: { id } })
}

const goToDetail = (id) => {
  router.push({ name: 'AdminKuisionerDetail', params: { id } })
}

const filteredQuestionnaires = computed(() =>
  questionnaires.value.filter((item) => {
    const matchStatus =
      filterStatus.value === 'all' ||
      (filterStatus.value === 'active' && item.active) ||
      (filterStatus.value === 'inactive' && !item.active)
    const matchAudience = filterAudience.value === 'all' || item.audience === filterAudience.value
    return matchStatus && matchAudience
  }),
)

const audienceLabel = (aud = 'alumni') => {
  if (aud === 'pengguna') return 'Pengguna alumni'
  if (aud === 'umum') return 'Umum'
  return 'Alumni'
}

const goBack = () => {
  router.push('/admin')
}

fetchQuestionnaires()
</script>

<template>
  <AdminShell>
    <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10">
      <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Kuisioner</p>
          <h1 class="mt-1 text-2xl font-semibold text-slate-900">Kelola kuisioner tracer</h1>
          <p class="mt-1 text-xs text-slate-500">
            Tambah, ubah, aktifkan, dan hapus kuisioner tracer study yang akan digunakan di portal alumni.
          </p>
        </div>
        <button
          type="button"
          class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 btn-white-gradient-hover"
          @click="goBack"
        >
          Kembali ke dashboard
        </button>
      </header>

      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Daftar kuisioner -->
        <section class="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70 lg:col-span-2">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-3">
              <h2 class="text-sm font-semibold text-slate-900">Daftar kuisioner</h2>
              <span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                {{ filteredQuestionnaires.length }} kuisioner
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <div class="inline-flex rounded-full bg-slate-50 p-1 text-[11px]">
                <button
                  type="button"
                  class="rounded-full px-3 py-1 font-semibold"
                  :class="filterStatus === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'"
                  @click="filterStatus = 'all'"
                >
                  Semua
                </button>
                <button
                  type="button"
                  class="rounded-full px-3 py-1 font-semibold"
                  :class="filterStatus === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'"
                  @click="filterStatus = 'active'"
                >
                  Aktif
                </button>
                <button
                  type="button"
                  class="rounded-full px-3 py-1 font-semibold"
                  :class="filterStatus === 'inactive' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:text-slate-900'"
                  @click="filterStatus = 'inactive'"
                >
                  Tidak aktif
                </button>
              </div>
              <select
                v-model="filterAudience"
                class="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm outline-none ring-0 transition focus:border-teal-500 focus:ring-1 focus:ring-teal-100"
              >
                <option value="all">Semua tipe</option>
                <option value="alumni">Alumni</option>
                <option value="pengguna">Pengguna alumni</option>
                <option value="umum">Umum</option>
              </select>
            </div>
          </div>

          <p v-if="loadError" class="mt-2 text-xs font-semibold text-rose-600">{{ loadError }}</p>

          <div
            v-if="loading"
            class="mt-5 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500"
          >
            Memuat kuisioner...
          </div>

          <div v-else-if="!questionnaires.length" class="mt-5 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
            Belum ada kuisioner yang ditambahkan. Gunakan formulir di sebelah kanan untuk menambahkan kuisioner baru.
          </div>

          <div v-else class="mt-4 space-y-3">
            <article
              v-for="item in filteredQuestionnaires"
              :key="item.id"
              class="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-700 sm:flex-row sm:items-center"
            >
              <div class="flex-1">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-xs font-semibold text-white"
                  >
                    QS
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-slate-900">
                      {{ item.title }}
                    </h3>
                    <p v-if="item.chipText" class="mt-0.5 text-[11px] text-slate-500">
                      {{ item.chipText }}
                    </p>
                  </div>
                </div>
                <p v-if="item.description" class="mt-2 line-clamp-2 text-xs text-slate-600">
                  {{ item.description }}
                </p>
                <div class="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                  <span class="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700">
                    {{ audienceLabel(item.audience) }}
                  </span>
                  <span v-if="item.estimatedTime">
                    Perkiraan waktu:
                    <strong class="text-slate-700">{{ item.estimatedTime }}</strong>
                  </span>
                  <span>
                    Dibuat:
                    <strong class="text-slate-700">
                      {{
                        new Date(item.createdAt).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      }}
                    </strong>
                  </span>
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                <span
                  class="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold"
                  :class="item.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'"
                >
                  {{ item.active ? 'Aktif di portal' : 'Tidak aktif' }}
                </span>
                <button
                  v-if="!item.active"
                  type="button"
                  class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                  @click="handleSetActive(item.id)"
                >
                  Jadikan aktif
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold shadow-sm transition btn-white-gradient-hover"
                  :class="
                    item.active
                      ? 'border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100'
                      : 'border-slate-200 bg-white text-slate-400 cursor-not-allowed'
                  "
                  :disabled="!item.active"
                  @click="goToResponses(item.id)"
                >
                  <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 3v18" />
                    <path d="M5 9h14" />
                    <path d="M5 15h14" />
                  </svg>
                  Lihat jawaban
                </button>
                <button
                  type="button"
                  class="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 btn-white-gradient-hover"
                  @click="goToDetail(item.id)"
                >
                  Lihat rinci
                </button>
                <button
                  type="button"
                  class="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 btn-white-gradient-hover"
                  @click="startEdit(item)"
                >
                  Ubah
                </button>
                <button
                  type="button"
                  class="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100"
                  @click="handleDelete(item.id)"
                >
                  Hapus
                </button>
              </div>
            </article>
          </div>
        </section>

        <!-- Form kuisioner -->
        <section class="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70">
          <div class="flex items-center justify-between gap-2">
            <div>
              <h2 class="text-sm font-semibold text-slate-900">
                {{ mode === 'edit' ? 'Ubah kuisioner' : 'Tambah kuisioner' }}
              </h2>
              <p class="mt-1 text-xs text-slate-500">
                Lengkapi informasi di bawah untuk {{ mode === 'edit' ? 'memperbarui' : 'menambahkan' }} kuisioner.
              </p>
            </div>
            <button
              v-if="mode === 'edit'"
              type="button"
              class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100"
              @click="startCreate"
            >
              + Kuisioner baru
            </button>
          </div>

          <form class="mt-4 space-y-3" @submit.prevent="handleSubmit">
            <div>
              <label class="block text-xs font-semibold text-slate-600">Judul tampilan</label>
              <input
                v-model="form.title"
                type="text"
                class="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
                placeholder="Contoh: Isi kuisioner alumni"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-600">Teks badge atas</label>
              <input
                v-model="form.chipText"
                type="text"
                class="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
                placeholder="Contoh: Tracer Study 2025 - Kuisioner sudah dibuka"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-600">Deskripsi singkat</label>
              <textarea
                v-model="form.description"
                rows="3"
                class="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
                placeholder="Deskripsi yang muncul di bawah judul kuisioner"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-600">Target responden</label>
              <select
                v-model="form.audience"
                class="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
              >
                <option value="alumni">Alumni</option>
                <option value="pengguna">Pengguna alumni</option>
                <option value="umum">Umum</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-600">Perkiraan waktu isi</label>
              <input
                v-model="form.estimatedTime"
                type="text"
                class="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
                placeholder="+/-5 menit"
              />
            </div>

            <div class="flex items-center justify-between pt-1">
              <label class="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                <input
                  v-model="form.active"
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                Jadikan aktif di portal
              </label>

              <button
                v-if="mode === 'edit'"
                type="button"
                class="text-[11px] font-semibold text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
                @click="resetForm"
              >
                Batal ubah
              </button>
            </div>

            <div class="pt-2">
              <button
                type="submit"
                class="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                :disabled="saving"
              >
                {{ saving ? 'Menyimpan...' : mode === 'edit' ? 'Simpan perubahan' : 'Tambah kuisioner' }}
              </button>
            </div>

            <p v-if="message" class="pt-1 text-xs font-semibold text-emerald-600">
              {{ message }}
            </p>
            <p v-if="error" class="pt-1 text-xs font-semibold text-rose-600">
              {{ error }}
            </p>
          </form>
        </section>
      </div>
    </div>
  </AdminShell>
</template>
