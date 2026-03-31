<script setup>
import BaseChart from './BaseChart.vue'

const props = defineProps({
  chartData: {
    type: Object,
    required: true,
  },
  height: {
    type: Number,
    default: 260,
  },
  options: {
    type: Object,
    default: () => ({}),
  },
})
</script>

<template>
  <BaseChart type="doughnut" :data="chartData" :options="options" :height="height" />
</template>
