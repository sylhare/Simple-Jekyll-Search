import { exec } from 'child_process';

console.log('Starting Jekyll server in detached mode...');

exec('cd example && bundle exec jekyll serve --detach', (error, stdout, stderr) => {
  if (error) {
    console.error('Error starting Jekyll server:', error);
    process.exit(1);
  }

  console.log('Jekyll server started successfully!');
  console.log(stdout);

  if (stderr) {
    console.error('Jekyll warnings:', stderr);
  }

  process.exit(0);
});