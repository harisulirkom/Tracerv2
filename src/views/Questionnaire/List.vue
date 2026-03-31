<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import questionnaireService from '@/services/questionnaireService'

const router = useRouter()
const items = ref([])
const loading = ref(false)
const error = ref('')

const fetchData = async () => {
  loading.value = true
  error.value = ''
  try {
    const data = await questionnaireService.getAll()
    items.value = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
  } catch (err) {
    error.value = err?.message || 'Gagal memuat kuisioner'
  } finally {
    loading.value = false
  }
}

const goCreate = () => router.push({ name: 'QuestionnaireCreate' })
const goDetail = (id) => router.push({ name: 'QuestionnaireDetail', params: { id } })

onMounted(fetchData)
</script>

<template>
  <main class="mx-auto max-w-5xl space-y-6 py-8">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Kuisioner</p>
        <h1 class="text-2xl font-semibold text-slate-900">Daftar Kuisioner</h1>
        <p class="text-sm text-slate-600">Data diambil dari backend melalui Axios.</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
        @click="goCreate"
      >
        Tambah Kuisioner
      </button>
    </header>

    <section v-if="error" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {{ error }}
    </section>

    <section
      v-if="loading"
      class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
    >
      Memuat kuisioner...
    </section>

    <section v-else class="grid gap-4">
      <article
        v-for="item in items"
        :key="item.id"
        class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1">
            <h2 class="text-lg font-semibold text-slate-900">{{ item.title || 'Tanpa judul' }}</h2>
            <p class="text-sm text-slate-600">{{ item.description || 'Tidak ada deskripsi.' }}</p>
            <p class="text-xs font-semibold text-slate-500">
              ID: <span class="font-mono">{{ item.id }}</span>
            </p>
          </div>
          <button
            type="button"
            class="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
            @click="goDetail(item.id)"
          >
            Detail
          </button>
        </div>
      </article>
      <p v-if="!items.length" class="text-sm text-slate-600">Belum ada kuisioner.</p>
    </section>
  </main>
</template>
