<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import AdminShell from '../components/AdminShell.vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import organizationService from '../services/organizationService'
import {
  buildOrganizationTree,
  flattenOrganizationTree,
  getOrganizationDescendantIds,
  organizationApiError,
} from '../utils/organizationStructure'

const members = ref([])
const loading = ref(false)
const saving = ref(false)
const ordering = ref(false)
const deleting = ref(false)
const editingId = ref(null)
const deleteTarget = ref(null)
const message = ref('')
const error = ref('')
const localPreviewUrl = ref('')

const form = reactive({
  name: '',
  position: '',
  parentId: '',
  bio: '',
  email: '',
  phone: '',
  isActive: true,
  photo: null,
  photoUrl: '',
  removePhoto: false,
})

const tree = computed(() => buildOrganizationTree(members.value))
const flattenedTree = computed(() => flattenOrganizationTree(tree.value))
const editingMember = computed(() => members.value.find((item) => item.id === editingId.value) || null)
const unavailableParentIds = computed(() =>
  editingId.value
    ? [Number(editingId.value), ...getOrganizationDescendantIds(members.value, editingId.value)]
    : [],
)
const parentOptions = computed(() =>
  flattenedTree.value.filter((item) => !unavailableParentIds.value.includes(Number(item.id))),
)
const visiblePreviewUrl = computed(() => localPreviewUrl.value || form.photoUrl)

const clearLocalPreview = () => {
  if (localPreviewUrl.value) URL.revokeObjectURL(localPreviewUrl.value)
  localPreviewUrl.value = ''
}

const resetForm = () => {
  clearLocalPreview()
  editingId.value = null
  form.name = ''
  form.position = ''
  form.parentId = ''
  form.bio = ''
  form.email = ''
  form.phone = ''
  form.isActive = true
  form.photo = null
  form.photoUrl = ''
  form.removePhoto = false
}

const loadMembers = async () => {
  loading.value = true
  error.value = ''
  try {
    members.value = await organizationService.getAdminOrganizationMembers()
  } catch (err) {
    error.value = organizationApiError(err, 'Gagal memuat struktur organisasi.')
  } finally {
    loading.value = false
  }
}

const handlePhotoChange = (event) => {
  const file = event.target.files?.[0] || null
  clearLocalPreview()
  if (!file) {
    form.photo = null
    return
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    error.value = 'Foto harus berformat JPG, PNG, atau WebP.'
    event.target.value = ''
    return
  }
  if (file.size > 4 * 1024 * 1024) {
    error.value = 'Ukuran foto maksimal 4 MB.'
    event.target.value = ''
    return
  }
  form.photo = file
  form.removePhoto = false
  localPreviewUrl.value = URL.createObjectURL(file)
  error.value = ''
}

