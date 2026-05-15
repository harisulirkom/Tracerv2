<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getActivePopupBanner } from '../services/popupBannerService'

const route = useRoute()
const banner = ref(null)
const visible = ref(false)
const loading = ref(false)

const isAdminRoute = computed(() => String(route.path || '').startsWith('/admin'))

const dismiss = () => {
  visible.value = false
}

const openLink = () => {
  const url = banner.value?.linkUrl
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

onMounted(async () => {
  if (isAdminRoute.value) return
  loading.value = true
  try {
    const active = await getActivePopupBanner()
    if (!active?.id || !active?.imageUrl) return
    banner.value = active
    visible.value = true
  } catch (error) {
    visible.value = false
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible && banner && !loading"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-3 py-4 backdrop-blur-xl sm:px-5 sm:py-6"
      role="dialog"
      aria-modal="true"
      :aria-label="banner.title || 'Popup banner'"
      @click.self="dismiss"
    >
      <section
        class="relative flex max-h-[94vh] w-fit max-w-[94vw] flex-col overflow-hidden rounded-[2rem] border border-white/45 bg-white/18 shadow-[0_28px_90px_rgba(15,23,42,0.48)] backdrop-blur-2xl ring-1 ring-white/25"
      >
        <div class="pointer-events-none absolute inset-0 z-[1] rounded-[2rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.5),rgba(255,255,255,0.08)_42%,rgba(125,211,252,0.16))]"></div>
        <div class="pointer-events-none absolute -left-16 -top-20 z-[1] h-48 w-48 rounded-full bg-sky-300/25 blur-3xl"></div>
        <div class="pointer-events-none absolute -bottom-24 right-10 z-[1] h-52 w-52 rounded-full bg-indigo-300/20 blur-3xl"></div>

        <button
          type="button"
          class="absolute right-3 top-3 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/55 bg-white/25 text-2xl font-semibold leading-none text-white shadow-[0_14px_34px_rgba(15,23,42,0.28)] backdrop-blur-xl transition hover:bg-white/35 focus:outline-none focus:ring-2 focus:ring-white/70"
          aria-label="Tutup popup"
          @click="dismiss"
        >
          x
        </button>

        <div class="relative z-[2] flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-t-[2rem]">
          <img
            :src="banner.imageUrl"
            :alt="banner.title || 'Pamflet acara'"
            class="block h-auto max-h-[78vh] max-w-[94vw] object-contain"
          />
        </div>

        <div
          class="relative z-[2] flex shrink-0 flex-col gap-3 border-t border-white/40 bg-white/72 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-7"
        >
          <div class="min-w-0">
            <h2 class="text-xl font-semibold text-slate-950">{{ banner.title }}</h2>
            <p v-if="banner.description" class="mt-1 text-sm leading-relaxed text-slate-600">
              {{ banner.description }}
            </p>
          </div>

          <div class="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <button
              v-if="banner.linkUrl"
              type="button"
              class="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.22)] transition hover:bg-slate-800"
              @click="openLink"
            >
              {{ banner.buttonLabel || 'Lihat detail' }}
            </button>
            <button
              type="button"
              class="rounded-full border border-white/70 bg-white/55 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-md transition hover:bg-white/80"
              @click="dismiss"
            >
              Close
            </button>
          </div>
        </div>
      </section>
    </div>
  </Teleport>
</template>
