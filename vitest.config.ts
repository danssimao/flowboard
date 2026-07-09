import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    tsconfig: './tsconfig.test.json',
    environment: 'jsdom',
    globals: true,
    setupFiles: './lib/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.{ts,tsx}'],
      exclude: ['lib/**/*.test.*', 'lib/test/**'],
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
    },
  },
})
