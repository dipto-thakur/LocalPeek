#!/usr/bin/env node

'use strict';

// CAVEMAN: This file just hands off to src/cli.js.
// Keep it tiny so `require` overhead on startup stays low.

const { run } = require('../src/cli.js');

run(process.argv.slice(2)).catch((err) => {
  // Last-resort catch. Anything expected should already be handled
  // inside cli.js with a friendly message. This is only for truly
  // unexpected crashes.
  // eslint-disable-next-line no-console
  console.error('\nLocalPeek hit an unexpected error:\n');
  // eslint-disable-next-line no-console
  console.error(err && err.stack ? err.stack : err);
  process.exitCode = 1;
});
