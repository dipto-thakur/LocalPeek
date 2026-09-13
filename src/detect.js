'use strict';

const fs = require('fs');
const path = require('path');
const { NoProjectError, MissingDependenciesError } = require('./errors.js');

// CAVEMAN: We only ever READ files here. Never write, never modify
// the user's project.

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function findFirstExisting(dir, names) {
  return names.find((n) => exists(path.join(dir, n))) || null;
}

// Order matters: check more specific frameworks before generic ones.
// Each entry: { type, adapter, test(pkg, dir) }
const FRAMEWORK_TESTS = [
  {
    type: 'next',
    adapter: 'next',
    test: (pkg, dir) =>
      hasDep(pkg, 'next') || findFirstExisting(dir, ['next.config.js', 'next.config.mjs', 'next.config.ts']),
  },
  {
    type: 'astro',
    adapter: 'astro',
    test: (pkg, dir) =>
      hasDep(pkg, 'astro') || findFirstExisting(dir, ['astro.config.mjs', 'astro.config.js', 'astro.config.ts']),
  },
  {
    type: 'sveltekit',
    adapter: 'generic',
    defaultFlags: ['--host', '0.0.0.0'],
    test: (pkg) => hasDep(pkg, '@sveltejs/kit'),
  },
  {
    type: 'svelte',
    adapter: 'generic',
    defaultFlags: ['--host', '0.0.0.0'],
    test: (pkg, dir) =>
      hasDep(pkg, 'svelte') || findFirstExisting(dir, ['svelte.config.js']),
  },
  {
    type: 'nuxt',
    adapter: 'generic',
    defaultFlags: ['--host', '0.0.0.0'],
    test: (pkg, dir) =>
      hasDep(pkg, 'nuxt') || hasDep(pkg, 'nuxt3') || findFirstExisting(dir, ['nuxt.config.js', 'nuxt.config.ts']),
  },
  {
    type: 'vue',
    adapter: 'generic',
    defaultFlags: ['--host', '0.0.0.0'],
    test: (pkg, dir) =>
      (hasDep(pkg, 'vue') && hasDep(pkg, 'vite')) || findFirstExisting(dir, ['vue.config.js']),
  },
  {
    type: 'remix',
    adapter: 'generic',
    defaultFlags: ['--host', '0.0.0.0'],
    test: (pkg) => hasDep(pkg, '@remix-run/dev') || hasDep(pkg, '@remix-run/react'),
  },
  {
    type: 'angular',
    adapter: 'generic',
    defaultFlags: ['--host', '0.0.0.0'],
    test: (pkg, dir) => hasDep(pkg, '@angular/core') || exists(path.join(dir, 'angular.json')),
  },
  {
    type: 'vite',
    adapter: 'vite',
    test: (pkg, dir) =>
      hasDep(pkg, 'vite') ||
      findFirstExisting(dir, ['vite.config.js', 'vite.config.ts', 'vite.config.mjs']),
  },
];

function hasDep(pkg, name) {
  if (!pkg) return false;
  return Boolean(
    (pkg.dependencies && pkg.dependencies[name]) ||
      (pkg.devDependencies && pkg.devDependencies[name])
  );
}

function looksLikeStaticHtmlProject(dir) {
  return exists(path.join(dir, 'index.html'));
}

/**
 * Detects the project in `dir`.
 * Returns:
 *   {
 *     type: 'html' | 'vite' | 'next' | 'astro' | 'generic',
 *     adapter: same set of names,
 *     dir,
 *     pkg: parsed package.json or null,
 *     hasPackageJson: bool,
 *     devScript: string|null   // pkg.scripts.dev if present
 *     defaultFlags: string[]   // extra flags a generic adapter should try
 *     nodeModulesInstalled: bool
 *   }
 * Throws NoProjectError / MissingDependenciesError when nothing usable found.
 */
function detectProject(dir = process.cwd()) {
  const pkgPath = path.join(dir, 'package.json');
  const hasPackageJson = exists(pkgPath);
  const pkg = hasPackageJson ? readJsonSafe(pkgPath) : null;

  if (hasPackageJson && pkg === null) {
    throw new NoProjectError(dir);
  }

  const nodeModulesInstalled = exists(path.join(dir, 'node_modules'));

  if (hasPackageJson) {
    if (!nodeModulesInstalled) {
      // A package.json exists, declares real dependencies, but
      // nothing is installed. Don't guess — ask the user to install.
      const declaresDeps =
        (pkg.dependencies && Object.keys(pkg.dependencies).length) ||
        (pkg.devDependencies && Object.keys(pkg.devDependencies).length);
      if (declaresDeps) {
        throw new MissingDependenciesError();
      }
    }

    for (const fw of FRAMEWORK_TESTS) {
      if (fw.test(pkg, dir)) {
        return {
          type: fw.type,
          adapter: fw.adapter,
          dir,
          pkg,
          hasPackageJson,
          devScript: (pkg.scripts && pkg.scripts.dev) || null,
          defaultFlags: fw.defaultFlags || [],
          nodeModulesInstalled,
        };
      }
    }

    // Has a package.json but no framework matched. If there's a
    // "dev" script, trust it and use the generic adapter.
    if (pkg.scripts && pkg.scripts.dev) {
      return {
        type: 'generic',
        adapter: 'generic',
        dir,
        pkg,
        hasPackageJson,
        devScript: pkg.scripts.dev,
        defaultFlags: [],
        nodeModulesInstalled,
      };
    }
  }

  // No package.json (or no framework/dev script match) — fall
  // back to plain static HTML if an index.html exists.
  if (looksLikeStaticHtmlProject(dir)) {
    return {
      type: 'html',
      adapter: 'html',
      dir,
      pkg,
      hasPackageJson,
      devScript: null,
      defaultFlags: [],
      nodeModulesInstalled,
    };
  }

  throw new NoProjectError(dir);
}

module.exports = { detectProject, hasDep, exists };
