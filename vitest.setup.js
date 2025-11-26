class MemoryStorage {
  constructor() {
    this.store = new Map()
  }

  clear() {
    this.store.clear()
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null
  }

  setItem(key, value) {
    this.store.set(key, String(value))
  }

  removeItem(key) {
    this.store.delete(key)
  }
}

const memoryStorage = new MemoryStorage()

if (typeof window !== 'undefined') {
  window.localStorage = memoryStorage
}

globalThis.localStorage = memoryStorage
