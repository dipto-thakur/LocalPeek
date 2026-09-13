'use strict';

// CAVEMAN: Next's dev CLI takes -H (hostname) and -p (port).
// Binding -H 0.0.0.0 is what actually makes it reachable from
// another device on the LAN — the default is often localhost-only.

const DEFAULT_PORT = 3000;

function buildCommand({ project, port, host }) {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

  if (project.devScript) {
    return {
      command: npmCmd,
      args: ['run', 'dev', '--', '-H', host, '-p', String(port)],
      env: process.env,
    };
  }

  return {
    command: npxCmd,
    args: ['next', 'dev', '-H', host, '-p', String(port)],
    env: process.env,
  };
}

module.exports = { buildCommand, DEFAULT_PORT };
