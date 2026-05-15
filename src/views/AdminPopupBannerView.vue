<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import AdminShell from '../components/AdminShell.vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import popupBannerService from '../services/popupBannerService'

const banners = ref([])
const loading = ref(false)
const saving = ref(false)
const deletingId = ref(null)
const editingId = ref(null)
const message = ref('')
const error = ref('')
const previewUrl = ref('')

const form = reactive({
  title: '',
  description: '',
  image: null,
  imageUrl: '',
  linkUrl: '',
  buttonLabel: '',
  isActive: true,
  startsAt: '',
  endsAt: '',
  sortOrder: 0,
  removeImage: false,
})

const editingBanner = computed(() => banners.value.find((item) => item.id === editingId.value) || null)
const activeBanner = computed(() => banners.value.find((item) => item.isActive) || null)

const resetForm = () => {
  editingId.value = null
  form.title = ''
  form.description = ''
  form.image = null
  form.imageUrl = ''
  form.linkUrl = ''
  form.buttonLabel = ''
  form.isActive = true
  form.startsAt = ''
  form.endsAt = ''
  form.sortOrder = 0
  form.removeImage = false
  previewUrl.value = ''
}

const toInputDateTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (num) => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const loadBanners = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await popupBannerService.getPopupBanners()
    banners.value = response.items || []
  } catch (err) {
    error.value = err?.response?.data?.message || err?.message || 'Gagal memuat popup banner.'
  } finally {
    loading.value = false
  }
}

const handleFileChange = (event) => {
  const file = event.target.files?.[0] || null
  form.image = file
  form.removeImage = false
  previewUrl.value = file ? URL.createObjectURL(file) : ''
}

const buildPayload = () => ({
  title: form.title.trim(),
  description: form.description.trim(),
  image: form.image,
  image_url: form.imageUrl.trim(),
  link_url: form.linkUrl.trim(),
  button_label: form.buttonLabel.trim(),
  is_active: form.isActive,
  starts_at: form.startsAt,
  ends_at: form.endsAt,
  sort_order: form.sortOrder,
  remove_image: form.removeImage,
})

const saveBanner = async () => {
  message.value = ''
  error.value = ''
  if (!form.title.trim()) {
    error.value = 'Judul popup wajib diisi.'
    return
  }
  if (!editingId.value && !form.image && !form.imageUrl.trim()) {
    error.value = 'Upload pamflet atau isi URL gambar terlebih dahulu.'
    return
  }

  saving.value = true
  try {
    const payload = buildPayload()
    if (editingId.value) {
      await popupBannerService.updatePopupBanner(editingId.value, payload)
      message.value = 'Popup banner diperbarui.'
    } else {
      await popupBannerService.createPopupBanner(payload)
      message.value = 'Popup banner ditambahkan.'
    }
    resetForm()
    await loadBanners()
  } catch (err) {
    const validation = err?.response?.data?.errors
    error.value =
      validation ? Object.values(validation).flat().join(' ') : err?.response?.data?.message || err?.message || 'Gagal menyimpan popup banner.'
  } finally {
    saving.value = false
  }
}

const editBanner = (item) => {
  editingId.value = item.id
  form.title = item.title || ''
  form.description = item.description || ''
  form.image = null
  form.imageUrl = item.externalImageUrl || ''
  form.linkUrl = item.linkUrl || ''
  form.buttonLabel = item.buttonLabel || ''
  form.isActive = !!item.isActive
  form.startsAt = toInputDateTime(item.startsAt)
  form.endsAt = toInputDateTime(item.endsAt)
  form.sortOrder = item.sortOrder || 0
  form.removeImage = false
  previewUrl.value = item.imageUrl || ''
  message.value = ''
  error.value = ''
}

