<script setup>
import { computed, reactive, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import AdminShell from '../components/AdminShell.vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import { useArticles } from '../stores/articles'

const router = useRouter()
const { articles, addArticle, updateArticle, deleteArticle, fetchArticles, loading, error: loadError } =
  useArticles()

const mode = ref('create')
const editingId = ref(null)
const saving = ref(false)
const confirmSaveOpen = ref(false)
const confirmDeleteOpen = ref(false)
const deleting = ref(false)
const deleteTarget = ref(null)
const message = ref('')
const error = ref('')
const filterStatus = ref('all')
const searchQuery = ref('')
const page = ref(1)
const pageSize = ref(6)
const filterTabs = ['all', 'published', 'draft']
const filterTabContainerRef = ref(null)
const filterTabRefs = ref([])
const filterTabIndicator = reactive({ left: 0, top: 0, width: 0, height: 0 })

const form = reactive({
  title: '',
  summary: '',
  content: '',
  imageUrl: '',
  published: true,
})

const resetForm = () => {
  form.title = ''
  form.summary = ''
  form.content = ''
  form.imageUrl = ''
  form.published = true
  editingId.value = null
  mode.value = 'create'
  message.value = ''
  error.value = ''
  confirmSaveOpen.value = false
  confirmDeleteOpen.value = false
  deleteTarget.value = null
}

const requestSaveSubmit = () => {
  message.value = ''
  error.value = ''

  if (!form.title.trim() || !form.summary.trim()) {
    error.value = 'Judul dan ringkasan wajib diisi.'
    return
  }
  if (saving.value) return
  confirmSaveOpen.value = true
}

const closeSaveConfirm = () => {
  confirmSaveOpen.value = false
}

const confirmSaveSubmit = async () => {
  if (saving.value) return
  confirmSaveOpen.value = false

  saving.value = true

  try {
    const payload = {
      title: form.title,
      summary: form.summary,
      content: form.content,
      imageUrl: form.imageUrl,
      published: form.published,
    }

    if (editingId.value) {
      await updateArticle(editingId.value, payload)
      message.value = 'Artikel diperbarui.'
    } else {
      await addArticle(payload)
      message.value = 'Artikel ditambahkan.'
    }
    resetForm()
  } catch (e) {
    error.value = 'Terjadi kesalahan saat menyimpan artikel.'
  } finally {
    saving.value = false
  }
}

const handleEdit = (item) => {
  editingId.value = item.id
  mode.value = 'edit'
  form.title = item.title
  form.summary = item.summary || ''
  form.content = item.content || ''
  form.imageUrl = item.imageUrl || ''
  form.published = item.published ?? true
  message.value = ''
  error.value = ''
}

const requestDelete = (item) => {
  if (!item?.id || deleting.value) return
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
  error.value = ''

  const targetId = deleteTarget.value.id
  try {
    await deleteArticle(targetId)
    if (String(editingId.value) === String(targetId)) {
      resetForm()
    }
    message.value = 'Artikel dihapus.'
    confirmDeleteOpen.value = false
    deleteTarget.value = null
  } catch (e) {
    error.value = 'Terjadi kesalahan saat menghapus artikel.'
  } finally {
    deleting.value = false
  }
}

const filteredArticles = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return articles.value.filter((item) => {
    if (filterStatus.value === 'published' && !item.published) return false
    if (filterStatus.value === 'draft' && item.published) return false

    if (!q) return true
    const haystack = `${item.title || ''} ${item.summary || ''} ${item.content || ''}`.toLowerCase()
    return haystack.includes(q)
  })
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredArticles.value.length / pageSize.value)))
const paginatedArticles = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredArticles.value.slice(start, start + pageSize.value)
})

const setFilterTabRef = (el, index) => {
  if (el) filterTabRefs.value[index] = el
}

const updateFilterTabIndicator = () => {
  nextTick(() => {
    const index = filterTabs.indexOf(filterStatus.value)
    const tabEl = filterTabRefs.value[index]
    if (!filterTabContainerRef.value || !tabEl) return
    const containerRect = filterTabContainerRef.value.getBoundingClientRect()
    const tabRect = tabEl.getBoundingClientRect()
    filterTabIndicator.left = tabRect.left - containerRect.left
    filterTabIndicator.top = tabRect.top - containerRect.top
    filterTabIndicator.width = tabRect.width
    filterTabIndicator.height = tabRect.height
  })
}

const openInPortal = () => {
  router.push('/artikel')
}

const goBack = () => {
  router.push('/admin')
}

