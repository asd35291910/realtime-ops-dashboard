import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // The Docker frontend; override with CYPRESS_BASE_URL (e.g. http://localhost:5173 for `npm run dev`)
    baseUrl: process.env.CYPRESS_BASE_URL ?? 'http://localhost:3000',
    supportFile: false,
    video: false,
  },
})
