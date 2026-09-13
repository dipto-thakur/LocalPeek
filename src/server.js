'use strict';

const { spawn } = require('child_process');
const { startStaticServer } = require('./adapters/html.js');
const viteAdapter = require('./adapters/vite.js');
const nextAdapter = require('./adapters/next.js');
const astroAdapter = require('./adapters/astro.js');
const genericAdapter = require('./adapters/generic.js');
const { isPortFree } = require('./port.js');
const { ServerStartError } = require('./errors.js');

const ADAPTERS = {
  vite: viteAdapter,
  next: nextAdapter,
  astro: astroAdapter,
  generic: genericAdapter,
};

const DEFAULT_PORTS = {
  html: 4000,
  vite: viteAdapter.DEFAULT_PORT,
  next: nextAdapter.DEFAULT_PORT,
  astro: astroAdapter.DEFAULT_PORT,
  generic: 3000,
};

function defaultPortFor(type) {
  return DEFAULT_PORTS[type] || 3000;
}

/**
 * Waits until something is listening on `port` (i.e. isPortFree
 * returns false), polling every `intervalMs`, up to `timeoutMs`.
 * Resolves true if it became busy (server is up), false on timeout.
 */
function waitUntilListening(port, timeoutMs = 30000, intervalMs = 300) {
  const start = Date.now();
  return new Promise((resolve) => {
    const check = async () => {
      const free = await isPortFree(port);
      if (!free) {
        resolve(true);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        resolve(false);
        return;
      }
      setTimeout(check, intervalMs);
    };
    check();
  });
}

// CAVEMAN: Node warns (DEP0190) when you pass an `args` array AND
// shell:true to spawn() — with a shell, args get concatenated into
// one string rather than passed safely separated, so an unescaped
// arg could break out into shell syntax. We build every argument
// ourselves (ports, hosts, flags) so real-world risk here is low,
// but we still quote defensively and pass ONE command string instead
// of a separate args array, which silences the warning and is the
// actually-correct way to use shell:true.
function quoteArg(arg) {
  const str = String(arg);
  // Bare word made only of safe characters — no quoting needed.
  if (/^[A-Za-z0-9_\-./:@=]+$/.test(str)) return str;

  if (process.platform === 'win32') {
    // CAVEMAN: cmd.exe quoting. Wrap in double quotes, escape
    // any literal double quotes inside.
    return `"${str.replace(/"/g, '""')}"`;
  }

  // POSIX shells: single-quote, escaping any embedded single quotes.
  return `'${str.replace(/'/g, `'\\''`)}'`;
}

function buildCommandString(command, args) {
  return [command, ...args].map(quoteArg).join(' ');
}

/**
 * Spawns the appropriate dev process for a framework project.
 * Returns { child, stop } — stop() gracefully shuts the child down.
 * For "html" projects, use startStaticServer instead (see cli.js).
 */
function spawnDevServer(project, port, host) {
  const adapter = ADAPTERS[project.adapter] || ADAPTERS.generic;
  const { command, args, env } = adapter.buildCommand({ project, port, host });
  const commandString = buildCommandString(command, args);

  let child;
  try {
    child = spawn(commandString, {
      cwd: project.dir,
      env,
      // CAVEMAN: shell:true keeps this working cross-platform for
      // npm/npx-style commands without hardcoding path resolution.
      // Passing one pre-built, pre-quoted string (instead of a
      // separate args array) is what avoids Node's DEP0190 warning.
      shell: true,
      stdio: 'inherit',
    });
  } catch (err) {
    throw new ServerStartError(err.message);
  }

  function stop() {
    if (!child || child.killed) return;
    // CAVEMAN: Ctrl+C on Windows behaves differently than POSIX
    // signals. A plain kill() sends SIGTERM-equivalent everywhere,
    // which is good enough here since we spawned this process
    // ourselves — we are not touching anyone else's process.
    if (process.platform === 'win32') {
      child.kill();
    } else {
      child.kill('SIGINT');
    }
  }

  return { child, stop };
}

module.exports = {
  spawnDevServer,
  startStaticServer,
  waitUntilListening,
  defaultPortFor,
  buildCommandString,
};