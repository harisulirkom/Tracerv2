<template>
  <div
    v-if="active"
    class="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm"
  >
    <div class="flex items-center gap-4 rounded-2xl border border-white/40 bg-white/90 px-5 py-4 shadow-xl">
      <div class="flex items-center gap-1">
        <span class="loading-dot h-2 w-2 rounded-full bg-teal-500" />
        <span class="loading-dot loading-dot-delay-1 h-2 w-2 rounded-full bg-emerald-500" />
        <span class="loading-dot loading-dot-delay-2 h-2 w-2 rounded-full bg-cyan-500" />
      </div>
      <p class="text-sm font-semibold text-slate-700">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  active: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: 'Memuat data...',
  },
})
</script>

<style scoped>
@keyframes loadingDots {
  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.loading-dot {
  animation: loadingDots 1s ease-in-out infinite;
}

.loading-dot-delay-1 {
  animation-delay: 0.15s;
}

.loading-dot-delay-2 {
  animation-delay: 0.3s;
}
</style>
