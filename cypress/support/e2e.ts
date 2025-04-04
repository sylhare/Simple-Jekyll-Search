// Import commands.js using ES2015 syntax:
import './commands';

// Hide XHR requests from command log
const app = window.top as Window & typeof globalThis;
if (app) {
  app.console.log = () => {};
} 