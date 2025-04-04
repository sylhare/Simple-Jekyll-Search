import { defineConfig } from 'cypress';
import plugin from './cypress/plugins/index.ts';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/integration/**/*.ts',
    video: false,
    screenshotOnRunFailure: false,
    setupNodeEvents(on, config) {
      console.log('Config setupNodeEvents called');
      return plugin(on, config);
    },
  },
}); 