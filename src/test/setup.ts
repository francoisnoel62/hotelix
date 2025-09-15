import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables for tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5433/hotelix_test'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock Next.js cache revalidation
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))