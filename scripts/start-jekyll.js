import { spawn } from 'child_process';

console.log('Starting Jekyll server in detached mode...');

const jekyllProcess = spawn('bundle', ['exec', 'jekyll', 'serve', '--detach'], {
  cwd: 'docs',
  stdio: 'inherit', // Ensures output is displayed in the terminal
  shell: true, // Allows running shell commands
});

jekyllProcess.on('error', (error) => {
  console.error('Error starting Jekyll server:', error.message);
  process.exit(1);
});

jekyllProcess.on('close', (code) => {
  if (code === 0) {
    console.log('Jekyll server started successfully!');
  } else {
    console.error(`Jekyll server exited with code ${code}`);
  }
  process.exit(code);
});