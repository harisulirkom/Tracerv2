<template>
  <AdminShell>
    <div class="p-6 space-y-4">
      <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-500">Tracer Study</p>
          <h1 class="text-xl font-semibold text-gray-900">Kelola Kuisioner & Pertanyaan</h1>
        </div>
        <div class="flex gap-2">
          <button class="px-3 py-2 text-sm text-gray-700 border rounded" @click="loadData" :disabled="loading">
            {{ loading ? 'Memuat...' : 'Refresh' }}
          </button>
          <button class="px-3 py-2 text-sm text-white bg-indigo-600 rounded" @click="openCreate">
            Tambah Kuisioner
          </button>
        </div>
      </header>

      <section class="grid gap-3 sm:grid-cols-3">
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-gray-600">Filter audience</span>
          <select v-model="filters.audience" class="px-3 py-2 border rounded" @change="loadData">
            <option value="">Semua</option>
            <option value="alumni">Alumni</option>
            <option value="pengguna">Pengguna alumni</option>
            <option value="umum">Umum</option>
          </select>
        </label>
        <label class="flex flex-col gap-1 text-sm sm:col-span-2">
          <span class="text-gray-600">Cari judul</span>
          <input
            v-model="filters.search"
            class="px-3 py-2 border rounded"
            type="search"
            placeholder="Tracer Study 2025"
            @keyup.enter="loadData"
          />
        </label>
      </section>

      <section v-if="error" class="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
        {{ error }}
      </section>
      <section
        v-if="successMessage"
        class="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded"
      >
        {{ successMessage }}
      </section>

      <section class="overflow-auto bg-white border rounded">
        <table class="min-w-full text-sm">
          <thead class="text-left bg-gray-50">
            <tr>
              <th class="px-4 py-3 font-semibold">Judul</th>
              <th class="px-4 py-3 font-semibold">Audience</th>
              <th class="px-4 py-3 font-semibold">Status</th>
              <th class="px-4 py-3 font-semibold">Pertanyaan</th>
              <th class="px-4 py-3 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="5" class="px-4 py-6 text-center text-gray-500">Memuat data...</td>
            </tr>
            <tr v-else-if="!questionnaires.length">
              <td colspan="5" class="px-4 py-6 text-center text-gray-500">Belum ada kuisioner</td>
            </tr>
            <tr v-for="item in questionnaires" :key="item.id" class="border-t">
              <td class="px-4 py-3">
                <p class="font-semibold text-gray-900">{{ item.title }}</p>
                <p class="text-gray-500">{{ item.description }}</p>
              </td>
              <td class="px-4 py-3">
            <span
              class="px-2 py-1 text-xs font-medium rounded-full"
              :class="
                item.audience === 'pengguna'
                  ? 'bg-blue-50 text-blue-700'
                  : item.audience === 'umum'
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-emerald-50 text-emerald-700'
              "
            >
              {{ item.audience === 'pengguna' ? 'Pengguna alumni' : item.audience === 'umum' ? 'Umum' : 'Alumni' }}
            </span>
          </td>
              <td class="px-4 py-3">
                <span
                  class="px-2 py-1 text-xs font-medium rounded-full"
                  :class="item.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'"
                >
                  {{ item.active ? 'Aktif' : 'Tidak aktif' }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-700">
                <p>{{ item.questionCount || 0 }} pertanyaan</p>
              </td>
              <td class="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                <button class="text-indigo-600 hover:underline" @click="handleUpdate(item)">Edit</button>
                <button
                  class="text-gray-600 hover:underline"
                  @click="handleSetActive(item)"
                  :disabled="item.active || loading"
                >
                  Jadikan aktif
                </button>
                <button class="text-red-600 hover:underline" @click="handleDelete(item)">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-if="showForm" class="p-4 bg-white border rounded space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">
            {{ isEditing ? 'Ubah Kuisioner' : 'Tambah Kuisioner' }}
          </h2>
          <button class="text-sm text-gray-500 hover:underline" @click="closeForm">Tutup</button>
        </div>
        <div class="grid gap-3 md:grid-cols-2">
          <label class="flex flex-col gap-1 text-sm">
            <span class="text-gray-700">Judul</span>
            <input v-model="form.title" class="px-3 py-2 border rounded" placeholder="Tracer Study 2025" />
          </label>
          <label class="flex flex-col gap-1 text-sm">
            <span class="text-gray-700">Audience</span>
            <select v-model="form.audience" class="px-3 py-2 border rounded">
              <option value="alumni">Alumni</option>
              <option value="pengguna">Pengguna alumni</option>
              <option value="umum">Umum</option>
            </select>
          </label>
          <label class="flex flex-col gap-1 text-sm md:col-span-2">
            <span class="text-gray-700">Deskripsi singkat</span>
            <textarea v-model="form.description" class="px-3 py-2 border rounded" rows="2" />
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input v-model="form.active" type="checkbox" class="w-4 h-4" />
            <span>Set sebagai kuisioner aktif</span>
          </label>
        </div>
        <div class="flex gap-2">
          <button
            class="px-4 py-2 text-sm text-white bg-indigo-600 rounded"
            :disabled="saving"
            @click="handleSubmit"
          >
            {{ saving ? 'Menyimpan...' : 'Simpan' }}
          </button>
          <button class="px-4 py-2 text-sm text-gray-600 border rounded" @click="closeForm">Batal</button>
        </div>
      </section>
    </div>
  </AdminShell>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import AdminShell from '@/components/AdminShell.vue'
import tracerService from '@/services/tracerService'

const loading = ref(false)
const saving = ref(false)
const questionnaires = ref([])
const error = ref('')
const successMessage = ref('')
const showForm = ref(false)

const filters = reactive({
  audience: '',
  search: '',
})

const form = reactive({
  id: null,
  title: '',
  audience: 'alumni',
  description: '',
  active: true,
})

const isEditing = computed(() => !!form.id)

const normalizeList = (payload) => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (payload.data && Array.isArray(payload.data)) return payload.data
  if (payload.items && Array.isArray(payload.items)) return payload.items
  return []
}

