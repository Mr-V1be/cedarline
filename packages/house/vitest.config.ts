import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    name: 'house',
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
})
