<script setup>
const props = defineProps({
  regions: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
    default: 'Sebaran Lokasi',
  },
})
</script>

<template>
  <div class="space-y-3">
    <p class="text-sm font-semibold text-slate-900">{{ title }}</p>
    <div class="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900/5 to-slate-50 p-4 shadow-sm">
      <div class="h-48 w-full rounded-xl bg-white/70 p-3 text-xs text-slate-500">
        <p class="text-[13px] font-semibold text-slate-800">Heatmap Provinsi</p>
        <div class="mt-2 grid grid-cols-2 gap-2 text-[12px]">
          <p v-for="region in regions" :key="region.province" class="truncate">
            {{ region.province }} · {{ region.count }}
          </p>
        </div>
        <p class="mt-3 text-[11px] uppercase tracking-wider text-slate-400">
          Map placeholder – integrasikan dengan Leaflet/Mapbox kalau tersedia
        </p>
      </div>
    </div>
  </div>
</template>
