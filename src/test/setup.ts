import '@testing-library/jest-dom'

// jsdom doesn't always expose a working localStorage; the Zustand persist
// store and its migration shim touch it at import time. Provide a minimal
// in-memory implementation so store-backed components can be tested.
if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
  const store = new Map<string, string>()
  const mock: Storage = {
    getItem: (k) => (store.has(k) ? store.get(k)! : null),
    setItem: (k, v) => void store.set(k, String(v)),
    removeItem: (k) => void store.delete(k),
    clear: () => store.clear(),
    key: (i) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size
    },
  }
  Object.defineProperty(globalThis, 'localStorage', { value: mock, configurable: true })
}
