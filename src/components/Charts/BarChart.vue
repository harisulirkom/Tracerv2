<script setup>
import { computed } from 'vue'
import BaseChart from './BaseChart.vue'

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  chartData: {
    type: Object,
    required: true,
  },
  options: {
    type: Object,
    default: () => ({}),
  },
  height: {
    type: Number,
    default: 260,
  },
})

const mergedOptions = computed(() => ({
  plugins: {
    legend: { position: 'bottom' },
    ...props.options.plugins,
  },
  scales: {
    x: {
      ticks: { autoSkip: false },
      ...props.options.scales?.x,
    },
    y: {
      beginAtZero: true,
      ...props.options.scales?.y,
    },
    ...props.options.scales,
  },
  ...props.options,
}))
</script>

<template>
  <div class="space-y-3">
    <p v-if="title" class="text-sm font-semibold text-slate-900">{{ title }}</p>
    <BaseChart type="bar" :data="chartData" :options="mergedOptions" :height="height" />
  </div>
</template>
