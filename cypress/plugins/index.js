// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

import { exec } from 'child_process';
import { promisify } from 'util';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let jekyllProcess = null;

console.log('Cypress plugin loaded!');

function waitForServer(url, maxAttempts = 10) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const checkServer = () => {
      attempts++;
      http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          if (attempts >= maxAttempts) {
            reject(new Error(`Server returned status code ${res.statusCode}`));
          } else {
            setTimeout(checkServer, 1000);
          }
        }
      }).on('error', (err) => {
        if (attempts >= maxAttempts) {
          reject(err);
        } else {
          setTimeout(checkServer, 1000);
        }
      });
    };
    checkServer();
  });
}

async function startJekyllServer() {
  const exampleDir = join(__dirname, '..', '..', 'example');
  console.log('Starting Jekyll server in:', exampleDir);
  
  try {
    // First, make sure we're in the example directory
    process.chdir(exampleDir);
    
    // Install dependencies if needed
    console.log('Installing Jekyll dependencies...');
    await execAsync('bundle install');
    
    // Build the site
    console.log('Building Jekyll site...');
    await execAsync('bundle exec jekyll build');
    
    // Start the server
    console.log('Starting Jekyll server...');
    jekyllProcess = exec('bundle exec jekyll serve --detach');
    
    // Wait for server to be ready
    await waitForServer('http://localhost:4000');
    console.log('Jekyll server is ready!');
  } catch (error) {
    console.error('Failed to start Jekyll server:', error);
    throw error;
  }
}

export default function(on, config) {
  console.log('Plugin setup function called!');
  
  on('before:run', async () => {
    console.log('before:run hook triggered');
    try {
      await startJekyllServer();
    } catch (error) {
      console.error('Failed to start Jekyll server:', error);
      throw error;
    }
  });

  on('after:run', async () => {
    console.log('after:run hook triggered');
    // Stop Jekyll server
    if (jekyllProcess) {
      console.log('Stopping Jekyll server...');
      try {
        await execAsync('pkill -f "jekyll serve"');
      } catch (error) {
        console.error('Error stopping Jekyll server:', error);
      }
    }
  });
}