const resetForm = () => {
  form.id = null
  form.title = ''
  form.audience = 'alumni'
  form.description = ''
  form.active = true
}

const closeForm = () => {
  showForm.value = false
  resetForm()
}

const openCreate = () => {
  resetForm()
  showForm.value = true
}

const loadData = async () => {
  loading.value = true
  error.value = ''
  try {
    const data = await tracerService.getQuestionnaires({
      audience: filters.audience || undefined,
      search: filters.search || undefined,
    })
    questionnaires.value = normalizeList(data)
  } catch (err) {
    error.value = err.message || 'Gagal memuat kuisioner'
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  saving.value = true
  error.value = ''
  successMessage.value = ''
  try {
    const payload = {
      title: form.title,
      audience: form.audience,
      description: form.description,
      active: form.active,
    }
    if (isEditing.value) {
      await tracerService.updateQuestionnaire(form.id, payload)
      successMessage.value = 'Kuisioner diperbarui'
    } else {
      await tracerService.createQuestionnaire(payload)
      successMessage.value = 'Kuisioner ditambahkan'
    }
    await loadData()
    closeForm()
  } catch (err) {
    error.value = err.message || 'Gagal menyimpan kuisioner'
  } finally {
    saving.value = false
  }
}

const handleUpdate = (item) => {
  form.id = item.id
  form.title = item.title
  form.audience = item.audience
  form.description = item.description
  form.active = !!item.active
  showForm.value = true
}

const handleDelete = async (item) => {
  const confirmed = window.confirm(`Hapus kuisioner "${item.title}"?`)
  if (!confirmed) return
  try {
    await tracerService.deleteQuestionnaire(item.id)
    successMessage.value = 'Kuisioner dihapus'
    await loadData()
  } catch (err) {
    error.value = err.message || 'Gagal menghapus kuisioner'
  }
}

const handleSetActive = async (item) => {
  try {
    await tracerService.updateQuestionnaire(item.id, { active: true })
    successMessage.value = 'Kuisioner diaktifkan'
    await loadData()
  } catch (err) {
    error.value = err.message || 'Gagal mengubah status'
  }
}

onMounted(loadData)
</script>
