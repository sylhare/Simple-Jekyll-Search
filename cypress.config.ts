import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.ts',
    video: false,
    screenshotOnRunFailure: false,
    setupNodeEvents(on, _config) {
      on('before:run', (details) => {
        console.log('🚀 Starting Cypress tests:', details.specs?.length || 0, 'spec(s) to run');
        console.log(`Running on: ${details.browser?.name} ${details.browser?.version}`);
        return Promise.resolve();
      });

      on('after:run', (_results) => {
        console.log('✅  Cypress test run completed!');
        return Promise.resolve();
      });
    },
  },
}); 