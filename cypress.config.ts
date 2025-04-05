import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/integration/**/*.ts',
    video: false,
    screenshotOnRunFailure: false,
    setupNodeEvents(on, config) {
    },
  },
}); 