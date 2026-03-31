<script setup>
import BaseChart from './BaseChart.vue'

const props = defineProps({
  chartData: {
    type: Object,
    required: true,
  },
  height: {
    type: Number,
    default: 320,
  },
  options: {
    type: Object,
    default: () => ({}),
  },
})
</script>

<template>
  <BaseChart type="radar" :data="chartData" :options="options" :height="height" />
</template>