const editMember = (item) => {
  clearLocalPreview()
  editingId.value = item.id
  form.name = item.name || ''
  form.position = item.position || ''
  form.parentId = item.parentId ?? ''
  form.bio = item.bio || ''
  form.email = item.email || ''
  form.phone = item.phone || ''
  form.isActive = !!item.isActive
  form.photo = null
  form.photoUrl = item.photoUrl || ''
  form.removePhoto = false
  message.value = ''
  error.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const removeCurrentPhoto = () => {
  clearLocalPreview()
  form.photo = null
  form.photoUrl = ''
  form.removePhoto = true
}

const saveMember = async () => {
  message.value = ''
  error.value = ''
  if (!form.name.trim() || !form.position.trim()) {
    error.value = 'Nama dan jabatan wajib diisi.'
    return
  }

  saving.value = true
  const payload = {
    name: form.name.trim(),
    position: form.position.trim(),
    parent_id: form.parentId,
    bio: form.bio.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    is_active: form.isActive,
    photo: form.photo,
    remove_photo: form.removePhoto,
  }
  try {
    if (editingId.value) {
      await organizationService.updateOrganizationMember(editingId.value, payload)
      message.value = 'Anggota organisasi berhasil diperbarui.'
    } else {
      await organizationService.createOrganizationMember(payload)
      message.value = 'Anggota organisasi berhasil ditambahkan.'
    }
    resetForm()
    await loadMembers()
  } catch (err) {
    error.value = organizationApiError(err, 'Gagal menyimpan anggota organisasi.')
  } finally {
    saving.value = false
  }
}

const siblingMembers = (item) =>
  members.value
    .filter((candidate) => (candidate.parentId ?? null) === (item.parentId ?? null))
    .sort((left, right) => left.sortOrder - right.sortOrder || left.id - right.id)

const moveMember = async (item, direction) => {
  if (ordering.value) return
  const siblings = siblingMembers(item)
  const index = siblings.findIndex((candidate) => candidate.id === item.id)
  const target = index + direction
  if (index < 0 || target < 0 || target >= siblings.length) return
  ;[siblings[index], siblings[target]] = [siblings[target], siblings[index]]

  ordering.value = true
  message.value = ''
  error.value = ''
  try {
    members.value = await organizationService.reorderOrganizationMembers(
      siblings.map((candidate, sortOrder) => ({ id: candidate.id, sortOrder })),
    )
    message.value = 'Urutan struktur berhasil diperbarui.'
  } catch (err) {
    error.value = organizationApiError(err, 'Gagal mengubah urutan struktur.')
    await loadMembers()
  } finally {
    ordering.value = false
  }
}

const requestDelete = (item) => {
  deleteTarget.value = item
  message.value = ''
  error.value = ''
}

const closeDeleteDialog = () => {
  if (!deleting.value) deleteTarget.value = null
}

const confirmDelete = async () => {
  if (!deleteTarget.value?.id || deleting.value) return
  deleting.value = true
  try {
    await organizationService.deleteOrganizationMember(deleteTarget.value.id)
    if (editingId.value === deleteTarget.value.id) resetForm()
    deleteTarget.value = null
    message.value = 'Anggota organisasi berhasil dihapus.'
    await loadMembers()
  } catch (err) {
    error.value = organizationApiError(err, 'Gagal menghapus anggota organisasi.')
    deleteTarget.value = null
  } finally {
    deleting.value = false
  }
}

onMounted(loadMembers)
onBeforeUnmount(clearLocalPreview)
</script>

<template>
  <AdminShell>
    <div class="max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-10">
      <header>
        <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Profil CDC</p>
        <h1 class="mt-1 text-2xl font-semibold text-slate-900">Struktur organisasi</h1>
        <p class="mt-1 text-sm text-slate-500">Kelola anggota, hubungan atasan–bawahan, dan urutan tampilan halaman publik.</p>
      </header>

      <div v-if="message" class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{{ message }}</div>
      <div v-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{{ error }}</div>

      <div class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section class="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
          <div class="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-base font-semibold text-slate-900">{{ editingId ? 'Edit anggota' : 'Tambah anggota' }}</h2>
              <p class="mt-1 text-xs text-slate-500">Nama dan jabatan wajib diisi.</p>
            </div>
            <button v-if="editingId" type="button" class="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50" @click="resetForm">Batal edit</button>
          </div>

          <form class="space-y-4" @submit.prevent="saveMember">
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="text-xs font-semibold text-slate-600">Nama lengkap
                <input v-model="form.name" required maxlength="255" class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100" />
              </label>
              <label class="text-xs font-semibold text-slate-600">Jabatan
                <input v-model="form.position" required maxlength="255" class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100" />
              </label>
            </div>

            <label class="block text-xs font-semibold text-slate-600">Induk / atasan
              <select v-model="form.parentId" class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100">
                <option value="">Tanpa induk (level teratas)</option>
                <option v-for="item in parentOptions" :key="item.id" :value="item.id">{{ '— '.repeat(item.depth) }}{{ item.position }} — {{ item.name }}</option>
              </select>
            </label>

            <label class="block text-xs font-semibold text-slate-600">Deskripsi singkat
              <textarea v-model="form.bio" rows="3" maxlength="2000" class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"></textarea>
            </label>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="text-xs font-semibold text-slate-600">Email publik
                <input v-model="form.email" type="email" maxlength="255" class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100" />
              </label>
              <label class="text-xs font-semibold text-slate-600">Nomor kontak publik
                <input v-model="form.phone" type="tel" maxlength="50" class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100" />
              </label>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
                <img v-if="visiblePreviewUrl" :src="visiblePreviewUrl" alt="Pratinjau foto anggota" class="h-20 w-20 rounded-2xl object-cover" />
                <div v-else class="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-2xl text-slate-400 ring-1 ring-slate-200">◎</div>
                <div class="flex-1">
                  <label class="block text-xs font-semibold text-slate-600">Foto anggota (JPG, PNG, WebP; maks. 4 MB)
                    <input type="file" accept="image/jpeg,image/png,image/webp" class="mt-2 block w-full text-xs text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:font-semibold file:text-white" @change="handlePhotoChange" />
                  </label>
                  <button v-if="visiblePreviewUrl" type="button" class="mt-2 text-xs font-semibold text-rose-600 hover:text-rose-700" @click="removeCurrentPhoto">Hapus foto</button>
                </div>
              </div>
            </div>

            <label class="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
              <span><span class="block text-sm font-semibold text-slate-800">Tampilkan di halaman publik</span><span class="text-xs text-slate-500">Cabang di bawah anggota nonaktif ikut disembunyikan.</span></span>
              <input v-model="form.isActive" type="checkbox" class="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
            </label>

            <button type="submit" :disabled="saving" class="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400">{{ saving ? 'Menyimpan...' : editingId ? 'Simpan perubahan' : 'Tambah anggota' }}</button>
          </form>
        </section>

        <section class="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
          <div class="mb-5 flex items-start justify-between gap-3">
            <div><h2 class="text-base font-semibold text-slate-900">Pohon organisasi</h2><p class="mt-1 text-xs text-slate-500">Gunakan tombol panah untuk mengubah urutan pada level yang sama.</p></div>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{{ members.length }} anggota</span>
          </div>

          <div v-if="!loading && !flattenedTree.length" class="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">Belum ada anggota organisasi. Tambahkan anggota pertama melalui formulir.</div>
          <div v-else class="space-y-3">
            <article v-for="item in flattenedTree" :key="item.id" class="relative rounded-2xl border border-slate-200 bg-slate-50 p-4" :style="{ marginLeft: `${Math.min(item.depth, 6) * 18}px` }">
              <div v-if="item.depth" class="absolute -left-3 top-1/2 h-px w-3 bg-slate-300"></div>
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                <img v-if="item.photoUrl" :src="item.photoUrl" :alt="`Foto ${item.name}`" class="h-12 w-12 rounded-xl object-cover" />
                <div v-else class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 ring-1 ring-slate-200">◎</div>
                <div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-2"><h3 class="font-semibold text-slate-900">{{ item.name }}</h3><span class="rounded-full px-2 py-0.5 text-[10px] font-semibold" :class="item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'">{{ item.isActive ? 'Aktif' : 'Nonaktif' }}</span></div><p class="mt-1 text-xs text-slate-500">{{ item.position }}</p></div>
                <div class="flex flex-wrap gap-2">
                  <button type="button" aria-label="Naikkan urutan" title="Naikkan urutan" class="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40" :disabled="ordering || siblingMembers(item)[0]?.id === item.id" @click="moveMember(item, -1)">↑</button>
                  <button type="button" aria-label="Turunkan urutan" title="Turunkan urutan" class="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40" :disabled="ordering || siblingMembers(item).at(-1)?.id === item.id" @click="moveMember(item, 1)">↓</button>
                  <button type="button" class="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100" @click="editMember(item)">Edit</button>
                  <button type="button" class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100" @click="requestDelete(item)">Hapus</button>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>

    <LoadingOverlay :active="loading" message="Memuat struktur organisasi..." />

    <Transition name="alert-dialog">
      <div v-if="deleteTarget" class="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4" role="alertdialog" aria-modal="true" aria-labelledby="organization-delete-title" @click.self="closeDeleteDialog">
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">Konfirmasi hapus</p>
          <h3 id="organization-delete-title" class="mt-2 text-lg font-semibold text-slate-900">Hapus {{ deleteTarget.name }}?</h3>
          <p class="mt-2 text-sm leading-relaxed text-slate-600">Data dan foto akan dihapus permanen. Jika masih memiliki bawahan, sistem akan menolak penghapusan.</p>
          <div class="mt-6 flex justify-end gap-3"><button type="button" class="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600" :disabled="deleting" @click="closeDeleteDialog">Batal</button><button type="button" class="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white disabled:bg-rose-300" :disabled="deleting" @click="confirmDelete">{{ deleting ? 'Menghapus...' : 'Hapus permanen' }}</button></div>
        </div>
      </div>
    </Transition>
  </AdminShell>
</template>
