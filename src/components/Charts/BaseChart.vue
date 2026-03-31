<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  chartId: {
    type: String,
    default: () => `chart-${Math.random().toString(36).slice(2)}`,
  },
  type: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    required: true,
  },
  options: {
    type: Object,
    default: () => ({}),
  },
  height: {
    type: Number,
    default: 220,
  },
})

const canvasRef = ref(null)
let chartInstance = null

const renderChart = () => {
  if (!canvasRef.value) return
  if (chartInstance) {
    chartInstance.destroy()
  }
  chartInstance = new Chart(canvasRef.value, {
    type: props.type,
    data: props.data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...props.options,
    },
  })
}

onMounted(renderChart)
onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})

watch(
  () => [props.data, props.options],
  () => {
    renderChart()
  },
  { deep: true },
)
</script>

<template>
  <div class="w-full" :style="{ minHeight: `${height}px` }">
    <canvas :id="chartId" ref="canvasRef" class="w-full h-full" />
  </div>
</template>
