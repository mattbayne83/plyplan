import '@testing-library/jest-dom'

// jsdom doesn't always expose working Web Storage; the Zustand persist store
// (sessionStorage) and the legacy-localStorage cleanup touch both at import
// time. Provide minimal in-memory implementations so store-backed components
// can be tested.
const makeStorageMock = (): Storage => {
  const store = new Map<string, string>()
  return {
    getItem: (k) => (store.has(k) ? store.get(k)! : null),
    setItem: (k, v) => void store.set(k, String(v)),
    removeItem: (k) => void store.delete(k),
    clear: () => store.clear(),
    key: (i) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size
    },
  }
}

for (const name of ['localStorage', 'sessionStorage'] as const) {
  const existing = (globalThis as Record<string, unknown>)[name] as Storage | undefined
  if (!existing || typeof existing.getItem !== 'function') {
    Object.defineProperty(globalThis, name, { value: makeStorageMock(), configurable: true })
  }
}
