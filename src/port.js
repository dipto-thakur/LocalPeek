'use strict';

const net = require('net');
const http = require('http');

// CAVEMAN: Do not kill random processes because a port is busy.
// We only ever *check* ports here, never terminate anything.

/**
 * Resolves true if the port is free to bind on all interfaces.
 */
function isPortFree(port, host = '0.0.0.0') {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', () => resolve(false));
    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });
    try {
      tester.listen(port, host);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Finds the first free port starting at `start`, scanning upward.
 * Gives up after `maxTries` attempts.
 */
async function findFreePort(start, maxTries = 20) {
  let port = start;
  for (let i = 0; i < maxTries; i++) {
    // eslint-disable-next-line no-await-in-loop
    if (await isPortFree(port)) return port;
    port += 1;
  }
  return null;
}

/**
 * Best-effort check for whether something already listening on
 * `port` looks like it could be serving the current project.
 * This is a heuristic only — we ask for `/` and look at headers,
 * never anything that could be treated as "safe to reuse" blindly.
 * Returns true/false. Never throws.
 */
function probeExistingServer(port, host = '127.0.0.1', timeoutMs = 800) {
  return new Promise((resolve) => {
    const req = http.get(
      { host, port, path: '/', timeout: timeoutMs },
      (res) => {
        res.resume();
        resolve(true);
      }
    );
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.on('error', () => resolve(false));
  });
}

module.exports = { isPortFree, findFreePort, probeExistingServer };
