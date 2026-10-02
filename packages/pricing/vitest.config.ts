import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    name: 'pricing',
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
})
