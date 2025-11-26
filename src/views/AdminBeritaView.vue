<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNews } from '../stores/news'
import AdminShell from '../components/AdminShell.vue'

const router = useRouter()
const {
  news,
  createNews,
  updateNewsApi,
  deleteNewsApi,
  fetchNews,
  loading,
  error: loadError,
} = useNews()

const mode = ref('create')
const editingId = ref(null)
const saving = ref(false)
const message = ref('')
const error = ref('')

const filterStatus = ref('all') // all | published | draft
const searchQuery = ref('')

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
}

const handleSubmit = async () => {
  saving.value = true
  message.value = ''
  error.value = ''

  if (!form.title.trim() || !form.content.trim()) {
    error.value = 'Judul dan isi berita wajib diisi.'
    saving.value = false
    return
  }

  try {
    if (editingId.value) {
      await updateNewsApi(editingId.value, {
        title: form.title,
        summary: form.summary,
        content: form.content,
        imageUrl: form.imageUrl,
        published: form.published,
      })
      message.value = 'Berita berhasil diperbarui.'
    } else {
      await createNews({
        title: form.title,
        summary: form.summary,
        content: form.content,
        imageUrl: form.imageUrl,
        published: form.published,
      })
      message.value = 'Berita berhasil ditambahkan.'
    }

    resetForm()
  } catch (e) {
    error.value = 'Terjadi kesalahan saat menyimpan berita.'
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

const handleDelete = async (id) => {
  // eslint-disable-next-line no-alert
  const confirmed = window.confirm('Hapus berita ini?')
  if (!confirmed) return
  await deleteNewsApi(id)
}

const filteredNews = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return news.value.filter((item) => {
    if (filterStatus.value === 'published' && !item.published) return false
    if (filterStatus.value === 'draft' && item.published) return false

    if (!q) return true
    const haystack = `${item.title || ''} ${item.summary || ''} ${item.content || ''}`.toLowerCase()
    return haystack.includes(q)
  })
})

const openInPortal = (id) => {
  router.push(`/berita/${id}`)
}

onMounted(() => {
  fetchNews()
})

const goBack = () => {
  router.push('/admin')
}
</script>

<template>
  <AdminShell>
    <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10">
      <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Berita</p>
          <h1 class="mt-1 text-2xl font-semibold text-slate-900">Kelola berita kampus</h1>
          <p class="mt-1 text-xs text-slate-500">
            Tambah, ubah, dan hapus berita yang tampil di portal tracer.
          </p>
        </div>
        <p v-if="loadError" class="text-xs font-semibold text-rose-600">{{ loadError }}</p>
        <button
          type="button"
          class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          @click="goBack"
        >
          Kembali ke dashboard
        </button>
      </header>

      <div class="grid gap-6 lg:grid-cols-3">
        <section class="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70 lg:col-span-2">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-3">
              <h2 class="text-sm font-semibold text-slate-900">Daftar berita</h2>
              <span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                {{ filteredNews.length }} berita
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <div class="inline-flex rounded-full bg-slate-50 p-1">
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
                  :class="
                    filterStatus === 'published' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  "
                  @click="filterStatus = 'published'"
                >
                  Dipublikasikan
                </button>
                <button
                  type="button"
                  class="rounded-full px-3 py-1 font-semibold"
                  :class="filterStatus === 'draft' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:text-slate-900'"
                  @click="filterStatus = 'draft'"
                >
                  Draft
                </button>
              </div>
              <div class="relative">
                <input
                  v-model="searchQuery"
                  type="text"
                  class="w-40 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 pr-7 text-xs text-slate-700 outline-none ring-0 transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
                  placeholder="Cari judul..."
                />
                <span class="pointer-events-none absolute right-2 top-1.5 text-[11px] text-slate-400">🔍</span>
              </div>
            </div>
          </div>

          <div v-if="!news.length" class="mt-5 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
            Belum ada berita yang ditambahkan.
          </div>

          <div v-else class="mt-4 space-y-3">
            <article
              v-for="item in filteredNews"
              :key="item.id"
              class="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-700 sm:flex-row sm:items-center"
            >
              <div class="flex-1">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-400 text-xs font-semibold text-white"
                  >
                    BR
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-slate-900">
                      {{ item.title }}
                    </h3>
                    <p class="mt-0.5 line-clamp-2 text-xs text-slate-500">
                      {{ item.summary || item.content }}
                    </p>
                  </div>
                </div>
                <div class="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                  <span>
                    Dibuat:
                    <strong class="text-slate-700">
                      {{ new Date(item.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) }}
                    </strong>
                  </span>
                  <span v-if="item.updatedAt">
                    Diubah:
                    <strong class="text-slate-700">
                      {{ new Date(item.updatedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) }}
                    </strong>
                  </span>
                  <span
                    class="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold"
                    :class="item.published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'"
                  >
                    {{ item.published ? 'Dipublikasikan' : 'Draft' }}
                  </span>
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                <button
                  v-if="item.published"
                  type="button"
                  class="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100"
                  @click="openInPortal(item.id)"
                >
                  Lihat di portal
                </button>
                <button
                  type="button"
                  class="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  @click="handleEdit(item)"
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

        <section class="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70">
          <h2 class="text-sm font-semibold text-slate-900">
            {{ mode === 'edit' ? 'Ubah berita' : 'Tambah berita' }}
          </h2>
          <p class="mt-1 text-xs text-slate-500">
            Lengkapi informasi di bawah untuk {{ mode === 'edit' ? 'memperbarui' : 'menambahkan' }} berita.
          </p>

          <form class="mt-4 space-y-3" @submit.prevent="handleSubmit">
            <div>
              <label class="block text-xs font-semibold text-slate-600">Judul</label>
              <input
                v-model="form.title"
                type="text"
                class="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
                placeholder="Judul berita"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-600">Ringkasan singkat</label>
              <textarea
                v-model="form.summary"
                rows="2"
                class="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
                placeholder="Ringkasan untuk kartu berita / preview"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-600">Isi berita</label>
              <textarea
                v-model="form.content"
                rows="5"
                class="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
                placeholder="Konten utama berita"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-600">URL gambar (opsional)</label>
              <input
                v-model="form.imageUrl"
                type="url"
                class="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
                placeholder="https://..."
              />
            </div>

            <div class="flex items-center justify-between pt-1">
              <label class="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                <input
                  v-model="form.published"
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                Publikasikan berita
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
                {{ saving ? 'Menyimpan...' : mode === 'edit' ? 'Simpan perubahan' : 'Tambah berita' }}
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
