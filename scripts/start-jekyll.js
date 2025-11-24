import { spawn, exec } from 'child_process';

console.log('Checking for processes on port 4000...');

// Kill any process using port 4000
exec('lsof -ti:4000 | xargs kill -9 2>/dev/null || true', (error, stdout, stderr) => {
  if (stdout) {
    console.log('Killed process on port 4000');
  } else {
    console.log('No process found on port 4000');
  }
  
  console.log('Starting Jekyll server in detached mode...');
  
  const jekyllProcess = spawn('bundle', ['exec', 'jekyll', 'serve', '--detach'], {
    cwd: 'docs',
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      LANG: 'en_US.UTF-8',
      LC_ALL: 'en_US.UTF-8',
      LC_CTYPE: 'en_US.UTF-8'
    }
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
});