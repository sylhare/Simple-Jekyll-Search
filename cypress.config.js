import { defineConfig } from 'cypress';
import plugin from './cypress/plugins/index.js';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/integration/**/*.js',
    video: false,
    screenshotOnRunFailure: false,
    setupNodeEvents(on, config) {
      console.log('Config setupNodeEvents called');
      return plugin(on, config);
    },
  },
}); 