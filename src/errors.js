'use strict';

// CAVEMAN: Central place for "known" errors so cli.js can print
// a friendly one-liner instead of a raw stack trace. Anything not
// wrapped in one of these classes is treated as unexpected.

class LocalPeekError extends Error {
  constructor(message, { hint } = {}) {
    super(message);
    this.name = 'LocalPeekError';
    this.hint = hint || null;
  }
}

class NoProjectError extends LocalPeekError {
  constructor(dir) {
    super(`No project found in ${dir}`, {
      hint:
        "Run LocalPeek from inside a project folder (one with an index.html or package.json).",
    });
    this.name = 'NoProjectError';
  }
}

class NoDevCommandError extends LocalPeekError {
  constructor(details) {
    super('Could not figure out how to start this project', {
      hint:
        details ||
        'Add a "dev" script to package.json, or run LocalPeek from a folder with an index.html file.',
    });
    this.name = 'NoDevCommandError';
  }
}

class MissingDependenciesError extends LocalPeekError {
  constructor() {
    super('This project has a package.json but no installed dependencies', {
      hint: 'Run your package manager\'s install command first (for example: npm install), then run LocalPeek again.',
    });
    this.name = 'MissingDependenciesError';
  }
}

class NoLanInterfaceError extends LocalPeekError {
  constructor() {
    super('No usable LAN network address was found on this computer', {
      hint:
        'Connect to Wi-Fi or Ethernet on the same network as your phone, then try again. VPNs and some virtual adapters can hide the real address.',
    });
    this.name = 'NoLanInterfaceError';
  }
}

class PortInUseError extends LocalPeekError {
  constructor(port) {
    super(`Port ${port} is already in use`, {
      hint: 'Free the port, or let LocalPeek pick a different one automatically.',
    });
    this.name = 'PortInUseError';
  }
}

class ServerStartError extends LocalPeekError {
  constructor(reason) {
    super(`The development server failed to start${reason ? `: ${reason}` : ''}`, {
      hint: 'Try running your normal dev command directly to see the full error.',
    });
    this.name = 'ServerStartError';
  }
}

module.exports = {
  LocalPeekError,
  NoProjectError,
  NoDevCommandError,
  MissingDependenciesError,
  NoLanInterfaceError,
  PortInUseError,
  ServerStartError,
};
