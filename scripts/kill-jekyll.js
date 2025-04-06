import { exec } from 'child_process';

exec('pkill -f "jekyll" || true', (error, stdout, stderr) => {
  if (error) {
    console.log('No Jekyll processes found or could not kill.');
  } else {
    console.log('Jekyll processes terminated successfully.');
  }
  process.exit(0);
});