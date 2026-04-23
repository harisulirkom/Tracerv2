<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'

const router = useRouter()
const auth = useAuth()

const user = computed(() => auth.user.value || {})

const form = reactive({
  avatar:
    user.value.avatar ||
    'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=240&q=60',
  fullName: user.value.fullName || user.value.name || '',
  username: user.value.username || '',
  email: user.value.email || '',
  password: '',
})

const saving = ref(false)
const processingAvatar = ref(false)
const avatarDirty = ref(false)
const confirmSaveOpen = ref(false)
const message = ref('')
const error = ref('')

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'))
    reader.readAsDataURL(file)
  })

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Gagal memuat pratinjau gambar.'))
    img.src = src
  })

const compressAvatarImage = async (file) => {
  const source = await fileToDataUrl(file)
  if (typeof source !== 'string') {
    throw new Error('Format gambar tidak valid.')
  }

  const image = await loadImage(source)
  const maxDimension = 720
  const ratio = Math.min(1, maxDimension / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * ratio))
  const height = Math.max(1, Math.round(image.height * ratio))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Browser tidak mendukung pemrosesan gambar.')
  }

  context.drawImage(image, 0, 0, width, height)

  let quality = 0.85
  let dataUrl = canvas.toDataURL('image/jpeg', quality)

  // Keep payload small so reverse proxy / PHP body limits are less likely to reject it.
  while (dataUrl.length > 850_000 && quality > 0.45) {
    quality -= 0.1
    dataUrl = canvas.toDataURL('image/jpeg', quality)
  }

  if (dataUrl.length > 950_000) {
    throw new Error('Ukuran foto terlalu besar. Gunakan foto dengan resolusi lebih kecil.')
  }

  return dataUrl
}

const handleAvatarChange = async (event) => {
  const [file] = event.target.files || []
  if (!file) return

  message.value = ''
  error.value = ''
  processingAvatar.value = true

  try {
    const compressed = await compressAvatarImage(file)
    form.avatar = compressed
    avatarDirty.value = true
  } catch (e) {
    error.value = e?.message || 'Gagal memproses foto profil.'
  } finally {
    processingAvatar.value = false
  }
}

const handleSubmit = async () => {
  message.value = ''
  error.value = ''

  saving.value = true

  const ok = await auth.updateProfile({
    ...(avatarDirty.value ? { avatar: form.avatar } : {}),
    fullName: form.fullName,
    username: form.username,
    email: form.email,
    password: form.password || undefined,
  })

  saving.value = false

  if (ok) {
    message.value = 'Profil berhasil diperbarui'
    form.password = ''
    avatarDirty.value = false
  } else {
    error.value = 'Gagal memperbarui profil admin'
  }
}

const requestSaveSubmit = () => {
  if (saving.value) return
  message.value = ''
  error.value = ''
  confirmSaveOpen.value = true
}

const closeSaveConfirm = () => {
  confirmSaveOpen.value = false
}

const confirmSaveSubmit = async () => {
  if (saving.value) return
  confirmSaveOpen.value = false
  await handleSubmit()
}

const goBack = () => {
  router.push('/admin')
}
</script>

<template>
  <AdminShell>
    <div class="min-h-screen bg-slate-100 text-slate-900">
      <div class="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <header class="mb-6 flex items-center justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Pengaturan</p>
            <h1 class="mt-1 text-2xl font-semibold text-slate-900">Profil admin</h1>
            <p class="mt-1 text-xs text-slate-500">
              Ubah informasi akun untuk tampilan panel admin.
            </p>
          </div>
          <button
            type="button"
            class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            @click="goBack"
          >
            Kembali ke dashboard
          </button>
        </header>

        <div class="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200/70">
          <div class="flex flex-col gap-6 md:flex-row">
            <div class="flex flex-col items-center gap-3 md:w-1/3">
              <div class="h-24 w-24 overflow-hidden rounded-2xl bg-slate-100">
                <img :src="form.avatar" alt="Foto admin" class="h-full w-full object-cover" />
              </div>
              <p class="text-xs text-slate-500 text-center">
                Pilih file gambar dari komputer untuk foto profil admin.
              </p>
            </div>

            <form class="grid flex-1 gap-4 md:grid-cols-2" @submit.prevent="requestSaveSubmit">
              <div class="md:col-span-2">
                <label class="block text-xs font-semibold text-slate-600">Foto profil</label>
                <input
                  type="file"
                  accept="image/*"
                  class="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-800"
                  @change="handleAvatarChange"
                />
                <p v-if="processingAvatar" class="mt-2 text-xs text-slate-500">
                  Memproses foto agar upload lebih stabil...
                </p>
              </div>

              <div class="md:col-span-2">
                <label class="block text-xs font-semibold text-slate-600">Nama lengkap</label>
                <input
                  v-model="form.fullName"
                  type="text"
                  class="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
                  placeholder="Nama lengkap admin"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-600">Username</label>
                <input
                  v-model="form.username"
                  type="text"
                  class="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
                  placeholder="username"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-600">Email</label>
                <input
                  v-model="form.email"
                  type="email"
                  class="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
                  placeholder="admin@tracer.local"
                />
              </div>

              <div class="md:col-span-2">
                <label class="block text-xs font-semibold text-slate-600">
                  Password
                  <span class="font-normal text-slate-400">(kosongkan jika tidak diganti)</span>
                </label>
                <input
                  v-model="form.password"
                  type="password"
                  class="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
                  placeholder="Password baru"
                />
              </div>

              <div class="mt-3 flex gap-3 md:col-span-2">
                <button
                  type="submit"
                  class="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  :disabled="saving || processingAvatar"
                >
                  {{ saving ? 'Menyimpan...' : 'Simpan perubahan' }}
                </button>
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  @click="goBack"
                >
                  Batal
                </button>
              </div>

              <p v-if="message" class="mt-1 text-xs font-semibold text-emerald-600 md:col-span-2">
                {{ message }}
              </p>
              <p v-if="error" class="mt-1 text-xs font-semibold text-rose-600 md:col-span-2">
                {{ error }}
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
    <Transition name="alert-dialog">
      <div
        v-if="confirmSaveOpen"
        class="alert-dialog-backdrop fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4 py-6"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="profile-save-confirm-title"
        aria-describedby="profile-save-confirm-desc"
        @click.self="closeSaveConfirm"
      >
        <div class="alert-dialog-panel w-full max-w-md rounded-2xl bg-white p-6 shadow-xl shadow-slate-900/20">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600">Konfirmasi</p>
              <h3 id="profile-save-confirm-title" class="text-lg font-semibold text-slate-900">
                Simpan perubahan profil admin?
              </h3>
              <p id="profile-save-confirm-desc" class="mt-2 text-sm text-slate-600">
                Perubahan profil untuk
                <span class="font-semibold text-slate-900">{{ form.fullName || form.username || 'admin' }}</span>
                akan disimpan ke sistem.
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
  </AdminShell>
</template>