onMounted(() => {
  fetchArticles()
  updateFilterTabIndicator()
  window.addEventListener('resize', updateFilterTabIndicator)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateFilterTabIndicator)
})

watch(filterStatus, () => {
  updateFilterTabIndicator()
})
</script>

<template>
  <AdminShell>
    <div class="max-w-6xl px-4 py-6 sm:px-6 lg:px-10">
      <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Artikel & tips</p>
          <h1 class="mt-1 text-2xl font-semibold text-slate-900">Kelola artikel & konten</h1>
          <p class="mt-1 text-xs text-slate-500">
            Tambah, ubah, dan hapus artikel tips karier yang tampil di portal publik.
          </p>
        </div>
        <p v-if="loadError" class="text-xs font-semibold text-rose-600">{{ loadError }}</p>
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
            class="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100"
            @click="openInPortal"
          >
            Lihat di portal
          </button>
        </div>
      </header>

      <div class="grid gap-6 lg:grid-cols-3">
        <section class="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70 lg:col-span-2">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-3">
              <h2 class="text-sm font-semibold text-slate-900">Daftar artikel</h2>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
              {{ filteredArticles.length }} item
            </span>
          </div>
            <div class="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <div
                ref="filterTabContainerRef"
                class="relative inline-flex rounded-full bg-slate-50 p-1"
              >
                <span
                  aria-hidden="true"
                  class="pointer-events-none absolute left-0 top-0 rounded-full bg-white shadow-sm ring-1 ring-slate-200 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  :style="{
                    width: filterTabIndicator.width + 'px',
                    height: filterTabIndicator.height + 'px',
                    transform: `translate(${filterTabIndicator.left}px, ${filterTabIndicator.top}px)`,
                    opacity: filterTabIndicator.width ? 0.95 : 0,
                    filter: filterTabIndicator.width ? 'blur(0.4px)' : 'blur(0px)',
                  }"
                ></span>
                <button
                  type="button"
                  :ref="(el) => setFilterTabRef(el, 0)"
                  class="relative z-10 rounded-full px-3 py-1 font-semibold transition-colors duration-200 ease-out"
                  :class="filterStatus === 'all' ? 'text-slate-900' : 'text-slate-500 hover:bg-white/60 hover:text-slate-900'"
                  @click="filterStatus = 'all'"
                >
                  Semua
                </button>
                <button
                  type="button"
                  :ref="(el) => setFilterTabRef(el, 1)"
                  class="relative z-10 rounded-full px-3 py-1 font-semibold transition-colors duration-200 ease-out"
                  :class="filterStatus === 'published' ? 'text-emerald-700' : 'text-slate-500 hover:bg-white/60 hover:text-slate-900'"
                  @click="filterStatus = 'published'"
                >
                  Publish
                </button>
                <button
                  type="button"
                  :ref="(el) => setFilterTabRef(el, 2)"
                  class="relative z-10 rounded-full px-3 py-1 font-semibold transition-colors duration-200 ease-out"
                  :class="filterStatus === 'draft' ? 'text-slate-700' : 'text-slate-500 hover:bg-white/60 hover:text-slate-900'"
                  @click="filterStatus = 'draft'"
                >
                  Draft
                </button>
              </div>
              <div class="relative">
                <input
                  v-model="searchQuery"
                  type="text"
                  class="w-48 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 pr-7 text-xs text-slate-700 outline-none ring-0 transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="Cari artikel..."
                />
                <span class="pointer-events-none absolute right-2 top-1.5 text-[11px] text-slate-400">⌕</span>
              </div>
            </div>
          </div>

        <div v-if="loading" class="mt-4 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
          Memuat artikel...
        </div>
        <div v-else-if="!articles.length" class="mt-4 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
          Belum ada artikel. Tambahkan melalui formulir di samping.
        </div>

      <div v-else class="mt-4 space-y-3">
        <article
          v-for="item in paginatedArticles"
          :key="item.id"
          class="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-700 sm:flex-row sm:items-center"
        >
              <div class="flex-1 space-y-1">
                <div class="flex items-center gap-2">
                  <span
                    class="rounded-full px-3 py-1 text-[11px] font-semibold"
                    :class="item.published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'"
                  >
                    {{ item.published ? 'Publish' : 'Draft' }}
                  </span>
                  <span class="text-[11px] text-slate-400">{{ new Date(item.createdAt).toLocaleDateString('id-ID') }}</span>
                </div>
                <p class="text-base font-semibold text-slate-900">{{ item.title }}</p>
                <p class="text-xs text-slate-600 line-clamp-2">{{ item.summary }}</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  @click="handleEdit(item)"
                >
                  Edit
                </button>
                <button
                  type="button"
                  class="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                  @click="requestDelete(item)"
                >
                  Hapus
                </button>
              </div>
        </article>

        <div class="flex items-center justify-between text-xs text-slate-600">
          <span>Halaman {{ page }} / {{ totalPages }}</span>
          <div class="flex gap-2">
            <button
              type="button"
              class="rounded-full border px-3 py-1"
              :disabled="page === 1"
              @click="page = Math.max(1, page - 1)"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              class="rounded-full border px-3 py-1"
              :disabled="page >= totalPages"
              @click="page = Math.min(totalPages, page + 1)"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>
        </section>

        <section class="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                {{ mode === 'edit' ? 'Edit artikel' : 'Tambah artikel' }}
              </p>
              <h2 class="text-lg font-semibold text-slate-900">{{ mode === 'edit' ? 'Perbarui data' : 'Form artikel' }}</h2>
            </div>
            <button
              v-if="mode === 'edit'"
              type="button"
              class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-700"
              @click="resetForm"
            >
              Reset
            </button>
          </div>

          <form class="mt-4 space-y-3 text-sm" @submit.prevent="requestSaveSubmit">
            <label class="space-y-1">
              <span class="text-xs font-semibold text-slate-600">Judul *</span>
              <input
                v-model="form.title"
                type="text"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                placeholder="Judul artikel"
                required
              />
            </label>

            <label class="space-y-1">
              <span class="text-xs font-semibold text-slate-600">Ringkasan *</span>
              <textarea
                v-model="form.summary"
                rows="2"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                placeholder="Kalimat singkat isi artikel"
                required
              />
            </label>

            <label class="space-y-1">
              <span class="text-xs font-semibold text-slate-600">Konten</span>
              <textarea
                v-model="form.content"
                rows="4"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                placeholder="Isi lengkap artikel / tips"
              />
            </label>

            <label class="space-y-1">
              <span class="text-xs font-semibold text-slate-600">Gambar (opsional)</span>
              <input
                v-model="form.imageUrl"
                type="url"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                placeholder="https://..."
              />
            </label>

            <label class="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <input v-model="form.published" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-indigo-600" />
              Tampilkan di portal (publish)
            </label>

            <div class="space-y-2">
              <p v-if="message" class="rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
                {{ message }}
              </p>
              <p v-if="error" class="rounded-2xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                {{ error }}
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                type="submit"
                class="rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:brightness-110"
                :disabled="saving"
              >
                {{ saving ? 'Menyimpan...' : mode === 'edit' ? 'Simpan perubahan' : 'Tambahkan artikel' }}
              </button>
              <button
                type="button"
                class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                @click="resetForm"
              >
                Bersihkan
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
    <Transition name="alert-dialog">
      <div
        v-if="confirmSaveOpen"
        class="alert-dialog-backdrop fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4 py-6"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="article-save-confirm-title"
        aria-describedby="article-save-confirm-desc"
        @click.self="closeSaveConfirm"
      >
        <div class="alert-dialog-panel w-full max-w-md rounded-2xl bg-white p-6 shadow-xl shadow-slate-900/20">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600">Konfirmasi</p>
              <h3 id="article-save-confirm-title" class="text-lg font-semibold text-slate-900">
                {{ mode === 'edit' ? 'Simpan perubahan artikel?' : 'Simpan artikel baru?' }}
              </h3>
              <p id="article-save-confirm-desc" class="mt-2 text-sm text-slate-600">
                {{ mode === 'edit' ? 'Perubahan artikel akan disimpan ke sistem.' : 'Artikel baru akan ditambahkan ke sistem.' }}
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
              @click="confirmSaveSubmit"
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
        aria-labelledby="article-delete-confirm-title"
        aria-describedby="article-delete-confirm-desc"
        @click.self="closeDeleteConfirm"
      >
        <div class="alert-dialog-panel w-full max-w-md rounded-2xl bg-white p-6 shadow-xl shadow-slate-900/20">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600">Konfirmasi</p>
              <h3 id="article-delete-confirm-title" class="text-lg font-semibold text-slate-900">
                Hapus artikel ini?
              </h3>
              <p id="article-delete-confirm-desc" class="mt-2 text-sm text-slate-600">
                Artikel
                <span class="font-semibold text-slate-900">{{ deleteTarget?.title || 'tanpa judul' }}</span>
                akan dihapus dari sistem.
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
  </AdminShell>
  <LoadingOverlay :active="loading" />
</template>
