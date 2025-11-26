<template>
  <section class="p-6 bg-white border rounded space-y-4">
    <header class="space-y-1">
      <p class="text-xs text-gray-500 uppercase">{{ subtitle }}</p>
      <h2 class="text-lg font-semibold text-gray-900">{{ title }}</h2>
      <p v-if="description" class="text-sm text-gray-600">{{ description }}</p>
    </header>

    <div v-if="error" class="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
      {{ error }}
    </div>

    <div class="grid gap-3 md:grid-cols-2">
      <div
        v-for="field in schema"
        :key="field.key"
        class="flex flex-col gap-1 text-sm"
        :class="field.fullWidth ? 'md:col-span-2' : ''"
      >
        <label class="text-gray-700">
          {{ field.label }}
          <span v-if="field.required" class="text-red-500">*</span>
        </label>
        <template v-if="field.type === 'textarea'">
          <textarea
            v-model="formState[field.key]"
            class="px-3 py-2 border rounded"
            :rows="field.rows || 3"
            :placeholder="field.placeholder"
          />
        </template>
        <template v-else-if="field.type === 'select'">
          <select v-model="formState[field.key]" class="px-3 py-2 border rounded">
            <option value="">{{ field.placeholder || 'Pilih' }}</option>
            <option v-for="opt in field.options || []" :key="opt.value || opt" :value="opt.value || opt">
              {{ opt.label || opt }}
            </option>
          </select>
        </template>
        <template v-else>
          <input
            v-model="formState[field.key]"
            class="px-3 py-2 border rounded"
            :type="field.type || 'text'"
            :placeholder="field.placeholder"
          />
        </template>
        <p v-if="field.help" class="text-xs text-gray-500">{{ field.help }}</p>
      </div>
    </div>

    <div class="flex gap-2">
      <button
        class="px-4 py-2 text-sm text-white bg-indigo-600 rounded"
        :disabled="loading"
        @click="handleSubmit"
      >
        {{ loading ? 'Menyimpan...' : submitLabel }}
      </button>
      <button class="px-4 py-2 text-sm text-gray-700 border rounded" @click="$emit('cancel')">Batal</button>
    </div>
  </section>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  title: { type: String, default: 'Form' },
  subtitle: { type: String, default: '' },
  description: { type: String, default: '' },
  schema: { type: Array, default: () => [] },
  modelValue: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  submitLabel: { type: String, default: 'Simpan' },
})

const emit = defineEmits(['submit', 'cancel', 'update:modelValue'])
const formState = reactive({ ...props.modelValue })

watch(
  () => props.modelValue,
  (val) => {
    Object.keys(formState).forEach((key) => delete formState[key])
    Object.entries(val || {}).forEach(([key, value]) => {
      formState[key] = value
    })
  },
  { deep: true },
)

watch(
  formState,
  (val) => {
    emit('update:modelValue', { ...val })
  },
  { deep: true },
)

const handleSubmit = () => {
  emit('submit', { ...formState })
}
</script>
