'use strict';

// CAVEMAN: Vite already understands --host and --port natively.
// Prefer the project's own "dev" script (it may set up plugins,
// env files, etc.) and just append flags after `--`.

const DEFAULT_PORT = 5173;

function buildCommand({ project, port, host }) {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

  if (project.devScript) {
    return {
      command: npmCmd,
      args: ['run', 'dev', '--', '--host', host, '--port', String(port), '--strictPort'],
      env: process.env,
    };
  }

  // No dev script (unlikely for a real Vite project, but possible
  // for a minimal setup) — call the Vite CLI directly.
  return {
    command: npxCmd,
    args: ['vite', '--host', host, '--port', String(port), '--strictPort'],
    env: process.env,
  };
}

module.exports = { buildCommand, DEFAULT_PORT };
