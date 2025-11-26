<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../stores/auth'

const email = ref('')
const password = ref('')
const auth = useAuth()
const router = useRouter()
const route = useRoute()
const error = ref('')

const loading = ref(false)

const onSubmit = async () => {
  if (!email.value || !password.value) {
    error.value = 'Email dan password wajib diisi.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const ok = await auth.login(email.value, password.value)
    if (!ok) {
      error.value = 'Kredensial salah. Coba email: admin@tracer.local, password: admin123.'
      return
    }
    const redirect = route.query.redirect || '/admin'
    router.push(redirect)
  } catch (err) {
    error.value = err?.message || 'Gagal login.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-8">
    <header class="space-y-3">
      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Login</p>
      <h1 class="text-3xl font-semibold text-slate-900">Masuk ke dashboard tracer</h1>
      <p class="text-slate-600">Kelola kuisioner, pantau respon, dan unduh laporan.</p>
    </header>

    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <form class="grid gap-4" @submit.prevent="onSubmit">
        <div>
          <label class="text-sm font-semibold text-slate-900">Email</label>
          <input
            v-model="email"
            type="email"
            class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none"
            placeholder="email@contoh.com"
            required
          />
        </div>
        <div>
          <label class="text-sm font-semibold text-slate-900">Password</label>
          <input
            v-model="password"
            type="password"
            class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none"
            placeholder="********"
            required
          />
        </div>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label class="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" class="h-4 w-4 rounded border-slate-300 bg-white text-indigo-500" />
            Ingat saya
          </label>
          <button type="button" class="text-sm font-semibold text-indigo-600 hover:text-indigo-500">Lupa password?</button>
        </div>
        <p v-if="error" class="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
          {{ error }}
        </p>
        <button
          class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110"
          type="submit"
        >
          Masuk
        </button>
      </form>
    </div>
  </div>
</template>
