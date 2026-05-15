<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getActivePopupBanner } from '../services/popupBannerService'

const route = useRoute()
const banner = ref(null)
const visible = ref(false)
const loading = ref(false)

const storageKey = computed(() => {
  if (!banner.value?.id) return ''
  const version = banner.value.updatedAt || banner.value.imageUrl || ''
  return `dismissed_popup_banner_${banner.value.id}_${encodeURIComponent(version)}`
})
const isAdminRoute = computed(() => String(route.path || '').startsWith('/admin'))

const hasDismissed = (key) => {
  if (!key || typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(key) === '1'
  } catch (error) {
    return false
  }
}

const dismiss = () => {
  visible.value = false
  if (!storageKey.value || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey.value, '1')
  } catch (error) {
  }
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
    visible.value = !hasDismissed(storageKey.value)
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
      class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      :aria-label="banner.title || 'Popup banner'"
      @click.self="dismiss"
    >
      <section class="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-950/30">
        <button
          type="button"
          class="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-xl font-semibold leading-none text-slate-700 shadow-lg ring-1 ring-slate-200 transition hover:bg-slate-100"
          aria-label="Tutup popup"
          @click="dismiss"
        >
          ×
        </button>

        <div class="max-h-[78vh] overflow-y-auto">
          <img
            :src="banner.imageUrl"
            :alt="banner.title || 'Pamflet acara'"
            class="h-auto w-full bg-slate-100 object-contain"
          />

          <div class="space-y-3 px-5 py-4 sm:px-6">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">{{ banner.title }}</h2>
              <p v-if="banner.description" class="mt-1 text-sm leading-relaxed text-slate-600">
                {{ banner.description }}
              </p>
            </div>

            <div class="flex flex-wrap items-center justify-end gap-2">
              <button
                v-if="banner.linkUrl"
                type="button"
                class="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                @click="openLink"
              >
                {{ banner.buttonLabel || 'Lihat detail' }}
              </button>
              <button
                type="button"
                class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                @click="dismiss"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </Teleport>
</template>
