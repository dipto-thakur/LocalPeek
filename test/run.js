'use strict';

// CAVEMAN: No test framework dependency. Small assert-based runner
// covering detection, port, and network logic — the parts safe to
// test without actually spawning real dev servers on someone's
// machine.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { detectProject } = require('../src/detect.js');
const { isPortFree, findFreePort } = require('../src/port.js');
const { getLanCandidates } = require('../src/network.js');
const {
  NoProjectError,
  MissingDependenciesError,
} = require('../src/errors.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
      console.log(`  \u2713 ${name}`);
    })
    .catch((err) => {
      failed += 1;
      console.log(`  \u2717 ${name}`);
      console.log(`    ${err.message}`);
    });
}

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'localpeek-test-'));
}

function writeFile(dir, name, content) {
  fs.writeFileSync(path.join(dir, name), content);
}

async function main() {
  console.log('\nLocalPeek test suite\n');

  await test('detects a plain HTML project', () => {
    const dir = makeTmpDir();
    writeFile(dir, 'index.html', '<!doctype html><html></html>');
    const project = detectProject(dir);
    assert.strictEqual(project.type, 'html');
  });

  await test('detects a Vite project', () => {
    const dir = makeTmpDir();
    writeFile(dir, 'index.html', '<!doctype html><html></html>');
    writeFile(
      dir,
      'package.json',
      JSON.stringify({
        name: 'demo',
        scripts: { dev: 'vite' },
        devDependencies: { vite: '^5.0.0' },
      })
    );
    fs.mkdirSync(path.join(dir, 'node_modules'));
    const project = detectProject(dir);
    assert.strictEqual(project.type, 'vite');
    assert.strictEqual(project.devScript, 'vite');
  });

  await test('detects a Next.js project', () => {
    const dir = makeTmpDir();
    writeFile(
      dir,
      'package.json',
      JSON.stringify({
        name: 'demo',
        scripts: { dev: 'next dev' },
        dependencies: { next: '^14.0.0', react: '^18.0.0' },
      })
    );
    fs.mkdirSync(path.join(dir, 'node_modules'));
    const project = detectProject(dir);
    assert.strictEqual(project.type, 'next');
  });

  await test('detects an Astro project', () => {
    const dir = makeTmpDir();
    writeFile(
      dir,
      'package.json',
      JSON.stringify({
        name: 'demo',
        scripts: { dev: 'astro dev' },
        dependencies: { astro: '^4.0.0' },
      })
    );
    fs.mkdirSync(path.join(dir, 'node_modules'));
    const project = detectProject(dir);
    assert.strictEqual(project.type, 'astro');
  });

  await test('falls back to generic adapter when a dev script exists but no framework matches', () => {
    const dir = makeTmpDir();
    writeFile(
      dir,
      'package.json',
      JSON.stringify({
        name: 'demo',
        scripts: { dev: 'node server.js' },
      })
    );
    fs.mkdirSync(path.join(dir, 'node_modules'));
    const project = detectProject(dir);
    assert.strictEqual(project.type, 'generic');
  });

  await test('throws NoProjectError for an empty directory', () => {
    const dir = makeTmpDir();
    assert.throws(() => detectProject(dir), NoProjectError);
  });

  await test('throws MissingDependenciesError when deps are declared but not installed', () => {
    const dir = makeTmpDir();
    writeFile(
      dir,
      'package.json',
      JSON.stringify({
        name: 'demo',
        scripts: { dev: 'vite' },
        devDependencies: { vite: '^5.0.0' },
      })
    );
    // no node_modules created on purpose
    assert.throws(() => detectProject(dir), MissingDependenciesError);
  });

  await test('finds a free port', async () => {
    const port = await findFreePort(45000);
    assert.ok(port >= 45000);
    const free = await isPortFree(port);
    assert.strictEqual(free, true);
  });

  await test('detects an occupied port as not free', async () => {
    const net = require('net');
    const server = net.createServer();
    await new Promise((resolve) => server.listen(45100, '0.0.0.0', resolve));
    const free = await isPortFree(45100);
    assert.strictEqual(free, false);
    await new Promise((resolve) => server.close(resolve));
  });

  await test('network candidate scan does not throw', () => {
    const candidates = getLanCandidates();
    assert.ok(Array.isArray(candidates));
  });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exitCode = failed > 0 ? 1 : 0;
}

main();