const deleteBanner = async (item) => {
  if (!item?.id || deletingId.value) return
  const ok = window.confirm(`Hapus popup banner "${item.title}"?`)
  if (!ok) return

  deletingId.value = item.id
  message.value = ''
  error.value = ''
  try {
    await popupBannerService.deletePopupBanner(item.id)
    message.value = 'Popup banner dihapus.'
    if (editingId.value === item.id) resetForm()
    await loadBanners()
  } catch (err) {
    error.value = err?.response?.data?.message || err?.message || 'Gagal menghapus popup banner.'
  } finally {
    deletingId.value = null
  }
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

onMounted(loadBanners)
</script>

<template>
  <AdminShell>
    <div class="max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-10">
      <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Popup Banner</p>
          <h1 class="mt-1 text-2xl font-semibold text-slate-900">Kelola pamflet popup acara</h1>
          <p class="mt-1 text-xs text-slate-500">
            Banner aktif akan muncul satu kali per browser sampai user menutupnya secara manual.
          </p>
        </div>
        <div class="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-slate-100">
          <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Sedang aktif</p>
          <p class="mt-1 font-semibold text-slate-900">{{ activeBanner?.title || 'Tidak ada banner aktif' }}</p>
        </div>
      </header>

      <div v-if="message" class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
        {{ message }}
      </div>
      <div v-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
        {{ error }}
      </div>

      <div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-sm font-semibold text-slate-900">{{ editingId ? 'Edit popup banner' : 'Tambah popup banner' }}</h2>
              <p class="mt-1 text-xs text-slate-500">Gunakan gambar vertikal atau horizontal sesuai pamflet acara.</p>
            </div>
            <button
              v-if="editingId"
              type="button"
              class="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              @click="resetForm"
            >
              Batal edit
            </button>
          </div>

          <form class="grid gap-4" @submit.prevent="saveBanner">
            <label class="grid gap-1 text-sm font-semibold text-slate-700">
              Judul
              <input v-model="form.title" class="rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-slate-400" />
            </label>

            <label class="grid gap-1 text-sm font-semibold text-slate-700">
              Deskripsi
              <textarea v-model="form.description" rows="3" class="rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-slate-400"></textarea>
            </label>

            <div class="grid gap-3 sm:grid-cols-2">
              <label class="grid gap-1 text-sm font-semibold text-slate-700">
                Upload pamflet
                <input type="file" accept="image/png,image/jpeg,image/webp" class="text-sm" @change="handleFileChange" />
              </label>
              <label class="grid gap-1 text-sm font-semibold text-slate-700">
                URL gambar eksternal
                <input v-model="form.imageUrl" placeholder="https://..." class="rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-slate-400" />
              </label>
            </div>

            <label v-if="editingBanner?.imagePath" class="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input v-model="form.removeImage" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
              Hapus gambar upload saat menyimpan
            </label>

            <div class="grid gap-3 sm:grid-cols-2">
              <label class="grid gap-1 text-sm font-semibold text-slate-700">
                Link tujuan
                <input v-model="form.linkUrl" placeholder="https://..." class="rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-slate-400" />
              </label>
              <label class="grid gap-1 text-sm font-semibold text-slate-700">
                Label tombol
                <input v-model="form.buttonLabel" placeholder="Daftar sekarang" class="rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-slate-400" />
              </label>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <label class="grid gap-1 text-sm font-semibold text-slate-700">
                Mulai tampil
                <input v-model="form.startsAt" type="datetime-local" class="rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-slate-400" />
              </label>
              <label class="grid gap-1 text-sm font-semibold text-slate-700">
                Selesai tampil
                <input v-model="form.endsAt" type="datetime-local" class="rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-slate-400" />
              </label>
              <label class="grid gap-1 text-sm font-semibold text-slate-700">
                Prioritas
                <input v-model.number="form.sortOrder" type="number" min="0" class="rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-slate-400" />
              </label>
            </div>

            <label class="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input v-model="form.isActive" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
              Aktifkan banner ini
            </label>

            <div v-if="previewUrl" class="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
              <img :src="previewUrl" alt="Preview pamflet" class="max-h-96 w-full object-contain" />
            </div>

            <button
              type="submit"
              class="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="saving"
            >
              {{ saving ? 'Menyimpan...' : editingId ? 'Simpan perubahan' : 'Tambah popup banner' }}
            </button>
          </form>
        </section>

        <section class="relative rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <LoadingOverlay :show="loading" label="Memuat popup banner..." />
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-slate-900">Daftar popup banner</h2>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">{{ banners.length }} item</span>
          </div>

          <div v-if="!banners.length && !loading" class="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            Belum ada popup banner.
          </div>

          <div v-else class="space-y-3">
            <article
              v-for="item in banners"
              :key="item.id"
              class="rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
            >
              <div class="flex items-start gap-3">
                <img v-if="item.imageUrl" :src="item.imageUrl" alt="" class="h-20 w-20 rounded-xl object-cover" />
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="font-semibold text-slate-900">{{ item.title }}</h3>
                    <span
                      class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      :class="item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'"
                    >
                      {{ item.isActive ? 'Aktif' : 'Nonaktif' }}
                    </span>
                  </div>
                  <p v-if="item.description" class="mt-1 line-clamp-2 text-xs text-slate-600">{{ item.description }}</p>
                  <p class="mt-2 text-[11px] text-slate-500">
                    {{ formatDate(item.startsAt) }} - {{ formatDate(item.endsAt) }}
                  </p>
                </div>
              </div>
              <div class="mt-3 flex flex-wrap justify-end gap-2">
                <button type="button" class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100" @click="editBanner(item)">
                  Edit
                </button>
                <button type="button" class="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100" :disabled="deletingId === item.id" @click="deleteBanner(item)">
                  {{ deletingId === item.id ? 'Menghapus...' : 'Hapus' }}
                </button>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  </AdminShell>
</template>
