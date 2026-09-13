'use strict';

// CAVEMAN: Astro's dev CLI takes --host and --port, same shape as Vite
// (Astro is built on Vite under the hood).

const DEFAULT_PORT = 4321;

function buildCommand({ project, port, host }) {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

  if (project.devScript) {
    return {
      command: npmCmd,
      args: ['run', 'dev', '--', '--host', host, '--port', String(port)],
      env: process.env,
    };
  }

  return {
    command: npxCmd,
    args: ['astro', 'dev', '--host', host, '--port', String(port)],
    env: process.env,
  };
}

module.exports = { buildCommand, DEFAULT_PORT };
