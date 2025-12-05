const { exec, spawn, fork } = require('child_process');

exec('ls', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing command: ${error.message}`);
    return;
  }

  if (stderr) {
    console.error(`Command stderr: ${stderr}`);
  }

  console.log(`Command output:\n${stdout}`);
});

