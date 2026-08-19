import { handlers } from "@/api/handlers"
import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, vi } from "vitest"

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterAll(() => server.close())
afterEach(() => {
  server.resetHandlers()
  cleanup()
})

// Mock localStorage — jsdom doesn't reliably provide window.localStorage
// under newer Node versions with the experimental native Web Storage API.
class LocalStorageMock implements Storage {
  private store = new Map<string, string>()
  get length() {
    return this.store.size
  }
  clear() {
    this.store.clear()
  }
  getItem(key: string) {
    return this.store.get(key) ?? null
  }
  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null
  }
  removeItem(key: string) {
    this.store.delete(key)
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value))
  }
}
const localStorageMock = new LocalStorageMock()
Object.defineProperty(window, "localStorage", {
  writable: true,
  value: localStorageMock,
})
Object.defineProperty(globalThis, "localStorage", {
  writable: true,
  value: localStorageMock,
})

// Mock window.scrollTo
window.scrollTo = vi.fn()

// Mock Element.prototype.scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
global.ResizeObserver = ResizeObserverMock

// Mock IntersectionObserver
class IntersectionObserverMock {
  readonly root: Element | null = null
  readonly rootMargin: string = ""
  readonly thresholds: ReadonlyArray<number> = []
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn().mockReturnValue([])
}
global.IntersectionObserver = IntersectionObserverMock

// Mock URL.createObjectURL and URL.revokeObjectURL
URL.createObjectURL = vi.fn(() => "blob:mock-url")
URL.revokeObjectURL = vi.fn()
