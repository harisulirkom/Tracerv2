<template>
  <section class="p-6 bg-white border rounded space-y-4">
    <header class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-xs text-gray-500 uppercase">{{ subtitle }}</p>
        <h2 class="text-lg font-semibold text-gray-900">{{ title }}</h2>
        <p v-if="description" class="text-sm text-gray-600">{{ description }}</p>
      </div>
      <div class="flex gap-2">
        <slot name="actions">
          <button class="px-3 py-2 text-sm text-white bg-indigo-600 rounded" @click="$emit('create')">
            Tambah
          </button>
        </slot>
      </div>
    </header>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-2">
        <input
          v-model="keyword"
          type="search"
          class="px-3 py-2 text-sm border rounded w-64"
          :placeholder="searchPlaceholder"
          @keyup.enter="onSearch"
        />
        <button class="px-3 py-2 text-sm text-gray-700 border rounded" @click="onSearch">Cari</button>
      </div>
      <button class="px-3 py-2 text-sm text-gray-700 border rounded" @click="$emit('refresh')" :disabled="loading">
        {{ loading ? 'Memuat...' : 'Refresh' }}
      </button>
    </div>

    <div v-if="error" class="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
      {{ error }}
    </div>

    <div class="overflow-auto border rounded">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50 text-left">
          <tr>
            <th v-for="col in columns" :key="col.key" class="px-4 py-3 font-semibold">
              {{ col.label }}
            </th>
            <th class="px-4 py-3 text-right font-semibold">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="99" class="px-4 py-6 text-center text-gray-500">Memuat data...</td>
          </tr>
          <tr v-else-if="!items.length">
            <td colspan="99" class="px-4 py-6 text-center text-gray-500">Tidak ada data</td>
          </tr>
          <tr v-for="item in items" :key="item.id || item.key" class="border-t">
            <td v-for="col in columns" :key="col.key" class="px-4 py-3">
              <slot :name="`cell-${col.key}`" :row="item">
                {{ item[col.key] }}
              </slot>
            </td>
            <td class="px-4 py-3 text-right whitespace-nowrap space-x-2">
              <button class="text-indigo-600 hover:underline" @click="$emit('edit', item)">Edit</button>
              <button class="text-red-600 hover:underline" @click="$emit('delete', item)">Hapus</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between text-sm text-gray-500">
      <slot name="footer">
        <span>Gunakan slot <code>cell-{{'{'}}field{{'}'}}</code> untuk kustom tampilan kolom.</span>
      </slot>
    </div>
  </section>
</template>

<script setup>
import { ref, toRefs } from 'vue'

const props = defineProps({
  title: { type: String, default: 'List' },
  subtitle: { type: String, default: '' },
  description: { type: String, default: '' },
  columns: { type: Array, default: () => [] },
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  searchPlaceholder: { type: String, default: 'Cari...' },
})

const { title, subtitle, description, columns, items, loading, error, searchPlaceholder } = toRefs(props)

const emit = defineEmits(['refresh', 'create', 'edit', 'delete', 'search'])

const keyword = ref('')

const onSearch = () => {
  emit('search', keyword.value)
}
</script>
