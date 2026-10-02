import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    name: 'configurator',
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
})
