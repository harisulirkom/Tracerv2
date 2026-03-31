<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, setAppLocale } from '@/i18n'

const { locale, t } = useI18n()
const expanded = ref(false)

const locales = computed(() =>
  SUPPORTED_LOCALES.map((code) => ({
    code,
    short: code.toUpperCase(),
    label: t(`language.names.${code}`),
  })),
)

const activeLocale = computed(() => locales.value.find((entry) => entry.code === locale.value) || locales.value[0])
const otherLocales = computed(() => locales.value.filter((entry) => entry.code !== locale.value))

const selectLocale = (code) => {
  setAppLocale(code)
  expanded.value = false
}

const openMenu = () => {
  expanded.value = true
}
const closeMenu = () => {
  expanded.value = false
}
const toggleMenu = () => {
  expanded.value = !expanded.value
}
</script>

<template>
  <div class="pointer-events-none fixed bottom-5 right-5 z-[70]">
    <div
      class="lang-shine-wrap rounded-md p-[1.5px] pointer-events-auto"
      @mouseenter="openMenu"
      @mouseleave="closeMenu"
    >
      <div class="rounded-[8px] bg-white/95 px-2 py-2 shadow-xl ring-1 ring-white/70 backdrop-blur-md">
        <p class="px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {{ t('language.label') }}
        </p>

        <button
          type="button"
          class="mt-1.5 flex min-w-[68px] items-center justify-center rounded-[6px] bg-gradient-to-r from-indigo-500 to-sky-500 px-3 py-2 text-[11px] font-semibold text-white shadow-sm"
          :aria-label="`${t('language.switchTo')} ${activeLocale?.label || ''}`"
          :aria-expanded="expanded"
          @click="toggleMenu"
        >
          <span>{{ activeLocale?.short || 'ID' }}</span>
        </button>

        <transition name="fade">
          <div v-show="expanded" class="mt-1.5 grid grid-cols-1 gap-1">
            <button
              v-for="entry in otherLocales"
              :key="entry.code"
              type="button"
              class="rounded-[6px] bg-slate-100 px-2 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-200"
              :aria-label="`${t('language.switchTo')} ${entry.label}`"
              :title="entry.label"
              @click="selectLocale(entry.code)"
            >
              {{ entry.short }}
            </button>
          </div>
        </transition>

      </div>
    </div>
  </div>
</template>

<style scoped>
.lang-shine-wrap {
  position: relative;
  overflow: hidden;
  background: linear-gradient(120deg, rgba(99, 102, 241, 0.78), rgba(56, 189, 248, 0.72), rgba(99, 102, 241, 0.78));
  background-size: 240% 240%;
  animation: lang-border-flow 4s linear infinite;
}

.lang-shine-wrap::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(110deg, transparent 24%, rgba(255, 255, 255, 0.68) 46%, transparent 63%);
  transform: translateX(-140%);
  animation: lang-border-sweep 2.8s ease-in-out infinite;
}

@keyframes lang-border-flow {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
}

@keyframes lang-border-sweep {
  0% {
    transform: translateX(-140%);
  }
  65%,
  100% {
    transform: translateX(140%);
  }
}
</style>
