import { defineConfig, devices } from '@playwright/test'

const isCI = !!process.env.CI

/**
 * E2E: sobe a API (server/) e o front (client/) e testa no Chromium.
 * Banco: use um banco separado (DATABASE_URL) já migrado e com o seed de desenvolvimento.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    locale: 'pt-BR',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npx tsx src/server.ts',
      cwd: '../server',
      url: 'http://localhost:3001/health',
      reuseExistingServer: !isCI,
      timeout: 60_000,
      env: { NODE_ENV: 'development', PORT: '3001' },
    },
    {
      command: isCI ? 'npm run start' : 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
  ],
})
