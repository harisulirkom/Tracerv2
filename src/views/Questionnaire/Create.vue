<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import questionnaireService from '@/services/questionnaireService'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const success = ref('')

const form = reactive({
  title: '',
  description: '',
})

const handleSubmit = async () => {
  error.value = ''
  success.value = ''
  // eslint-disable-next-line no-alert
  const confirmed = window.confirm('Apakah Anda yakin menyimpan?')
  if (!confirmed) return
  loading.value = true
  try {
    await questionnaireService.create({
      title: form.title,
      description: form.description,
    })
    success.value = 'Kuisioner berhasil dibuat.'
    router.push({ name: 'QuestionnaireList' })
  } catch (err) {
    error.value = err?.response?.data?.message || err?.message || 'Gagal membuat kuisioner'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-3xl space-y-6 py-8">
    <header class="space-y-2">
      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Kuisioner</p>
      <h1 class="text-2xl font-semibold text-slate-900">Buat Kuisioner</h1>
      <p class="text-sm text-slate-600">Isi judul dan deskripsi, lalu simpan ke backend.</p>
    </header>

    <section v-if="error" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {{ error }}
    </section>
    <section
      v-if="success"
      class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
    >
      {{ success }}
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <label class="block space-y-1">
        <span class="text-sm font-semibold text-slate-800">Judul</span>
        <input
          v-model="form.title"
          type="text"
          class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          placeholder="Tracer Study 2025"
        />
      </label>

      <label class="block space-y-1">
        <span class="text-sm font-semibold text-slate-800">Deskripsi</span>
        <textarea
          v-model="form.description"
          rows="3"
          class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          placeholder="Deskripsi singkat kuisioner"
        />
      </label>

      <div class="flex items-center gap-3">
        <button
          type="button"
          class="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          :disabled="loading"
          @click="handleSubmit"
        >
          {{ loading ? 'Menyimpan...' : 'Simpan' }}
        </button>
        <button
          type="button"
          class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          @click="router.push({ name: 'QuestionnaireList' })"
        >
          Batal
        </button>
      </div>
    </section>
  </main>
</template>
