'use strict';

// CAVEMAN: Generic fallback for any framework we don't special-case
// (Vue, Nuxt, Svelte/SvelteKit, Angular, Remix, or literally anything
// with a "dev" script). We never invent a command that doesn't exist
// in the project — we reuse `scripts.dev` and just try to steer it
// onto the right host/port using common conventions.
//
// Strategy, in order of harmlessness:
//   1. Set PORT and HOST env vars (respected by a lot of tooling).
//   2. Append framework-appropriate CLI flags after `--`, if the
//      caller supplied any (see detect.js `defaultFlags`).
//
// If none of this works for a particular tool, LocalPeek still shows
// the correct LAN URL — worst case the user needs to pass their own
// host flag, which the terminal output points them toward.

function buildCommand({ project, port, host }) {
  const extraFlags = project.defaultFlags || [];
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  const args = ['run', 'dev'];
  if (extraFlags.length > 0) {
    args.push('--', ...extraFlags, '--port', String(port));
  }

  return {
    command: npmCmd,
    args,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: host,
    },
  };
}

module.exports = { buildCommand };
